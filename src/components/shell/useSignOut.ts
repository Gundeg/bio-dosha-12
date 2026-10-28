"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { signOutHere } from "@/components/auth/session";

/** The menu's "Гарах" action: signs out here, or says so when that failed. */
export function useSignOut() {
  const t = useTranslations("nav");
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  const signOut = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    // On success the browser is already leaving for the sign-in page.
    if (await signOutHere()) return;
    inFlight.current = false;
    setPending(false);
    toast.error(t("logoutFailed"));
  }, [t]);

  return { signOut, pending };
}
