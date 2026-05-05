"use client";

import { useEffect } from "react";

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

export default function YandexMetrika() {
  useEffect(() => {
    const isProd = process.env.NODE_ENV === "production";
    const host = window.location.hostname;
    const ua = navigator.userAgent || "";
    const isLocalEnv = host === "localhost" || host === "127.0.0.1" || host === "::1";
    const isSyntheticAudit = /Lighthouse|HeadlessChrome|Chrome-Lighthouse/i.test(ua);

    if (!isProd || isLocalEnv || isSyntheticAudit) {
      return;
    }

    const initMetrika = () => {
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
        webvisor: false,
        clickmap: false,
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
          .requestIdleCallback(() => initMetrika(), { timeout: 8000 });
      } else {
        globalThis.setTimeout(initMetrika, 4000);
      }
    };

    if (document.readyState === "complete") {
      scheduleInit();
      return;
    }

    window.addEventListener("load", scheduleInit, { once: true });
    return () => window.removeEventListener("load", scheduleInit);
  }, []);

  return (
    <noscript>
      <div>
        <img
          src={`https://mc.yandex.ru/watch/${METRIKA_ID}`}
          style={{ position: "absolute", left: "-9999px" }}
          alt=""
        />
      </div>
    </noscript>
  );
}
