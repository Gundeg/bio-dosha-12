"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";

export interface PageTabItem<T extends string> {
  value: T;
  label: string;
  /** Material Symbols name. */
  icon: IconName;
}

/**
 * One look for every page-level tab strip (settings, organization, control
 * center): quiet 8px-rounded items, the active one tinted like the sidebar.
 */
export function tabItemClass(active: boolean): string {
  return cn(
    "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
    active ? "bg-primary/8 text-primary" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
  );
}

/** The scrolling row under a page header that holds the tab items. */
export const TAB_STRIP_CLASS = "overflow-x-auto border-b border-outline-variant pb-2 print:hidden";

/**
 * Page-level tabs for the settings and organization pages.
 * Keyboard: arrow keys move between tabs, Enter or Space opens one. The bar
 * scrolls sideways on narrow phones instead of wrapping.
 */
export function PageTabs<T extends string>({
  value,
  onValueChange,
  items,
  label,
  children,
}: {
  value: T;
  onValueChange: (value: T) => void;
  items: PageTabItem<T>[];
  /** Accessible name of the tab bar. */
  label: string;
  children: React.ReactNode;
}) {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      className="flex flex-col gap-6"
    >
      <div className={TAB_STRIP_CLASS}>
        <TabsPrimitive.List aria-label={label} className="flex min-w-max gap-1">
          {items.map((item) => (
            <TabsPrimitive.Tab key={item.value} value={item.value} className={(state) => tabItemClass(state.active)}>
              <Icon name={item.icon} className="size-[18px]" />
              {item.label}
            </TabsPrimitive.Tab>
          ))}
        </TabsPrimitive.List>
      </div>
      {children}
    </TabsPrimitive.Root>
  );
}

export function PageTabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsPrimitive.Panel
      value={value}
      className="rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      {children}
    </TabsPrimitive.Panel>
  );
}
