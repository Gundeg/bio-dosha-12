"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DescriptionList, Section, StatusBadge, orgStatusTone, useErrorMessage } from "@/components/kit";
import { apiFetch } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { Field, FormMessage, TextInput, UsageMeter } from "./shared";
import { planName, type Me, type MeMembership } from "./types";

type MutateMe = (update: (prev: Me | null) => Me | null) => void;

const NAME_MAX = 100;

export function ProfileTab({ me, mutate }: { me: Me; mutate: MutateMe }) {
  return (
    <div className="space-y-6">
      <PersonalDetails me={me} mutate={mutate} />
      <LanguageSection mutate={mutate} />
      <PersonalPlan me={me} />
      <MyOrganizations me={me} />
    </div>
  );
}

function PersonalDetails({ me, mutate }: { me: Me; mutate: MutateMe }) {
  const t = useTranslations("settings.profile");
  const tKit = useTranslations("kit");
  const locale = useLocale();
  const describe = useErrorMessage();
  const { update } = useSession();
  const [name, setName] = useState(me.name);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const trimmed = name.trim();
  const changed = trimmed !== me.name;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed) {
      setError(t("nameRequired"));
      return;
    }
    if (!changed) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await apiFetch<{ name: string }>("/api/account", {
        method: "PATCH",
        body: JSON.stringify({ name: trimmed }),
      });
      setName(saved.name);
      mutate((prev) => (prev ? { ...prev, name: saved.name } : prev));
      toast.success(t("nameSaved"));
      // The navigation shows the name from the session.
      await update({}); // {} forces a claim refresh (see src/components/auth/session.ts)
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title={t("detailsTitle")} description={t("detailsDescription")}>
      <form noValidate onSubmit={save} className="space-y-5">
        <Field id="settings-name" label={t("name")} required error={error}>
          {(control) => (
            <div className="flex flex-col gap-2 sm:flex-row">
              <TextInput
                {...control}
                value={name}
                maxLength={NAME_MAX}
                autoComplete="name"
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                className="sm:max-w-sm"
              />
              <Button type="submit" className="h-10 px-5 font-semibold" disabled={busy || !changed}>
                {busy ? tKit("working") : t("save")}
              </Button>
            </div>
          )}
        </Field>
      </form>

      <div className="mt-6 border-t border-outline-variant/20 pt-5">
        <DescriptionList
          items={[
            {
              label: t("email"),
              value: (
                <span className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 font-medium break-all">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant" aria-hidden="true">
                      lock
                    </span>
                    {me.email}
                  </span>
                  <span className="text-xs text-on-surface-variant">{t("emailHint")}</span>
                </span>
              ),
            },
            { label: t("memberSince"), value: formatDate(me.createdAt, locale, "long") },
            {
              label: t("lastSignIn"),
              value: me.lastLoginAt ? formatDateTime(me.lastLoginAt, locale) : tKit("never"),
            },
          ]}
        />
      </div>
    </Section>
  );
}

function persistLocaleCookie(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
}

