import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actorOf, requireStaff } from "@/lib/authz";
import { handle } from "@/lib/http";
import { auditQuery, pageArgs } from "@/lib/schemas/admin";
import { AUDIT_ACTIONS, audit } from "@/lib/audit";
import type { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";

const CSV_MAX_ROWS = 10_000;

/** Quotes a CSV cell and defuses spreadsheet formulas (CSV injection). */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString() : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Security log viewer and export. Superadmin only. */
export const GET = handle(async (req: NextRequest) => {
  const ctx = await requireStaff("SUPERADMIN");
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const { action, actor, organizationId, targetId, from, to, format, page, pageSize } = auditQuery.parse(params);

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action: { startsWith: action } } : {}),
    ...(actor ? { actorEmail: { contains: actor, mode: "insensitive" } } : {}),
    ...(organizationId ? { organizationId } : {}),
    ...(targetId ? { targetId } : {}),
    ...(from || to ? { at: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
  };

  if (format === "csv") {
    const rows = await prisma.auditLog.findMany({ where, orderBy: { at: "desc" }, take: CSV_MAX_ROWS });
    const header = ["at", "action", "actorEmail", "actorRole", "organizationId", "targetType", "targetId", "ip", "userAgent", "meta"];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [r.at, r.action, r.actorEmail, r.actorRole, r.organizationId, r.targetType, r.targetId, r.ip, r.userAgent, r.meta]
          .map(csvCell)
          .join(",")
      ),
    ];
    await audit({
      action: "admin.audit.exported",
      actor: actorOf(ctx),
      targetType: "audit",
      meta: { rows: rows.length, filtered: Object.keys(where).length > 0 },
      headers: req.headers,
    });
    const stamp = new Date().toISOString().slice(0, 10);
    // BOM so Excel opens UTF-8 (Mongolian text) correctly.
    return new NextResponse("﻿" + lines.join("\r\n"), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="audit-log-${stamp}.csv"`,
        "cache-control": "private, no-store",
      },
    });
  }

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { at: "desc" }, ...pageArgs(page, pageSize) }),
  ]);
  return NextResponse.json({ total, page, pageSize, items, actions: AUDIT_ACTIONS });
});
