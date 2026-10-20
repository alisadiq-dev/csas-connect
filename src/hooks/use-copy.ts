"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Copy text with a "copied" flag; falls back to execCommand where the async clipboard API is unavailable (plain-http LAN, older WebViews). */
export function useCopy(resetMs = 1600) {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (key: string, text: string) => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          ok = document.execCommand("copy");
        } catch {
          ok = false;
        }
        ta.remove();
      }
      if (ok) {
        setCopied(key);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(null), resetMs);
      }
    },
    [resetMs],
  );

  return { copied, copy };
}
