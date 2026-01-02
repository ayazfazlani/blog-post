import { NextResponse } from "next/server";

export async function GET() {
  // Get IP from headers (set by proxy/load balancer)
  const forwarded = process.env.NEXT_PUBLIC_SITE_URL || "";
  const ip = forwarded || "unknown";

  return NextResponse.json({ ip });
}

