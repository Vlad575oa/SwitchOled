"use client";

import { ReactNode } from "react";

const MAX_WEB_URL = "https://max.ru/u/f9LHodD0cOJQaSenuFWGazoHqG8RNEoO3xSyNKPTXj1s3tyqlHkFoF5UzUo";
// maxim:// — официальная URI-схема приложения MAX (бывший ICQ New)
const MAX_DEEPLINK_ANDROID = "maxim://u/f9LHodD0cOJQaSenuFWGazoHqG8RNEoO3xSyNKPTXj1s3tyqlHkFoF5UzUo";
// На iOS MAX регистрирует схему max://
const MAX_DEEPLINK_IOS = "max://u/f9LHodD0cOJQaSenuFWGazoHqG8RNEoO3xSyNKPTXj1s3tyqlHkFoF5UzUo";

interface MaxContactLinkProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function MaxContactLink({ children, className, title }: MaxContactLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    if (!isIOS && !isAndroid) return;

    e.preventDefault();

    const deeplink = isIOS ? MAX_DEEPLINK_IOS : MAX_DEEPLINK_ANDROID;
    window.location.href = deeplink;

    // Если приложение не открылось — открываем веб через 1.5 сек
    setTimeout(() => {
      window.location.href = MAX_WEB_URL;
    }, 1500);
  };

  return (
    <a
      href={MAX_WEB_URL}
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
