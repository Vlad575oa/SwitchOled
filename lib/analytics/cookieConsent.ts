"use client";

export const COOKIE_CONSENT_KEY = "cookie-consent";
export const COOKIE_CONSENT_EVENT = "cookie-consent-updated";

export type CookieConsentValue = "accepted" | "declined" | null;

export function getCookieConsent(): CookieConsentValue {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (value === "accepted" || value === "declined") return value;
  } catch {
    return null;
  }
  return null;
}

export function hasAnalyticsConsent() {
  return getCookieConsent() === "accepted";
}

export function setCookieConsent(value: Exclude<CookieConsentValue, null>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    // Ignore storage write errors.
  }
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

