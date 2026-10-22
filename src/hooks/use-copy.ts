"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Synchronous clipboard fallback for contexts where `navigator.clipboard` doesn't exist: pages served
 * over plain http (a LAN IP on a phone), older WebViews. Written for iOS Safari, which only honours
 * `execCommand("copy")` for a real selection made via a range + setSelectionRange, inside the tap handler.
 */
function legacyCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  // 16px stops iOS zooming into the field; keep it on-screen and "visible" (iOS ignores off-screen/opacity:0 selections).
  ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;font-size:16px;opacity:0.01;";
  document.body.appendChild(ta);
  try {
    const range = document.createRange();
    range.selectNodeContents(ta);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    window.getSelection()?.removeAllRanges();
    ta.remove();
  }
}

/**
 * Copy text and report the result. Never throws: `copied` is the key that last copied successfully,
 * `failed` the key whose copy was refused (callers show a "tap and hold" hint so the user can still copy by hand).
 */
export function useCopy(resetMs = 1800) {
  const [copied, setCopied] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (key: string, text: string) => {
      let ok = false;
      try {
        if (window.isSecureContext && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          ok = true;
        }
      } catch {
        ok = false;
      }
      if (!ok) ok = legacyCopy(text);

      setCopied(ok ? key : null);
      setFailed(ok ? null : key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setCopied(null);
        setFailed(null);
      }, resetMs);
      return ok;
    },
    [resetMs],
  );

  return { copied, failed, copy };
}
