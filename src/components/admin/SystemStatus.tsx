"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Callout, PageHeader, Section, StatusBadge, useApiQuery, type BadgeTone } from "@/components/kit";
import { formatNumber } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import { LoadFailure, PageSkeleton, StaleNotice, SuperadminOnly } from "./AdminStates";
import { useAdminViewer } from "./AdminViewer";
import { DateText } from "./badges";

/** GET /api/admin/system */
interface SystemResponse {
  checks: {
    encryptionKey: "ok" | "missing" | "invalid";
    authSecret: boolean;
    appUrl: string | null;
    email: { enabled: boolean; from: string | null };
    database: { ok: boolean; latencyMs: number; error: string | null };
  };
  security: {
    plaintextSensitiveValues: { model: string; field: string; count: number }[] | null;
    staffWithoutMfa: number;
    pendingInvites: number;
    auditLogRows: number;
  };
  migrations: { name: string; finishedAt: string | null; rolledBack: boolean }[];
  formula: {
    locked: boolean;
    expression: string;
    thresholds: { khiiBelow: number; sharBadganAbove: number };
    precision: number;
    seasonCoefficients: Record<string, number>;
  };
  runtime: { node: string; commit: string | null; deployContext: string; region: string | null };
}

type CheckState = "ok" | "warning" | "danger" | "info";

const STATE_TONE: Record<CheckState, BadgeTone> = { ok: "success", warning: "warning", danger: "danger", info: "info" };
const STATE_ICON: Record<CheckState, string> = { ok: "check_circle", warning: "warning", danger: "error", info: "info" };
const SEASONS = ["WINTER", "SPRING", "SUMMER", "AUTUMN"] as const;
const SLOW_DB_MS = 1000;

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[12px] text-on-surface">{children}</code>;
}

function CommandBlock({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg bg-inverse-surface px-3 py-2 font-mono text-[12px] text-inverse-on-surface">
      <code>{children}</code>
    </pre>
  );
}

/** One check: what was checked, its state in words, and what to do about it. */
function CheckRow({
  icon,
  title,
  state,
  children,
}: {
  icon: string;
  title: string;
  state: CheckState;
  children: React.ReactNode;
}) {
  const t = useTranslations("admin");
  return (
    <li className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
      <span
        className="material-symbols-outlined mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-container text-[20px] text-on-surface-variant"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-on-surface">{title}</p>
          <StatusBadge tone={STATE_TONE[state]} icon={STATE_ICON[state]}>
            {t(`system.state.${state}`)}
          </StatusBadge>
        </div>
        <div className="mt-1 space-y-1 break-words text-sm text-on-surface-variant">{children}</div>
      </div>
    </li>
  );
}

function signed(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `+${n}`;
}

