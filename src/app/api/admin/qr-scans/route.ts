import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/service";
import { withErrorHandling } from "@/lib/api/route-handler";

export const GET = withErrorHandling(async () => {
  const supabase = await createClient();

  const { count, error } = await supabase.from("qr_scans").select("*", { count: "exact", head: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load QR scan stats." }, { status: 500 });
  }

  const { data: latestScan, error: latestScanError } = await supabase
    .from("qr_scans")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestScanError) {
    console.error(latestScanError);
    return NextResponse.json({ error: "Unable to load QR scan stats." }, { status: 500 });
  }

  return NextResponse.json({
    totalScans: count ?? 0,
    latestScanAt: latestScan?.created_at ?? null,
  });
});

export const DELETE = withErrorHandling(async () => {
  const supabase = await createClient();

  const { error } = await supabase.from("qr_scans").delete().not("id", "is", null);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to reset QR scan stats." }, { status: 500 });
  }

  return NextResponse.json({ totalScans: 0, latestScanAt: null });
});
