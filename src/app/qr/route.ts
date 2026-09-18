import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { error } = await supabase.from("qr_scans").insert({});

  if (error) {
    console.error("Failed to record QR scan:", error);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
