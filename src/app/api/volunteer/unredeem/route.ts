import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/service";
import { withErrorHandling } from "@/lib/api/route-handler";

type UnredeemBibCheckResult = {
  status: "unredeemed" | "already_unredeemed" | "no_prize" | "not_checked";
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
    return NextResponse.json({ error: "Enter a bib number." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: unredeemData, error: unredeemError } = await supabase
    .rpc("unredeem_bib_check", { p_bib_number: bibNumber })
    .single();
  const unredeem = unredeemData as UnredeemBibCheckResult | null;

  if (unredeemError || !unredeem) {
    console.error(unredeemError);
    return NextResponse.json({ error: "Couldn't undo. Try again." }, { status: 500 });
  }

  if (unredeem.status === "not_checked") {
    return NextResponse.json({ status: "not_checked" }, { status: 409 });
  }

  return NextResponse.json({
    status: unredeem.status,
    bibNumber: unredeem.bib_number,
    prizeType: unredeem.prize_type,
    prizeNumber: unredeem.prize_number,
    redeemedAt: unredeem.redeemed_at,
  });
});
