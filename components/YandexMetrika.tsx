"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { COOKIE_CONSENT_EVENT, hasAnalyticsConsent } from "@/lib/analytics/cookieConsent";

declare global {
  interface Window {
    ym?: ((...args: unknown[]) => void) & {
      a?: unknown[];
      l?: number;
    };
  }
}

const METRIKA_ID = 108974800;
const METRIKA_SRC = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;
const AUDIT_UA_RE = /Lighthouse|HeadlessChrome|HeadlessChromium|Chrome-Lighthouse|Page Speed|PageSpeed/i;

export default function YandexMetrika() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  // SPA route tracking: fire hit on each navigation after init
  useEffect(() => {
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return; // first render — init handles the initial hit
    }
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    if (typeof window !== "undefined" && window.ym?.l) {
      window.ym(METRIKA_ID, "hit", window.location.href, {
        referrer: document.referrer,
      });
    }
  }, [pathname]);

  useEffect(() => {
    const isProd = process.env.NODE_ENV === "production";
    const host = window.location.hostname;
    const ua = navigator.userAgent || "";
    const isLocalEnv = host === "localhost" || host === "127.0.0.1" || host === "::1";
    const isSyntheticAudit = AUDIT_UA_RE.test(ua) || navigator.webdriver;

    if (!isProd || isLocalEnv || isSyntheticAudit) {
      return;
    }

    const initMetrika = () => {
      if (!hasAnalyticsConsent()) return;
      if (window.ym?.l) return;

      window.ym = window.ym || function (...args: unknown[]) {
        (window.ym!.a = window.ym!.a || []).push(args);
      };
      window.ym.l = Date.now();

      if (!Array.from(document.scripts).some((script) => script.src === METRIKA_SRC)) {
        const script = document.createElement("script");
        script.async = true;
        script.src = METRIKA_SRC;
        document.head.appendChild(script);
      }

      window.ym(METRIKA_ID, "init", {
        ssr: true,
        webvisor: true,
        clickmap: true,
        ecommerce: "dataLayer",
        referrer: document.referrer,
        url: window.location.href,
        accurateTrackBounce: true,
        trackLinks: true,
      });
    };

    const scheduleInit = () => {
      if ("requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: IdleRequestCallback, options?: IdleRequestOptions) => number })
          .requestIdleCallback(() => initMetrika(), { timeout: 15000 });
      } else {
        globalThis.setTimeout(initMetrika, 10000);
      }
    };

    const scheduleAfterFirstInteraction = () => {
      window.removeEventListener("pointerdown", scheduleAfterFirstInteraction);
      window.removeEventListener("keydown", scheduleAfterFirstInteraction);
      scheduleInit();
    };

    const onConsentUpdated = () => {
      if (hasAnalyticsConsent()) {
        initMetrika();
      } else if (window.ym?.l) {
        // Script already loaded but consent revoked — reload to stop tracking
        window.location.reload();
      }
    };

    if (document.readyState === "complete") {
      scheduleInit();
    } else {
      window.addEventListener("load", scheduleInit, { once: true });
    }

    window.addEventListener("pointerdown", scheduleAfterFirstInteraction, { once: true, passive: true });
    window.addEventListener("keydown", scheduleAfterFirstInteraction, { once: true });
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsentUpdated);

    return () => {
      window.removeEventListener("load", scheduleInit);
      window.removeEventListener("pointerdown", scheduleAfterFirstInteraction);
      window.removeEventListener("keydown", scheduleAfterFirstInteraction);
      window.removeEventListener(COOKIE_CONSENT_EVENT, onConsentUpdated);
    };
  }, []);

  return null;
}
