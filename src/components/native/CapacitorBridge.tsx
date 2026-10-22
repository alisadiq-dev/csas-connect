"use client";

import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Glue between the Android app shell and the web app. Renders nothing and does nothing in a normal browser.
 * Inside the Capacitor app it (1) turns csasconnect:// deep links into in-app navigation and (2) hides the
 * native splash once the portal has painted. The Capacitor plugins are imported lazily, so they never
 * load for web visitors.
 */
export function CapacitorBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let remove: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const [{ App }, { SplashScreen }] = await Promise.all([import("@capacitor/app"), import("@capacitor/splash-screen")]);
      if (cancelled) return;
      void SplashScreen.hide();
      const handle = await App.addListener("appUrlOpen", ({ url }) => {
        // csasconnect://student/results?x=1 → /student/results?x=1 (only same-app paths are followed)
        const match = /^csasconnect:\/\/([^?#]*)(.*)$/.exec(url);
        if (!match) return;
        const path = `/${match[1].replace(/^\/+/, "")}${match[2]}`;
        if (/^\/[a-z0-9/_-]*(\?.*)?$/i.test(path)) router.push(path);
      });
      if (cancelled) void handle.remove();
      else remove = () => void handle.remove();
    })();

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [router]);

  return null;
}
