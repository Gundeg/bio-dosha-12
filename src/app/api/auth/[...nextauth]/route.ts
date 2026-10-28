import type { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";

export const runtime = "nodejs";

// Read the handlers on each request, never at module load. On Netlify a cold
// instance can evaluate this module before @/lib/auth has finished loading; a
// top-level `export const { GET, POST } = handlers` then throws once and every
// later sign-out and session check on that instance fails with a 500.
export function GET(req: NextRequest) {
  return handlers.GET(req);
}

export function POST(req: NextRequest) {
  return handlers.POST(req);
}
