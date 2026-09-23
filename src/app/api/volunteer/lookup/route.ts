import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/service";
import { withErrorHandling } from "@/lib/api/route-handler";

type LookupStatus = "not_checked" | "no_prize" | "unredeemed" | "already_redeemed";

// Read-only lookup so volunteers can confirm a racer's result before marking the prize as redeemed.
export const GET = withErrorHandling(async (request: Request) => {
  const bibNumberParam = new URL(request.url).searchParams.get("bibNumber");
  const bibNumber = bibNumberParam === null || bibNumberParam === "" ? NaN : Number(bibNumberParam);

  if (!Number.isInteger(bibNumber)) {
    return NextResponse.json({ error: "Enter a whole number." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: check, error: checkError } = await supabase
    .from("bib_checks")
    .select("generation_id, raffle_position, prize_type, redeemed_at")
    .eq("bib_number", bibNumber)
    .maybeSingle();

  if (checkError) {
    console.error(checkError);
    return NextResponse.json({ error: "Unable to look up bib number." }, { status: 500 });
  }

  if (!check) {
    const status: LookupStatus = "not_checked";
    return NextResponse.json({ status, bibNumber, prizeNumber: null, redeemedAt: null });
  }

  const { data: entry, error: entryError } = await supabase
    .from("raffle_entries")
    .select("prize_number")
    .eq("generation_id", check.generation_id)
    .eq("position", check.raffle_position)
    .maybeSingle();

  if (entryError) {
    console.error(entryError);
    return NextResponse.json({ error: "Unable to look up bib number." }, { status: 500 });
  }

  let status: LookupStatus;
  if (check.prize_type === null) {
    status = "no_prize";
  } else if (check.redeemed_at !== null) {
    status = "already_redeemed";
  } else {
    status = "unredeemed";
  }

  return NextResponse.json({
    status,
    bibNumber,
    prizeNumber: status === "no_prize" ? null : (entry?.prize_number ?? null),
    redeemedAt: check.redeemed_at,
  });
});
