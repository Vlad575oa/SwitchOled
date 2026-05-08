"use client";

import { ReactNode } from "react";

const MAX_DESKTOP_URL = "https://web.max.ru/245465430";
const MAX_MOBILE_DEEPLINK = "max://max.ru/u/79266763488";

const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
};

interface MaxContactLinkProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function MaxContactLink({ children, className, title }: MaxContactLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isMobileDevice()) return;

    e.preventDefault();

    // Try to open MAX app first on mobile.
    window.location.href = MAX_MOBILE_DEEPLINK;

    // Fallback to web profile if app deep-link wasn't handled.
    window.setTimeout(() => {
      window.location.href = MAX_DESKTOP_URL;
    }, 1200);
  };

  return (
    <a
      href={MAX_DESKTOP_URL}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={title}
    >
      {children}
    </a>
  );
}
