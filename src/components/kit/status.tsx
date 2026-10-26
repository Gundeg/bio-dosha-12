import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const TONE: Record<BadgeTone, { box: string; dot: string }> = {
  success: { box: "bg-emerald-50 text-emerald-800 ring-emerald-600/20", dot: "bg-emerald-600" },
  warning: { box: "bg-amber-50 text-amber-900 ring-amber-600/25", dot: "bg-amber-500" },
  danger: { box: "bg-red-50 text-red-800 ring-red-600/20", dot: "bg-red-600" },
  info: { box: "bg-sky-50 text-sky-800 ring-sky-600/20", dot: "bg-sky-600" },
  neutral: { box: "bg-surface-container text-on-surface-variant ring-outline-variant/40", dot: "bg-on-surface-variant/60" },
  primary: { box: "bg-primary/10 text-primary ring-primary/20", dot: "bg-primary" },
};

/**
 * A small status pill. Color is never the only signal: the text always says
 * the status, and the dot is decorative.
 */
export function StatusBadge({
  tone = "neutral",
  children,
  dot = true,
  icon,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  dot?: boolean;
  /** Material Symbols name shown instead of the dot. */
  icon?: string;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset",
        t.box,
        className
      )}
    >
      {icon ? (
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          {icon}
        </span>
      ) : (
        dot && <span className={cn("size-1.5 rounded-full", t.dot)} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

/** Tone for an organization status. */
export function orgStatusTone(status: string): BadgeTone {
  return status === "ACTIVE" ? "success" : status === "PENDING" ? "warning" : status === "SUSPENDED" ? "danger" : "neutral";
}

/** Tone for an invitation state. */
export function inviteStateTone(state: string): BadgeTone {
  return state === "pending" ? "info" : state === "used" ? "success" : state === "expired" ? "neutral" : "danger";
}

/** Tone for a member or account status. */
export function accountStatusTone(disabled: boolean): BadgeTone {
  return disabled ? "danger" : "success";
}