function LanguageSection({ mutate }: { mutate: MutateMe }) {
  const t = useTranslations("settings.profile");
  const tLocale = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const describe = useErrorMessage();
  const [target, setTarget] = useState<Locale | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const busy = saving || refreshing;
  const shown = busy && target ? target : locale;

  async function choose(next: Locale) {
    if (busy || next === locale) return;
    setTarget(next);
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/account", { method: "PATCH", body: JSON.stringify({ locale: next }) });
      persistLocaleCookie(next);
      mutate((prev) => (prev ? { ...prev, locale: next } : prev));
      startTransition(() => router.refresh());
    } catch (err) {
      setError(describe(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title={t("languageTitle")} description={t("languageDescription")}>
      <fieldset aria-describedby={error ? "settings-language-error" : undefined}>
        <legend className="sr-only">{t("languageTitle")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {LOCALES.map((value) => (
            <label
              key={value}
              className={cn(
                "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 ring-1 ring-outline-variant/50 transition",
                "hover:bg-surface-container-low has-checked:bg-primary/5 has-checked:ring-2 has-checked:ring-primary",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
                busy && "cursor-wait opacity-70"
              )}
            >
              <input
                type="radio"
                name="interface-language"
                value={value}
                checked={shown === value}
                disabled={busy}
                onChange={() => choose(value)}
                className="size-4 accent-primary"
              />
              <span lang={value} className="font-semibold text-on-surface">
                {tLocale(value)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div aria-live="polite">
        {busy && <p className="mt-3 text-sm text-on-surface-variant">{t("languageSaving")}</p>}
      </div>
      {error && (
        <div id="settings-language-error" className="mt-3">
          <FormMessage>{error}</FormMessage>
        </div>
      )}
    </Section>
  );
}

function PersonalPlan({ me }: { me: Me }) {
  const t = useTranslations("settings.profile");
  const locale = useLocale();
  return (
    <Section title={t("planTitle")} description={t("planDescription")}>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined flex size-10 items-center justify-center rounded-xl bg-primary/10 text-[22px] text-primary"
            aria-hidden="true"
          >
            workspace_premium
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">{t("planName")}</p>
            <p className="font-headline text-lg font-bold text-on-surface">{planName(me.plan, locale)}</p>
          </div>
        </div>
        <UsageMeter label={t("profilesLabel")} used={me.usage.profiles} limit={me.plan.limits.maxProfiles} />
        <p className="flex items-start gap-1.5 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined mt-px text-[18px]" aria-hidden="true">
            support_agent
          </span>
          {t("upgradeHint")}
        </p>
      </div>
    </Section>
  );
}

function MyOrganizations({ me }: { me: Me }) {
  const t = useTranslations("settings.profile");
  const tOrg = useTranslations("org");
  const router = useRouter();
  const describe = useErrorMessage();
  const { update } = useSession();
  const [opening, setOpening] = useState<string | null>(null);

  async function open(m: MeMembership) {
    if (m.organizationId === me.activeOrganizationId) {
      router.push("/org");
      return;
    }
    setOpening(m.organizationId);
    try {
      await apiFetch("/api/org/active", { method: "PUT", body: JSON.stringify({ organizationId: m.organizationId }) });
      await update({}); // {} forces a claim refresh (see src/components/auth/session.ts)
      router.push("/org");
    } catch (err) {
      toast.error(describe(err));
      setOpening(null);
    }
  }

  return (
    <Section title={t("orgsTitle")} description={t("orgsDescription")}>
      {me.memberships.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold text-on-surface">{t("orgsEmpty")}</p>
            <p className="mt-0.5 text-on-surface-variant">{t("orgsEmptyHint")}</p>
          </div>
          <ButtonLink href="/org" variant="outline" className="h-10 px-4">
            {t("orgsEmptyAction")}
          </ButtonLink>
        </div>
      ) : (
        <ul className="divide-y divide-outline-variant/20">
          {me.memberships.map((m) => {
            const current = m.organizationId === me.activeOrganizationId;
            return (
              <li key={m.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-on-surface">
                    <span className="break-words">{m.organizationName}</span>
                    {current && (
                      <StatusBadge tone="primary" dot={false} icon="check">
                        {t("currentOrg")}
                      </StatusBadge>
                    )}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
                    <span>{tOrg(`roles.${m.role}.label`)}</span>
                    <StatusBadge tone={orgStatusTone(m.organizationStatus)}>
                      {tOrg(`orgStatus.${m.organizationStatus}`)}
                    </StatusBadge>
                    {m.status === "DISABLED" && <StatusBadge tone="danger">{t("accessOff")}</StatusBadge>}
                  </div>
                </div>
                {m.status === "ACTIVE" && (
                  <Button
                    variant="outline"
                    className="h-10 shrink-0 px-4"
                    disabled={opening !== null}
                    onClick={() => open(m)}
                    aria-label={t("openOrgAria", { name: m.organizationName })}
                  >
                    {opening === m.organizationId ? t("opening") : t("openOrg")}
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      arrow_forward
                    </span>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
