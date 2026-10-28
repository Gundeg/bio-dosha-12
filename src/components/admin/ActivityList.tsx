"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAdminLabels } from "./hooks";
import { shortId, type ActivityItem } from "./lib";
import type { IconName } from "@/components/ui/icon";
import { IconTile } from "@/components/kit/layout";

const GROUP_ICON: Record<string, IconName> = {
  auth: "login",
  account: "person",
  admin: "shield_person",
  org: "domain",
  patient: "clinical_notes",
  intake: "clinical_notes",
  record: "calculate",
};

/** Recent audit events as a readable timeline (labels, who, when). */
export function ActivityList({ items, empty, className }: { items: ActivityItem[]; empty: string; className?: string }) {
  const t = useTranslations("admin");
  const labels = useAdminLabels();

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-on-surface-variant">{empty}</p>;
  }

  return (
    <ol className={cn("divide-y divide-outline-variant/20", className)}>
      {items.map((item) => {
        const group = item.action.split(".")[0];
        const failed = item.action === "auth.login.failure" || item.action === "auth.login.blocked";
        return (
          <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <IconTile
              name={failed ? "gpp_maybe" : (GROUP_ICON[group] ?? "history")}
              tone={failed ? "warning" : "default"}
              size="sm"
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-on-surface">{labels.action(item.action)}</p>
              <p className="mt-0.5 break-words text-xs text-on-surface-variant">
                {item.actorEmail ?? t("activity.system")}
                {item.targetType && (
                  <>
                    {" · "}
                    {labels.targetType(item.targetType)}
                    {item.targetId && <span className="font-mono"> {shortId(item.targetId)}</span>}
                  </>
                )}
                {item.ip && <span className="font-mono"> · {item.ip}</span>}
              </p>
            </div>
            <time dateTime={item.at} className="shrink-0 text-xs tabular-nums text-on-surface-variant">
              {labels.dateTime(item.at)}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
