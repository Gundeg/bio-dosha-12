import { NextRequest, NextResponse } from "next/server";
import { actorOf, requireAuth } from "@/lib/authz";
import { handle } from "@/lib/http";
import { bumpSessionVersion } from "@/lib/accountLifecycle";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/** Ends every session of this account, on every device. */
export const POST = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  await bumpSessionVersion(ctx.userId);
  await audit({ action: "auth.signout_all", actor: actorOf(ctx), headers: req.headers });
  return NextResponse.json({ ok: true, signedOut: true });
});
