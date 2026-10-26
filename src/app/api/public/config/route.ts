import { NextResponse } from "next/server";
import { isEmailEnabled } from "@/lib/email";

export const runtime = "nodejs";

/** Public, non-sensitive feature flags for the sign-in pages. */
export async function GET() {
  return NextResponse.json({ emailEnabled: isEmailEnabled() });
}
