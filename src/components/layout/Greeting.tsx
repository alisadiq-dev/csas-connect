"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const timeGreeting = () => {
  const h = new Date().getHours();
  return h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night";
};

/** Time-of-day greeting from the *viewer's* clock. Server render (and first paint) says "Welcome back" so there is no hydration mismatch. */
export function Greeting({ className = "" }: { className?: string }) {
  const text = useSyncExternalStore(subscribe, timeGreeting, () => "Welcome back");
  return <span className={className}>{text}</span>;
}
