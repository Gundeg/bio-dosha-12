import { cn } from "@/lib/utils";

/** Numbered "what happens next" steps. `current` highlights the step to do now. */
export function StepList({
  steps,
  current,
}: {
  steps: { title: React.ReactNode; body?: React.ReactNode }[];
  current?: number;
}) {
  return (
    <ol className="space-y-4">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
              i === current ? "bg-primary text-on-primary" : "bg-primary/10 text-primary"
            )}
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <div className="min-w-0 pt-1">
            <p className="text-sm font-semibold text-on-surface">{step.title}</p>
            {step.body && <p className="mt-0.5 text-sm text-on-surface-variant">{step.body}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
