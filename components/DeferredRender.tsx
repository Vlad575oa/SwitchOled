"use client";

import { useEffect, useState } from "react";

interface DeferredRenderProps {
  children: React.ReactNode;
  delayMs?: number;
}

export function DeferredRender({ children, delayMs = 2500 }: DeferredRenderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const enable = () => setReady(true);
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, options?: IdleRequestOptions) => number;
    };
    const idleWindow = window as IdleWindow;

    if (typeof idleWindow.requestIdleCallback === "function") {
      idleWindow.requestIdleCallback(enable, { timeout: delayMs });
    } else {
      timeoutId = setTimeout(enable, delayMs);
    }

    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [delayMs]);

  if (!ready) return null;
  return <>{children}</>;
}
