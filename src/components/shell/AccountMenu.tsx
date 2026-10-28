"use client";

import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { useTranslations } from "next-intl";
import { LOCALES, type Locale } from "@/i18n/config";
import { useLocaleSwitch } from "@/components/LocaleToggle";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useRoleLabel, useShell } from "./ShellProvider";
import { useSignOut } from "./useSignOut";

const ITEM =
  "flex h-9 w-full cursor-default items-center gap-2.5 rounded-md px-2.5 text-sm text-on-surface outline-none select-none data-highlighted:bg-surface-container-low";

/** The person's initial in a round avatar. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary select-none",
        className
      )}
      aria-hidden="true"
    >
      {name[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

/**
 * Desktop account menu at the foot of the sidebar: who is signed in, and the
 * secondary actions (settings, help, language, sign out) in one place.
 */
export function AccountMenu() {
  const t = useTranslations("nav");
  const tLocale = useTranslations("locale");
  const { user } = useShell();
  const roleLabel = useRoleLabel();
  const { signOut, pending } = useSignOut();
  const { locale, setLocale } = useLocaleSwitch();
  const displayName = user?.name || user?.email || t("personal");

  return (
    <Menu.Root>
      <Menu.Trigger
        className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary data-popup-open:bg-surface-container-low"
        aria-label={t("accountSection")}
      >
        <Avatar name={displayName} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-on-surface">{displayName}</span>
          <span className="block truncate text-xs text-on-surface-variant">{roleLabel}</span>
        </span>
        <Icon name="expand_more" className="size-4 text-on-surface-variant" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="top" align="start" sideOffset={6} className="z-50 outline-none">
          <Menu.Popup className="w-(--anchor-width) min-w-56 origin-(--transform-origin) rounded-xl bg-surface-container-lowest p-1.5 shadow-lg outline-none data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:opacity-0 transition-[transform,opacity] duration-100">
            <Menu.LinkItem render={<Link href="/settings" />} className={ITEM}>
              <Icon name="settings" className="size-4 text-on-surface-variant" />
              {t("settings")}
            </Menu.LinkItem>
            <Menu.LinkItem render={<Link href="/help" />} className={ITEM}>
              <Icon name="help" className="size-4 text-on-surface-variant" />
              {t("help")}
            </Menu.LinkItem>
            <Menu.Separator className="mx-1 my-1.5 h-px bg-outline-variant" />
            <Menu.Group>
              <Menu.GroupLabel className="px-2.5 pb-1 pt-0.5 text-xs text-on-surface-variant">
                {tLocale("label")}
              </Menu.GroupLabel>
              <Menu.RadioGroup value={locale} onValueChange={(value) => setLocale(value as Locale)}>
                {LOCALES.map((value) => (
                  <Menu.RadioItem key={value} value={value} closeOnClick className={ITEM}>
                    <span className="flex size-4 items-center justify-center">
                      <Menu.RadioItemIndicator>
                        <Icon name="check" className="size-4 text-primary" />
                      </Menu.RadioItemIndicator>
                    </span>
                    {tLocale(value)}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Group>
            <Menu.Separator className="mx-1 my-1.5 h-px bg-outline-variant" />
            <Menu.Item
              className={cn(ITEM, "text-error data-highlighted:bg-error/5")}
              disabled={pending}
              onClick={() => void signOut()}
            >
              <Icon name="logout" className="size-4" />
              {t("logout")}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
