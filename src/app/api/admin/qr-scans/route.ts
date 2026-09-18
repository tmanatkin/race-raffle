import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { count, error } = await supabase.from("qr_scans").select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ error: "Unable to load QR scan stats." }, { status: 500 });
  }

  const { data: latestScan, error: latestScanError } = await supabase
    .from("qr_scans")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestScanError) {
    return NextResponse.json({ error: "Unable to load QR scan stats." }, { status: 500 });
  }

  return NextResponse.json({
    totalScans: count ?? 0,
    latestScanAt: latestScan?.created_at ?? null,
  });
}
