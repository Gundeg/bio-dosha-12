"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

/**
 * Numbered progress for a short wizard. Completed steps show a check (and say
 * "completed" to screen readers); the current one is marked aria-current="step".
 */
export function StepIndicator({
  steps,
  current,
  label,
  doneLabel,
}: {
  steps: string[];
  /** 1-based index of the current step. */
  current: number;
  label: string;
  /** Screen-reader suffix for completed steps, e.g. "completed". */
  doneLabel: string;
}) {
  return (
    <ol aria-label={label} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((name, index) => {
        const n = index + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li
            key={name}
            aria-current={active ? "step" : undefined}
            className={cn(
              "relative flex flex-col items-center gap-1.5 text-center",
              // Connector to the next step, drawn from this circle's edge to the next one's.
              n < steps.length &&
                "after:absolute after:left-[calc(50%+1.25rem)] after:right-[calc(-50%+1.25rem)] after:top-4 after:h-0.5 after:rounded-full",
              n < steps.length && (done ? "after:bg-primary" : "after:bg-outline-variant/60")
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                done && "bg-primary text-on-primary",
                active && "bg-primary/8 text-primary ring-2 ring-primary",
                !done && !active && "bg-surface-container text-on-surface-variant"
              )}
            >
              {done ? <Icon name="check" className="size-4" /> : n}
            </span>
            <span
              className={cn(
                "text-[11px] leading-tight sm:text-xs",
                active ? "font-medium text-on-surface" : "text-on-surface-variant"
              )}
            >
              {name}
              {done && <span className="sr-only"> ({doneLabel})</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
