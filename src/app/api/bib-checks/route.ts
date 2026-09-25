import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandling } from "@/lib/api/route-handler";

type BibCheckResult = {
  status: "checked" | "already_checked" | "invalid" | "no_generation" | "no_racers" | "list_exhausted";
  bib_number: number;
  generation_id: string | null;
  raffle_position: number | null;
  prize_type: "prize" | null;
  redeemed_at: string | null;
};

export const POST = withErrorHandling(async (request: Request) => {
  let bibNumber: number | undefined;
  try {
    const body = (await request.json()) as { bibNumber?: number };
    bibNumber = body.bibNumber;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof bibNumber !== "number" || !Number.isInteger(bibNumber)) {
    return NextResponse.json({ error: "Enter a bib number." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: checkData, error: checkError } = await supabase
    .rpc("check_bib_number", { p_bib_number: bibNumber })
    .single();
  const check = checkData as BibCheckResult | null;

  if (checkError || !check) {
    console.error(checkError);
    return NextResponse.json({ error: "Couldn't check bib. Try again." }, { status: 500 });
  }

  if (check.status === "invalid") {
    return NextResponse.json({ error: "Invalid bib number." }, { status: 400 });
  }

  if (check.status === "no_generation" || check.status === "no_racers") {
    return NextResponse.json({ error: "Raffle opens after the race." }, { status: 409 });
  }

  if (check.status === "list_exhausted") {
    return NextResponse.json({ error: "Raffle is currently full." }, { status: 409 });
  }

  return NextResponse.json({
    checked: check.status === "checked",
    alreadyChecked: check.status === "already_checked",
    bibNumber: check.bib_number,
    rafflePosition: check.raffle_position,
    prizeType: check.prize_type,
    redeemedAt: check.redeemed_at,
  });
});
