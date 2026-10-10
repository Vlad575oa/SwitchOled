"use client";

const METRIKA_ID = 108974800;
const YCLID_STORAGE_KEY = "yandex-yclid";

declare global {
  interface Window {
    ym?: ((...args: unknown[]) => void) & { a?: unknown[]; l?: number };
  }
}

function rememberYclid() {
  if (typeof window === "undefined") return;
  const yclid = new URLSearchParams(window.location.search).get("yclid");
  if (!yclid) return;
  try {
    window.localStorage.setItem(YCLID_STORAGE_KEY, yclid);
  } catch {
    // Ignore storage restrictions.
  }
}

function readYclid() {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(YCLID_STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
}

function getClientId(): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof window.ym !== "function") {
      resolve(undefined);
      return;
    }

    let settled = false;
    const finish = (value?: string) => {
      if (settled) return;
      settled = true;
      resolve(value || undefined);
    };
    const timeout = window.setTimeout(() => finish(), 1200);
    window.ym(METRIKA_ID, "getClientID", (clientId: string) => {
      window.clearTimeout(timeout);
      finish(clientId);
    });
  });
}

export function rememberYandexAttribution() {
  rememberYclid();
}

export async function getYandexAttribution() {
  rememberYclid();
  return {
    yandexClientId: await getClientId(),
    yclid: readYclid(),
  };
}
