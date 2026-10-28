"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/states";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** The column whose cell links to the row (one per table). */
  primary?: boolean;
  className?: string;
  headerClassName?: string;
  /** Hidden in the phone card view (the cell is still in the desktop table). */
  hideOnMobile?: boolean;
  align?: "left" | "right";
}

/**
 * Responsive list: a table from md up, stacked cards on phones. With `rowHref`
 * the primary cell is a real link (keyboard and screen readers) and the whole
 * row is clickable for mouse users.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  loading,
  empty,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  loading?: boolean;
  empty?: React.ReactNode;
  /** Accessible table name. */
  caption: string;
}) {
  const router = useRouter();
  const t = useTranslations("kit");

  if (loading && rows.length === 0) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return <div className="py-10 text-center text-sm text-on-surface-variant">{empty ?? t("empty")}</div>;
  }

  const primary = columns.find((c) => c.primary) ?? columns[0];
  const renderPrimary = (row: T) =>
    rowHref ? (
      <Link
        href={rowHref(row)}
        className="font-semibold text-on-surface hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
      >
        {primary.cell(row)}
      </Link>
    ) : (
      primary.cell(row)
    );

  return (
    <div className={cn(loading && "opacity-60 transition-opacity")} aria-busy={loading || undefined}>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "border-b border-outline-variant/30 px-3 py-2.5 text-left text-xs font-semibold text-on-surface-variant",
                    c.align === "right" && "text-right",
                    c.headerClassName
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={
                  rowHref
                    ? (e) => {
                        // Let real links, buttons and form controls inside the row work normally.
                        if ((e.target as HTMLElement).closest("a,button,input,select,textarea,label")) return;
                        router.push(rowHref(row));
                      }
                    : undefined
                }
                className={cn("group", rowHref && "cursor-pointer")}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "border-b border-outline-variant/15 px-3 py-3 align-middle group-hover:bg-surface-container-low/60",
                      c.align === "right" && "text-right",
                      c.className
                    )}
                  >
                    {c === primary ? renderPrimary(row) : c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone cards */}
      <ul className="space-y-2 md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li key={rowKey(row)} className="rounded-xl bg-surface-container-low/60 p-4 ring-1 ring-outline-variant/20">
            <div className="text-sm">{renderPrimary(row)}</div>
            <dl className="mt-2 grid grid-cols-1 gap-1.5">
              {columns
                .filter((c) => c !== primary && !c.hideOnMobile)
                .map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-3 text-xs">
                    <dt className="shrink-0 text-on-surface-variant">{c.header}</dt>
                    {/* min-w-0 lets long values wrap or truncate inside the card. */}
                    <dd className="min-w-0 text-right text-on-surface">{c.cell(row)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Page navigation for server-paginated lists. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations("kit");
  if (total <= pageSize) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav className="mt-4 flex items-center justify-between gap-3" aria-label={t("pageRange", { from, to, total })}>
      <p className="text-xs text-on-surface-variant tabular-nums">{t("pageRange", { from, to, total })}</p>
      <div className="flex gap-2">
        <Button variant="outline" className="h-9 px-3" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {t("prev")}
        </Button>
        <Button variant="outline" className="h-9 px-3" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          {t("next")}
        </Button>
      </div>
    </nav>
  );
}

/** Segmented filter (e.g. All / Pending / Active / Suspended) with optional counts. */
export function FilterTabs<V extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: V; label: React.ReactNode; count?: number }[];
  value: V;
  onChange: (value: V) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg bg-surface-container-low p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-primary",
              active ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  active ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant"
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Search box with a visible label for screen readers. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Icon name="search" className="size-4.5 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-input bg-surface-container-lowest pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"
      />
    </div>
  );
}
