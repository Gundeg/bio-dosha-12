"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

export interface PageTabItem<T extends string> {
  value: T;
  label: string;
  /** Material Symbols name. */
  icon: string;
}

/**
 * Page-level tabs (underline style) for the settings and organization pages.
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
      <div className="overflow-x-auto border-b border-outline-variant/40 print:hidden">
        <TabsPrimitive.List aria-label={label} className="flex min-w-max gap-1">
          {items.map((item) => (
            <TabsPrimitive.Tab
              key={item.value}
              value={item.value}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-t-lg border-b-2 border-transparent px-3 text-sm font-semibold whitespace-nowrap text-on-surface-variant transition-colors",
                "hover:bg-surface-container-low hover:text-on-surface",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                "data-active:border-primary data-active:text-primary"
              )}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                {item.icon}
              </span>
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
      className="rounded-2xl outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      {children}
    </TabsPrimitive.Panel>
  );
}
