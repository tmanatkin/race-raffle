import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type BibCheckResult = {
  status: "checked" | "already_checked" | "invalid" | "no_generation" | "list_exhausted";
  bib_number: number;
  generation_id: string | null;
  raffle_position: number | null;
  prize_type: "prize" | null;
  redeemed_at: string | null;
};

export async function GET() {
  const supabase = await createClient();
  const { data: settings, error } = await supabase
    .from("raffle_settings")
    .select("lowest_bib_number, highest_bib_number")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ error: "Unable to load bib number range settings." }, { status: 500 });
  }

  return NextResponse.json({
    lowestBibNumber: settings.lowest_bib_number,
    highestBibNumber: settings.highest_bib_number,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { bibNumber?: number };
  const bibNumber = body.bibNumber;
  const supabase = await createClient();

  if (typeof bibNumber !== "number" || !Number.isInteger(bibNumber)) {
    return NextResponse.json({ error: "Enter a whole number." }, { status: 400 });
  }

  const { data: checkData, error: checkError } = await supabase
    .rpc("check_bib_number", { p_bib_number: bibNumber })
    .single();
  const check = checkData as BibCheckResult | null;

  if (checkError || !check) {
    return NextResponse.json({ error: "Unable to check bib number." }, { status: 500 });
  }

  if (check.status === "invalid") {
    return NextResponse.json({ error: "Invalid bib number." }, { status: 400 });
  }

  if (check.status === "no_generation") {
    return NextResponse.json({ error: "Prize raffle is not available yet." }, { status: 409 });
  }

  if (check.status === "list_exhausted") {
    return NextResponse.json({ error: "The raffle has reached its participant limit." }, { status: 409 });
  }

  return NextResponse.json({
    checked: check.status === "checked",
    alreadyChecked: check.status === "already_checked",
    bibNumber: check.bib_number,
    rafflePosition: check.raffle_position,
    prizeType: check.prize_type,
    redeemedAt: check.redeemed_at,
  });
}
