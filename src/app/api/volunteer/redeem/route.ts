import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/service";
import { withErrorHandling } from "@/lib/api/route-handler";

type RedeemBibCheckResult = {
  status: "redeemed" | "already_redeemed" | "no_prize" | "not_checked";
  bib_number: number;
  prize_type: "prize" | null;
  prize_number: number | null;
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
    return NextResponse.json({ error: "Enter a whole number." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: redeemData, error: redeemError } = await supabase
    .rpc("redeem_bib_check", { p_bib_number: bibNumber })
    .single();
  const redeem = redeemData as RedeemBibCheckResult | null;

  if (redeemError || !redeem) {
    console.error(redeemError);
    return NextResponse.json({ error: "Unable to redeem bib number." }, { status: 500 });
  }

  if (redeem.status === "not_checked") {
    return NextResponse.json(
      { status: "not_checked", error: "Racer has not checked a raffle spot." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    status: redeem.status,
    bibNumber: redeem.bib_number,
    prizeType: redeem.prize_type,
    prizeNumber: redeem.prize_number,
    redeemedAt: redeem.redeemed_at,
  });
});
