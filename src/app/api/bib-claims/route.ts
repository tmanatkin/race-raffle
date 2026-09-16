import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type BibClaimResult = {
  status: "claimed" | "already_claimed" | "invalid" | "no_generation" | "list_exhausted";
  bib_number: number;
  generation_id: string | null;
  raffle_position: number | null;
  prize_type: "prize" | null;
};

export async function GET() {
  const supabase = await createClient();
  const { data: settings, error } = await supabase
    .from("raffle_settings")
    .select("highest_bib_number")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ error: "Unable to load bib number settings." }, { status: 500 });
  }

  return NextResponse.json({ highestBibNumber: settings.highest_bib_number });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { bibNumber?: number };
  const bibNumber = body.bibNumber;
  const supabase = await createClient();

  if (typeof bibNumber !== "number" || !Number.isInteger(bibNumber)) {
    return NextResponse.json({ error: "Enter a whole number." }, { status: 400 });
  }

  const { data: claimData, error: claimError } = await supabase
    .rpc("claim_bib_number", { p_bib_number: bibNumber })
    .single();
  const claim = claimData as BibClaimResult | null;

  if (claimError || !claim) {
    return NextResponse.json({ error: "Unable to claim bib number." }, { status: 500 });
  }

  if (claim.status === "invalid") {
    return NextResponse.json({ error: "Invalid bib number." }, { status: 400 });
  }

  if (claim.status === "no_generation") {
    return NextResponse.json({ error: "Prize raffle is not available yet." }, { status: 409 });
  }

  if (claim.status === "list_exhausted") {
    return NextResponse.json({ error: "The raffle list is full." }, { status: 409 });
  }

  return NextResponse.json({
    claimed: claim.status === "claimed",
    alreadyClaimed: claim.status === "already_claimed",
    bibNumber: claim.bib_number,
    rafflePosition: claim.raffle_position,
    prizeType: claim.prize_type,
  });
}
