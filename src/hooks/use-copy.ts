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
      if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        try {
          await navigator.clipboard.writeText(text);
          ok = true;
        } catch {
          ok = false;
        }
      }

      if (!ok && typeof document !== "undefined") {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.fontSize = "16px";
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          ta.style.top = "0";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          ta.setSelectionRange(0, text.length);
          ok = document.execCommand("copy");
          document.body.removeChild(ta);
        } catch {
          ok = false;
        }
      }

      setCopied(key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), resetMs);
    },
    [resetMs],
  );

  return { copied, copy };
}
