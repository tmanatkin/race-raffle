import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RaffleEntry = {
  position: number;
  prizeType: "prize" | null;
};

type RaffleGeneration = {
  prizes: number;
  racers: number;
};

export async function GET() {
  const supabase = await createClient();
  const [{ data: generation, error: generationError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase
      .from("raffle_generations")
      .select("id, prize_count, racer_count, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("raffle_settings")
      .select("lowest_bib_number, highest_bib_number, updated_at")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (generationError || settingsError) {
    return NextResponse.json({ error: "Unable to load the saved raffle." }, { status: 500 });
  }

  if (!generation) {
    return NextResponse.json({
      generation: null,
      bibSettings: {
        lowestBibNumber: settings?.lowest_bib_number ?? 0,
        highestBibNumber: settings?.highest_bib_number ?? 0,
        bibLastSavedAt: settings?.updated_at ?? null,
      },
      entries: [],
    });
  }

  const { data: entries, error: entriesError } = await supabase
    .from("raffle_entries")
    .select("position, prize_type")
    .eq("generation_id", generation.id)
    .order("position", { ascending: true });

  if (entriesError) {
    return NextResponse.json({ error: "Unable to load the saved raffle." }, { status: 500 });
  }

  const { data: checks, error: checksError } = await supabase
    .from("bib_checks")
    .select("bib_number, raffle_position, redeemed_at")
    .eq("generation_id", generation.id);

  if (checksError) {
    return NextResponse.json({ error: "Unable to load the saved raffle." }, { status: 500 });
  }

  const bibByPosition = new Map(checks.map((check) => [check.raffle_position, check.bib_number]));
  const redeemedAtByPosition = new Map(checks.map((check) => [check.raffle_position, check.redeemed_at]));

  return NextResponse.json({
    generation: {
      prizes: generation.prize_count,
      racers: generation.racer_count,
      lowestBibNumber: settings?.lowest_bib_number ?? 0,
      highestBibNumber: settings?.highest_bib_number ?? 0,
      generatedAt: generation.created_at,
      bibLastSavedAt: settings?.updated_at ?? null,
    },
    entries: entries.map((entry) => ({
      position: entry.position,
      prizeType: entry.prize_type as "prize" | null,
      bibNumber: bibByPosition.get(entry.position) ?? null,
      redeemedAt: redeemedAtByPosition.get(entry.position) ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    generation?: RaffleGeneration;
    entries?: RaffleEntry[];
  };

  if (!body.generation || !Array.isArray(body.entries)) {
    return NextResponse.json({ error: "A raffle generation and entries are required." }, { status: 400 });
  }

  const { prizes, racers } = body.generation;
  if (
    ![prizes, racers].every((value) => Number.isInteger(value) && value >= 0) ||
    racers < 0 ||
    body.entries.length !== racers
  ) {
    return NextResponse.json({ error: "The raffle generation values are invalid." }, { status: 400 });
  }

  const isValid = body.entries.every(
    (entry, index) => entry.position === index + 1 && (entry.prizeType === null || entry.prizeType === "prize")
  );

  if (!isValid) {
    return NextResponse.json({ error: "Raffle entries have an invalid order or prize type." }, { status: 400 });
  }

  const generationId = randomUUID();
  const supabase = await createClient();
  const { error: checksResetError } = await supabase.from("bib_checks").delete().not("bib_number", "is", null);

  if (checksResetError) {
    return NextResponse.json({ error: "Unable to reset bib assignments." }, { status: 500 });
  }

  const { data: savedGeneration, error: generationError } = await supabase
    .from("raffle_generations")
    .insert({
      id: generationId,
      prize_count: prizes,
      racer_count: racers,
    })
    .select("created_at")
    .single();

  if (generationError) {
    return NextResponse.json({ error: "Unable to save the generated list." }, { status: 500 });
  }

  const { error: entriesError } = await supabase.from("raffle_entries").insert(
    body.entries.map((entry) => ({
      generation_id: generationId,
      position: entry.position,
      prize_type: entry.prizeType,
    }))
  );

  if (entriesError) {
    await supabase.from("raffle_generations").delete().eq("id", generationId);
    return NextResponse.json({ error: "Unable to save the generated list." }, { status: 500 });
  }

  return NextResponse.json({
    generationId,
    generatedAt: savedGeneration.created_at,
  });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { lowestBibNumber?: number; highestBibNumber?: number };
  const lowestBibNumber = body.lowestBibNumber;
  const highestBibNumber = body.highestBibNumber;

  if (
    typeof lowestBibNumber !== "number" ||
    !Number.isInteger(lowestBibNumber) ||
    lowestBibNumber < 0 ||
    typeof highestBibNumber !== "number" ||
    !Number.isInteger(highestBibNumber) ||
    highestBibNumber < 0
  ) {
    return NextResponse.json({ error: "The bib number range must be whole numbers of at least 0." }, { status: 400 });
  }

  if (lowestBibNumber > highestBibNumber) {
    return NextResponse.json({ error: "The lowest bib number cannot be greater than the highest." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("raffle_settings")
    .update({
      lowest_bib_number: lowestBibNumber,
      highest_bib_number: highestBibNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (updateError) {
    return NextResponse.json({ error: "Unable to save the bib number range." }, { status: 500 });
  }

  const { data: updatedSettings } = await supabase.from("raffle_settings").select("updated_at").eq("id", 1).single();

  return NextResponse.json({ bibLastSavedAt: updatedSettings?.updated_at ?? null });
}
