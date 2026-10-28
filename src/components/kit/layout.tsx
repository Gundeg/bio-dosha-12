import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";

/**
 * Page and panel building blocks shared by every screen: white panels with a
 * hairline on the neutral surface, 12px panel corners, 8px control corners,
 * semibold headings, one icon set (src/components/ui/icon.tsx).
 */

/** An icon centred in a tinted square: list rows, feature and stat cards. */
export function IconTile({
  name,
  tone = "default",
  size = "md",
  className,
}: {
  name: IconName;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        size === "sm" ? "size-8" : size === "lg" ? "size-11" : "size-9",
        {
          default: "bg-surface-container-low text-on-surface-variant",
          primary: "bg-primary/8 text-primary",
          success: "bg-emerald-50 text-emerald-700",
          warning: "bg-amber-50 text-amber-700",
          danger: "bg-red-50 text-red-700",
        }[tone],
        className
      )}
      aria-hidden="true"
    >
      <Icon name={name} className={size === "lg" ? "size-5" : "size-[18px]"} />
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  backHref,
  backLabel,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="mb-3 inline-flex items-center gap-1 rounded-md text-sm font-medium text-on-surface-variant hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Icon name="arrow_back" className="size-4.5" />
            {backLabel}
          </Link>
        )}
        {eyebrow && <p className="mb-1 text-sm text-on-surface-variant">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface md:text-[28px] md:leading-9">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** A white panel with an optional heading row. */
export function Section({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={cn("rounded-xl bg-surface-container-lowest shadow-ambient", className)}
    >
      {(title || actions) && (
        <div className="flex flex-col gap-2 border-b border-outline-variant px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && (
              <h2 id={headingId} className="text-base font-semibold text-on-surface">
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-sm text-on-surface-variant">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

type Tone = "default" | "primary" | "warning" | "danger" | "success";

const STAT_TONE: Record<Tone, { icon: string; ring: string }> = {
  default: { icon: "bg-surface-container text-on-surface-variant", ring: "ring-outline-variant/20" },
  primary: { icon: "bg-primary/10 text-primary", ring: "ring-outline-variant/20" },
  success: { icon: "bg-emerald-50 text-emerald-700", ring: "ring-outline-variant/20" },
  warning: { icon: "bg-amber-50 text-amber-700", ring: "ring-amber-500/40" },
  danger: { icon: "bg-red-50 text-red-700", ring: "ring-red-500/40" },
};

/** A number on the dashboard. With `href` the whole card is a link. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  href,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Icon name from src/components/ui/icon.tsx, e.g. "domain". */
  icon?: IconName;
  tone?: Tone;
  href?: string;
}) {
  const toneClass = STAT_TONE[tone];
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-on-surface-variant">{label}</p>
        {icon && (
          <span className={cn("flex size-9 items-center justify-center rounded-lg", toneClass.icon)} aria-hidden="true"><Icon name={icon} className="size-[18px]" /></span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-on-surface">{value}</p>
      {hint && <p className="mt-1 text-xs text-on-surface-variant">{hint}</p>}
    </>
  );
  const className = cn(
    "block rounded-xl bg-surface-container-lowest p-5 shadow-ambient ring-1 transition-colors",
    toneClass.ring,
    href && "hover:bg-surface-container-low/60 focus-visible:outline-2 focus-visible:outline-primary"
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Label/value pairs for detail pages. */
export function DescriptionList({
  items,
  columns = 2,
}: {
  items: { label: React.ReactNode; value: React.ReactNode; hidden?: boolean }[];
  columns?: 1 | 2 | 3;
}) {
  const cols = columns === 1 ? "" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-4", cols)}>
      {items
        .filter((i) => !i.hidden)
        .map((item, idx) => (
          <div key={idx} className="min-w-0">
            <dt className="text-xs font-medium text-on-surface-variant">{item.label}</dt>
            <dd className="mt-1 break-words text-sm text-on-surface">{item.value}</dd>
          </div>
        ))}
    </dl>
  );
}

/** Inline notice: info, success, warning or danger, with an optional action. */
export function Callout({
  tone = "info",
  title,
  children,
  action,
  icon,
  className,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  icon?: IconName;
  className?: string;
}) {
  const styles = ({
    info: { box: "bg-sky-50 ring-sky-600/20 text-sky-950", icon: "info", iconColor: "text-sky-700" },
    success: { box: "bg-emerald-50 ring-emerald-600/20 text-emerald-950", icon: "check_circle", iconColor: "text-emerald-700" },
    warning: { box: "bg-amber-50 ring-amber-600/25 text-amber-950", icon: "warning", iconColor: "text-amber-700" },
    danger: { box: "bg-red-50 ring-red-600/25 text-red-950", icon: "error", iconColor: "text-red-700" },
  } satisfies Record<string, { box: string; icon: IconName; iconColor: string }>)[tone];
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn("flex flex-col gap-3 rounded-xl p-4 ring-1 sm:flex-row sm:items-center", styles.box, className)}
    >
      <Icon name={icon ?? styles.icon} className={cn("size-5 shrink-0", styles.iconColor)} />
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
