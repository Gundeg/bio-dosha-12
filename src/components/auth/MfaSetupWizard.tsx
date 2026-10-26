"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Callout } from "@/components/kit/layout";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { AuthShell } from "./AuthShell";
import { CheckboxField, PrimaryButton, TOUCH_LINK_CLASS, TextButton } from "./fields";
import { OTP_LENGTH, OtpCodeInput } from "./OtpCodeInput";
import { RecoveryCodesPanel } from "./RecoveryCodesPanel";
import { StepIndicator } from "./StepIndicator";
import {
  apiErrorCode,
  apiErrorStatus,
  focusField,
  problemKey,
  useKeyText,
  useProblemText,
  type Problem,
} from "./problems";
import { loginHref } from "./safeNext";
import { refreshSessionClaims, navigateAfterAuth } from "./session";

const STEPS = ["install", "scan", "confirm", "save"] as const;
type StepNumber = 1 | 2 | 3 | 4;

// Proper names, written as they appear in the app stores.
const AUTHENTICATOR_APPS = ["Google Authenticator", "Microsoft Authenticator", "2FAS", "Authy"];

const CODE_ID = "mfa-code";
const ACK_ID = "mfa-ack";

/** POST /api/account/mfa/setup */
interface SetupResponse {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

/**
 * Turning on 2-step sign-in: install an app, scan the QR code, confirm one
 * code, save the recovery codes. Required for platform staff and organization
 * members (the proxy sends them here); optional for individuals (from settings).
 */
export function MfaSetupWizard({ next }: { next: string | null }) {
  const t = useTranslations("authFlows");
  const { data: session, status, update } = useSession();
  const problemText = useProblemText();
  const keyText = useKeyText();

  const [step, setStep] = useState<StepNumber>(1);
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<{ codes: string[]; createdAt: Date } | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [ackError, setAckError] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // A code is accepted once; Enter + auto-submit must not send it twice.
  const inFlight = useRef(false);

  const destination = next ?? "/";
  const required = session?.user?.mfaRequired === true;
  const selfPath = next ? `/mfa-setup?next=${encodeURIComponent(next)}` : "/mfa-setup";

  // The recovery codes exist only on this page: confirm before the tab is closed or reloaded.
  useEffect(() => {
    if (step !== 4 || leaving) return;
    function warn(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = ""; // older browsers need it to show the prompt
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [step, leaving]);

  /** 2-step sign-in is on: reload the session claims so the proxy lets the person through, then continue. */
  async function leave() {
    setLeaving(true);
    await refreshSessionClaims(update);
    navigateAfterAuth(destination);
  }

  /** Errors any step can get. Returns true when handled. */
  function handleCommonError(err: unknown): boolean {
    if (apiErrorCode(err) === "mfa_already_enabled") {
      void leave();
      return true;
    }
    if (apiErrorStatus(err) === 401) {
      setSessionEnded(true);
      return true;
    }
    return false;
  }

  function goTo(target: StepNumber) {
    setProblem(null);
    setStep(target);
  }

  async function startSetup() {
    // Keep the key that was already shown: the person may have scanned it.
    if (setup) return goTo(2);
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setProblem(null);
    try {
      const data = await apiFetch<SetupResponse>("/api/account/mfa/setup", { method: "POST" });
      setSetup({ secret: data.secret, qrDataUrl: data.qrDataUrl });
      setStep(2);
    } catch (err) {
      if (!handleCommonError(err)) setProblem({ error: err });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function confirmCode(value: string) {
    if (inFlight.current) return;
    if (value.length !== OTP_LENGTH) {
      setCodeError("login.errors.codeIncomplete");
      focusField(CODE_ID);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setCodeError(null);
    setProblem(null);
    try {
      const data = await apiFetch<{ ok: boolean; recoveryCodes: string[] }>("/api/account/mfa/enable", {
        method: "POST",
        body: JSON.stringify({ code: value }),
      });
      setRecovery({ codes: data.recoveryCodes, createdAt: new Date() });
      setStep(4);
    } catch (err) {
      const errorCode = apiErrorCode(err);
      if (errorCode === "mfa_invalid" || errorCode === "invalid") {
        setCode("");
        setCodeError("mfa.confirm.invalid");
        focusField(CODE_ID);
      } else if (errorCode === "mfa_setup_missing") {
        // The pending key is gone (e.g. replaced from another tab): start over with a new one.
        setSetup(null);
        setCode("");
        setStep(1);
        setProblem(problemKey("mfa.confirm.restart"));
      } else if (!handleCommonError(err)) {
        setProblem({ error: err });
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function finish() {
    if (!acknowledged) {
      setAckError(true);
      focusField(ACK_ID);
      return;
    }
    toast.success(t("mfa.done"));
    void leave();
  }

  if (sessionEnded) {
    return (
      <AuthShell icon="lock_clock" title={t("mfa.session.title")} description={t("mfa.session.body")} focusKey="session">
        <PrimaryButton
          type="button"
          busy={leaving}
          busyLabel={t("mfa.session.signingIn")}
          onClick={() => {
            setLeaving(true);
            // Clear the stale cookie so the sign-in page opens, then come back here.
            void signOut({ redirectTo: loginHref(selfPath) });
          }}
        >
          {t("mfa.session.signIn")}
        </PrimaryButton>
      </AuthShell>
    );
  }

  const titles: Record<StepNumber, string> = {
    1: t("mfa.install.title"),
    2: t("mfa.scan.title"),
    3: t("mfa.confirm.title"),
    4: t("mfa.save.title"),
  };

  const footer =
    step < 4 && status !== "loading" ? (
      required ? (
        <p>
          {t("mfa.stopHint")}{" "}
          <button
            type="button"
            className={TOUCH_LINK_CLASS}
            onClick={() => void signOut({ redirectTo: "/login" })}
          >
            {t("mfa.signOut")}
          </button>
        </p>
      ) : (
        <Link href={destination} className={TOUCH_LINK_CLASS}>
          {t("mfa.notNow")}
        </Link>
      )
    ) : undefined;

  return (
    <AuthShell
      eyebrow={`${t("mfa.eyebrow")} · ${t("shell.stepOf", { current: step, total: STEPS.length })}`}
      title={titles[step]}
      // Step 3 focuses its code field instead of the title.
      focusKey={step === 3 ? undefined : `step-${step}`}
      footer={footer}
    >
      <div className="print:hidden">
        <StepIndicator
          steps={STEPS.map((key) => t(`mfa.steps.${key}`))}
          current={step}
          label={t("mfa.progressLabel")}
          doneLabel={t("mfa.stepDone")}
        />
      </div>

      <div className="mt-6 space-y-5">
        {step === 1 && (
          <>
            {required && <Callout tone="info" icon="shield_lock" title={t("mfa.required")} />}
            <p className="text-sm leading-relaxed text-on-surface">{t("mfa.install.why")}</p>
            <div>
              <p className="text-sm font-semibold text-on-surface">{t("mfa.install.appsTitle")}</p>
              <ul className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                {AUTHENTICATOR_APPS.map((app) => (
                  <li
                    key={app}
                    className="flex min-h-11 items-center gap-2.5 rounded-xl bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
                      smartphone
                    </span>
                    {app}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{t("mfa.install.appsHint")}</p>
            </div>
            {problem && <Callout tone="danger">{problemText(problem)}</Callout>}
            <PrimaryButton
              type="button"
              onClick={() => void startSetup()}
              busy={busy || leaving}
              busyLabel={t("mfa.install.preparing")}
            >
              {t("mfa.install.continue")}
            </PrimaryButton>
          </>
        )}

        {step === 2 && setup && (
          <>
            <p className="text-sm leading-relaxed text-on-surface">{t("mfa.scan.body")}</p>
            <div className="flex justify-center">
              <div className="rounded-2xl bg-white p-3 ring-1 ring-outline-variant/40">
                <Image
                  src={setup.qrDataUrl}
                  alt={t("mfa.scan.qrAlt")}
                  width={240}
                  height={240}
                  unoptimized
                  className="block h-auto w-60 max-w-full"
                />
              </div>
            </div>
            <details className="group rounded-xl bg-surface-container-low">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                {t("mfa.scan.manualTitle")}
                <span
                  className="material-symbols-outlined text-[20px] transition-transform group-open:rotate-180"
                  aria-hidden="true"
                >
                  expand_more
                </span>
              </summary>
              <div className="space-y-3 px-4 pb-4">
                <p className="text-sm leading-relaxed text-on-surface-variant">{t("mfa.scan.manualBody")}</p>
                <SetupKey secret={setup.secret} />
              </div>
            </details>
            <PrimaryButton type="button" onClick={() => goTo(3)}>
              {t("mfa.scan.continue")}
            </PrimaryButton>
            <TextButton onClick={() => goTo(1)} className="gap-1">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                arrow_back
              </span>
              {t("mfa.scan.back")}
            </TextButton>
          </>
        )}

        {step === 3 && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void confirmCode(code);
            }}
            className="space-y-5"
          >
            <p className="text-sm leading-relaxed text-on-surface">{t("mfa.confirm.body")}</p>
            <OtpCodeInput
              id={CODE_ID}
              label={t("mfa.confirm.codeLabel")}
              value={code}
              onValueChange={(value) => {
                setCode(value);
                if (codeError) setCodeError(null);
              }}
              onComplete={(value) => void confirmCode(value)}
              error={codeError ? keyText(codeError) : undefined}
            />
            {problem && <Callout tone="danger">{problemText(problem)}</Callout>}
            <PrimaryButton busy={busy || leaving} busyLabel={t("mfa.confirm.submitting")}>
              {t("mfa.confirm.submit")}
            </PrimaryButton>
            <TextButton
              onClick={() => {
                setCode("");
                setCodeError(null);
                goTo(2);
              }}
              disabled={busy}
              className="gap-1"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                arrow_back
              </span>
              {t("mfa.confirm.back")}
            </TextButton>
          </form>
        )}

        {step === 4 && recovery && (
          <>
            <p className="text-sm leading-relaxed text-on-surface print:hidden">{t("mfa.save.body")}</p>
            <Callout tone="warning" icon="priority_high" className="print:hidden">
              {t("mfa.save.warning")}
            </Callout>
            <RecoveryCodesPanel codes={recovery.codes} email={session?.user?.email} createdAt={recovery.createdAt} />
            <div className="space-y-5 print:hidden">
              <CheckboxField
                id={ACK_ID}
                checked={acknowledged}
                onCheckedChange={(value) => {
                  setAcknowledged(value);
                  if (value) setAckError(false);
                }}
                error={ackError ? t("mfa.save.ackRequired") : undefined}
              >
                {t("mfa.save.ack")}
              </CheckboxField>
              <PrimaryButton type="button" onClick={finish} busy={leaving} busyLabel={t("mfa.save.finishing")}>
                {t("mfa.save.finish")}
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}

/** The setup key for typing into the app by hand: large, in groups of four, with a copy button. */
function SetupKey({ secret }: { secret: string }) {
  const tScan = useTranslations("authFlows.mfa.scan");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const groups = secret.match(/.{1,4}/g) ?? [secret];

  async function copy() {
    try {
      // Without spaces: every authenticator app accepts that form.
      await navigator.clipboard.writeText(secret);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 3000);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{tScan("keyLabel")}</p>
      <p className="select-all break-words rounded-lg bg-surface-container-lowest px-3 py-3 font-mono text-base font-semibold leading-relaxed tracking-wider text-on-surface ring-1 ring-outline-variant/40 [word-spacing:0.3em]">
        {groups.join(" ")}
      </p>
      <Button type="button" variant="outline" onClick={copy} className="h-11 w-full font-semibold">
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          {copyState === "copied" ? "check" : "content_copy"}
        </span>
        {copyState === "copied" ? tScan("copied") : tScan("copy")}
      </Button>
      <p aria-live="polite" className="text-xs text-on-surface-variant">
        {copyState === "failed" ? tScan("copyFailed") : ""}
      </p>
    </div>
  );
}
