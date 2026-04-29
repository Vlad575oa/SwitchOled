"use client";

import { useEffect, useState } from "react";

type PendingLink = {
  href: string;
  target: string | null;
  messengerName: string;
};

const MESSENGER_HOSTS = [
  { pattern: /(^|\.)t\.me$/i, name: "Telegram" },
  { pattern: /(^|\.)telegram\.me$/i, name: "Telegram" },
  { pattern: /(^|\.)wa\.me$/i, name: "WhatsApp" },
  { pattern: /(^|\.)whatsapp\.com$/i, name: "WhatsApp" },
  { pattern: /(^|\.)vk\.com$/i, name: "VK" },
  { pattern: /(^|\.)instagram\.com$/i, name: "Instagram" },
  { pattern: /(^|\.)max\.ru$/i, name: "MAX" },
];

const getMessengerName = (hostname: string): string | null => {
  const match = MESSENGER_HOSTS.find((item) => item.pattern.test(hostname));
  return match?.name ?? null;
};

export default function MessengerExitNotice() {
  const [pending, setPending] = useState<PendingLink | null>(null);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(rawHref, window.location.href);
      } catch {
        return;
      }

      if (url.origin === window.location.origin) return;

      const messengerName = getMessengerName(url.hostname);
      if (!messengerName) return;

      event.preventDefault();
      setPending({
        href: url.toString(),
        target: anchor.getAttribute("target"),
        messengerName,
      });
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, []);

  const close = () => setPending(null);

  const continueToMessenger = () => {
    if (!pending) return;

    if (pending.target === "_blank") {
      window.open(pending.href, "_blank", "noopener,noreferrer");
    } else {
      window.location.assign(pending.href);
    }

    setPending(null);
  };

  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/25 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-neutral-200 p-5 sm:p-6">
        <h3 className="text-lg font-black text-secondary mb-2">
          Переход в {pending.messengerName}
        </h3>

        <p className="text-sm text-neutral-600 leading-relaxed">
          Вы покидаете сайт Gameshop24 и переходите в другое приложение. Обратите внимание, что при переходе ваш номер телефона и данные профиля станут доступны мессенджеру.
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="px-4 py-2 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={continueToMessenger}
            className="px-4 py-2 rounded-xl text-sm font-black text-white bg-primary hover:bg-red-700 transition-colors"
          >
            Перейти
          </button>
        </div>
      </div>
    </div>
  );
}
