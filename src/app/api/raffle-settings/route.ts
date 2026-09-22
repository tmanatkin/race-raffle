import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandling } from "@/lib/api/route-handler";

export const GET = withErrorHandling(async () => {
  const supabase = await createClient();
  const [{ data: generation, error: generationError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase
      .from("raffle_generations")
      .select("prize_count")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("raffle_settings")
      .select("lowest_bib_number, highest_bib_number")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (generationError || settingsError) {
    console.error(generationError ?? settingsError);
    return NextResponse.json({ error: "Unable to load raffle settings." }, { status: 500 });
  }

  return NextResponse.json({
    lowestBibNumber: settings?.lowest_bib_number ?? 0,
    highestBibNumber: settings?.highest_bib_number ?? 0,
    prizes: generation?.prize_count ?? 0,
  });
});
