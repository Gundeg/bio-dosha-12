"use client";

import { useEffect } from "react";

/** Activity renews the session at most this often (it ends after 30 idle minutes). */
const RENEW_EVERY_MS = 5 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown"] as const;

/**
 * Renews the session while someone is working in a part of the app that sends
 * no requests (for example while answering the 12 questions), so it ends only
 * after 30 minutes of real inactivity. Renders nothing.
 */
export function SessionKeepAlive() {
  useEffect(() => {
    // The page load that mounted this already renewed the session.
    let lastRenewal = Date.now();
    const onActivity = () => {
      const now = Date.now();
      if (now - lastRenewal < RENEW_EVERY_MS) return;
      lastRenewal = now;
      void fetch("/api/auth/session", { cache: "no-store" }).catch(() => {});
    };
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, onActivity, { passive: true });
    return () => {
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, onActivity);
    };
  }, []);

  return null;
}