function SystemStatusView() {
  const t = useTranslations("admin");
  const ts = useTranslations("shared");
  const { data, error, loading, reload } = useApiQuery<SystemResponse>("/api/admin/system");

  const header = (
    <PageHeader
      eyebrow={t("system.eyebrow")}
      title={t("system.title")}
      description={t("system.description")}
      actions={
        <Button variant="outline" className="h-10 px-4" onClick={reload} disabled={loading}>
          <span className={cn("material-symbols-outlined text-[20px]", loading && "motion-safe:animate-spin")} aria-hidden="true">
            refresh
          </span>
          {t("system.recheck")}
        </Button>
      }
    />
  );

  if (!data) {
    if (error) {
      return (
        <div>
          {header}
          <LoadFailure error={error} onRetry={reload} />
        </div>
      );
    }
    return <PageSkeleton sections={4} />;
  }

  const { checks, security, migrations, formula, runtime } = data;
  const plaintextTotal = security.plaintextSensitiveValues?.reduce((sum, f) => sum + f.count, 0) ?? null;
  const latestApplied = migrations.find((m) => m.finishedAt && !m.rolledBack) ?? null;
  // A rolled-back attempt that was applied again later is history, not a problem.
  const appliedNames = new Set(migrations.filter((m) => m.finishedAt && !m.rolledBack).map((m) => m.name));
  const brokenMigration = migrations.find((m) => !appliedNames.has(m.name)) ?? null;

  const states: CheckState[] = [
    checks.encryptionKey === "ok" ? "ok" : "danger",
    checks.authSecret ? "ok" : "danger",
    checks.appUrl ? "ok" : "warning",
    checks.email.enabled ? "ok" : "info",
    !checks.database.ok ? "danger" : checks.database.latencyMs > SLOW_DB_MS ? "warning" : "ok",
    plaintextTotal === null ? "info" : plaintextTotal > 0 ? "warning" : "ok",
    security.staffWithoutMfa > 0 ? "warning" : "ok",
    brokenMigration ? "warning" : "ok",
  ];
  const issues = states.filter((s) => s === "danger" || s === "warning").length;
  const critical = states.some((s) => s === "danger");

  return (
    <div className="space-y-6">
      {header}
      <StaleNotice error={error} onRetry={reload} />

      <div aria-live="polite">
        {issues === 0 ? (
          <Callout tone="success" title={t("system.summary.okTitle")}>
            {t("system.summary.okBody")}
          </Callout>
        ) : (
          <Callout tone={critical ? "danger" : "warning"} title={t("system.summary.issuesTitle", { count: issues })}>
            {t("system.summary.issuesBody")}
          </Callout>
        )}
      </div>

      <Section id="system-config" title={t("system.config.title")} description={t("system.config.description")}>
        <ul className="divide-y divide-outline-variant/20">
          <CheckRow icon="key" title={t("system.encryption.title")} state={states[0]}>
            {checks.encryptionKey === "ok" ? (
              <p>{t("system.encryption.ok")}</p>
            ) : (
              <>
                <p className="font-medium text-red-800">
                  {checks.encryptionKey === "missing" ? t("system.encryption.missing") : t("system.encryption.invalid")}
                </p>
                <p>{t("system.encryption.fix")}</p>
                <CommandBlock>{`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`}</CommandBlock>
              </>
            )}
            <p>{t("system.encryption.keepCopy")}</p>
          </CheckRow>

          <CheckRow icon="vpn_key" title={t("system.authSecret.title")} state={states[1]}>
            <p>{checks.authSecret ? t("system.authSecret.ok") : t("system.authSecret.missing")}</p>
          </CheckRow>

          <CheckRow icon="link" title={t("system.appUrl.title")} state={states[2]}>
            {checks.appUrl ? (
              <p>
                {t("system.appUrl.ok")} <Code>{checks.appUrl}</Code>
              </p>
            ) : (
              <p>{t("system.appUrl.missing")}</p>
            )}
          </CheckRow>

          <CheckRow icon="mail" title={t("system.email.title")} state={states[3]}>
            {checks.email.enabled ? (
              <p>
                {t("system.email.ok")} {checks.email.from && <Code>{checks.email.from}</Code>}
              </p>
            ) : (
              <>
                <p>{t("system.email.off")}</p>
                <p>
                  {t("system.email.howToEnable")} <Code>RESEND_API_KEY</Code> · <Code>EMAIL_FROM</Code>
                </p>
              </>
            )}
          </CheckRow>

          <CheckRow icon="database" title={t("system.database.title")} state={states[4]}>
            {checks.database.ok ? (
              <p>
                {t("system.database.ok", { ms: formatNumber(checks.database.latencyMs) })}
                {checks.database.latencyMs > SLOW_DB_MS && ` ${t("system.database.slow")}`}
              </p>
            ) : (
              <>
                <p className="font-medium text-red-800">{t("system.database.down")}</p>
                {checks.database.error && <CommandBlock>{checks.database.error}</CommandBlock>}
              </>
            )}
          </CheckRow>
        </ul>
      </Section>

      <Section id="system-security" title={t("system.security.title")} description={t("system.security.description")}>
        <ul className="divide-y divide-outline-variant/20">
          <CheckRow icon="enhanced_encryption" title={t("system.plaintext.title")} state={states[5]}>
            {plaintextTotal === null ? (
              <p>{t("system.plaintext.unknown")}</p>
            ) : plaintextTotal === 0 ? (
              <p>{t("system.plaintext.ok")}</p>
            ) : (
              <>
                <p>{t("system.plaintext.found", { count: plaintextTotal, value: formatNumber(plaintextTotal) })}</p>
                <CommandBlock>npx tsx scripts/encrypt-existing-data.ts</CommandBlock>
              </>
            )}
            {security.plaintextSensitiveValues && security.plaintextSensitiveValues.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer rounded text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-primary">
                  {t("system.plaintext.details")}
                </summary>
                <table className="mt-2 w-full text-left text-xs">
                  <caption className="sr-only">{t("system.plaintext.details")}</caption>
                  <thead>
                    <tr className="text-on-surface-variant">
                      <th scope="col" className="py-1 pr-3 font-semibold">
                        {t("system.plaintext.field")}
                      </th>
                      <th scope="col" className="py-1 text-right font-semibold">
                        {t("system.plaintext.count")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {security.plaintextSensitiveValues.map((f) => (
                      <tr key={`${f.model}.${f.field}`} className="border-t border-outline-variant/20">
                        <td className="py-1 pr-3 font-mono text-on-surface">
                          {f.model}.{f.field}
                        </td>
                        <td className={cn("py-1 text-right tabular-nums", f.count > 0 ? "font-semibold text-amber-800" : "text-on-surface")}>
                          {formatNumber(f.count)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </CheckRow>

          <CheckRow icon="admin_panel_settings" title={t("system.staffMfa.title")} state={states[6]}>
            <p>
              {security.staffWithoutMfa > 0
                ? t("system.staffMfa.missing", { count: security.staffWithoutMfa })
                : t("system.staffMfa.ok")}
            </p>
            {security.staffWithoutMfa > 0 && (
              <Link href="/admin/users?type=staff" className="font-medium text-primary hover:underline">
                {t("system.staffMfa.link")}
              </Link>
            )}
          </CheckRow>

          <CheckRow icon="forward_to_inbox" title={t("system.invites.title")} state="info">
            <p>{t("system.invites.body", { count: security.pendingInvites })}</p>
            <Link href="/admin/invites?state=pending" className="font-medium text-primary hover:underline">
              {t("system.invites.link")}
            </Link>
          </CheckRow>

          <CheckRow icon="receipt_long" title={t("system.audit.title")} state="info">
            <p>{t("system.audit.body", { count: security.auditLogRows, value: formatNumber(security.auditLogRows) })}</p>
            <Link href="/admin/audit" className="font-medium text-primary hover:underline">
              {t("system.audit.link")}
            </Link>
          </CheckRow>
        </ul>
      </Section>

      <Section id="system-migrations" title={t("system.migrations.title")} description={t("system.migrations.description")}>
        <ul className="divide-y divide-outline-variant/20">
          <CheckRow icon="deployed_code" title={t("system.migrations.latest")} state={states[7]}>
            {latestApplied ? (
              <p>
                <Code>{latestApplied.name}</Code> · <DateText value={latestApplied.finishedAt} withTime />
              </p>
            ) : (
              <p>{t("system.migrations.none")}</p>
            )}
            {brokenMigration && (
              <p className="font-medium text-amber-900">{t("system.migrations.broken", { name: brokenMigration.name })}</p>
            )}
          </CheckRow>
        </ul>
        {migrations.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer rounded text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-primary">
              {t("system.migrations.showAll", { count: migrations.length })}
            </summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">{t("system.migrations.title")}</caption>
                <thead>
                  <tr className="text-on-surface-variant">
                    <th scope="col" className="py-1.5 pr-3 font-semibold">
                      {t("system.migrations.name")}
                    </th>
                    <th scope="col" className="py-1.5 pr-3 font-semibold">
                      {t("system.migrations.applied")}
                    </th>
                    <th scope="col" className="py-1.5 font-semibold">
                      {t("system.migrations.status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {migrations.map((m, i) => (
                    <tr key={`${m.name}-${i}`} className="border-t border-outline-variant/20">
                      <td className="py-1.5 pr-3 font-mono text-on-surface">{m.name}</td>
                      <td className="whitespace-nowrap py-1.5 pr-3">
                        <DateText value={m.finishedAt} withTime />
                      </td>
                      <td className="py-1.5">
                        {m.rolledBack ? (
                          <StatusBadge tone="warning">{t("system.migrations.rolledBack")}</StatusBadge>
                        ) : m.finishedAt ? (
                          <StatusBadge tone="success">{t("system.migrations.done")}</StatusBadge>
                        ) : (
                          <StatusBadge tone="warning">{t("system.migrations.unfinished")}</StatusBadge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </Section>

      <Section
        id="system-formula"
        title={
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
              lock
            </span>
            {t("system.formula.title")}
          </span>
        }
        description={t("system.formula.description")}
        bodyClassName="space-y-4"
      >
        <Callout tone="info" icon="lock">
          {t("system.formula.locked")}
        </Callout>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">{t("system.formula.expression")}</p>
          <p className="mt-1 overflow-x-auto rounded-lg bg-surface-container-low px-3 py-2 font-mono text-sm text-on-surface">
            {formula.expression}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">{t("system.formula.thresholds")}</p>
            <ul className="mt-1 space-y-1 text-sm text-on-surface">
              <li className="flex justify-between gap-3">
                <span className="font-mono">Δ &lt; {signed(formula.thresholds.khiiBelow)}</span>
                <span>{ts("status.khii_excess")}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="font-mono">
                  {signed(formula.thresholds.khiiBelow)} ≤ Δ ≤ {signed(formula.thresholds.sharBadganAbove)}
                </span>
                <span>{ts("status.balanced")}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="font-mono">Δ &gt; {signed(formula.thresholds.sharBadganAbove)}</span>
                <span>{ts("status.shar_badgan_excess")}</span>
              </li>
            </ul>
            <p className="mt-2 text-xs text-on-surface-variant">{t("system.formula.precision", { count: formula.precision })}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">{t("system.formula.seasons")}</p>
            <dl className="mt-1 space-y-1 text-sm text-on-surface">
              {SEASONS.filter((s) => s in formula.seasonCoefficients).map((season) => (
                <div key={season} className="flex justify-between gap-3">
                  <dt>{ts(`season.${season}`)}</dt>
                  <dd className="font-mono tabular-nums">{formula.seasonCoefficients[season].toFixed(1)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      <Section id="system-runtime" title={t("system.runtime.title")}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("system.runtime.node"), value: runtime.node },
            { label: t("system.runtime.commit"), value: runtime.commit ? runtime.commit.slice(0, 7) : "—", title: runtime.commit ?? undefined },
            { label: t("system.runtime.context"), value: runtime.deployContext },
            { label: t("system.runtime.region"), value: runtime.region ?? "—" },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">{item.label}</dt>
              <dd className="mt-1 break-words font-mono text-sm text-on-surface" title={item.title}>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </Section>
    </div>
  );
}

/** Configuration and health checks (superadmin only). */
export function SystemStatus() {
  const t = useTranslations("admin");
  const viewer = useAdminViewer();
  if (!viewer.isSuperadmin) {
    return (
      <div>
        <PageHeader eyebrow={t("system.eyebrow")} title={t("system.title")} />
        <SuperadminOnly title={t("system.onlySuperadminTitle")} body={t("system.onlySuperadminBody")} />
      </div>
    );
  }
  return <SystemStatusView />;
}
