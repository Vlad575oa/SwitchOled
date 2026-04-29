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
        webvisor: true,
        clickmap: true,
        ecommerce: "dataLayer",
        referrer: document.referrer,
        url: window.location.href,
        accurateTrackBounce: true,
        trackLinks: true,
      });
    };

    if (document.readyState === "complete") {
      initMetrika();
      return;
    }

    window.addEventListener("load", initMetrika, { once: true });
    return () => window.removeEventListener("load", initMetrika);
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
