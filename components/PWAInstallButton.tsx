"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Share, MoreVertical, PlusSquare, Smartphone } from "lucide-react";

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export function PWAInstallButton() {
  const [platform, setPlatform] = useState<Platform>("other");
  const [isMobile, setIsMobile] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [canNativeInstall, setCanNativeInstall] = useState(false);

  useEffect(() => {
    const p = detectPlatform();
    const mobile = p === "ios" || p === "android";
    setPlatform(p);
    setIsMobile(mobile);
    setInstalled(isInStandaloneMode());

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as typeof deferredPrompt);
      setCanNativeInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleClick = useCallback(async () => {
    if (canNativeInstall && deferredPrompt) {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
      setCanNativeInstall(false);
    } else {
      setShowModal(true);
    }
  }, [canNativeInstall, deferredPrompt]);

  if (!isMobile || installed) return null;

  return (
    <>
      {/* Button */}
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all active:scale-95 text-[13px] font-bold"
        aria-label="Установить приложение"
      >
        <Smartphone size={16} />
        <span>Установить приложение</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#1e1e22] border border-white/10 rounded-2xl p-6 pb-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_4px_12px_var(--primary-glow)]">
                  <span className="text-white font-black text-xl italic leading-none">G</span>
                </div>
                <div>
                  <p className="text-white font-black text-[15px]">Gameshop24</p>
                  <p className="text-neutral-400 text-[11px]">gameshop24.ru</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X size={16} className="text-neutral-400" />
              </button>
            </div>

            <p className="text-white font-black text-[17px] mb-1">Добавить на экран</p>
            <p className="text-neutral-400 text-[13px] mb-6 leading-relaxed">
              Установите приложение для быстрого доступа к каталогу, заказам и акциям — без браузера.
            </p>

            {platform === "ios" ? (
              <IOSInstructions />
            ) : (
              <AndroidInstructions />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function IOSInstructions() {
  return (
    <div className="space-y-4">
      <Step num={1} icon={<Share size={16} className="text-[#007AFF]" />} bg="bg-[#007AFF]/10">
        Нажмите кнопку{" "}
        <span className="inline-flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-md text-white font-bold text-[12px]">
          <Share size={12} /> Поделиться
        </span>{" "}
        в нижней панели Safari
      </Step>
      <Step num={2} icon={<PlusSquare size={16} className="text-[#007AFF]" />} bg="bg-[#007AFF]/10">
        Прокрутите вниз и выберите{" "}
        <span className="font-bold text-white">«На экран «Домой»»</span>
      </Step>
      <Step num={3} icon={<span className="text-[12px] font-black text-[#007AFF]">✓</span>} bg="bg-[#007AFF]/10">
        Нажмите{" "}
        <span className="font-bold text-white">«Добавить»</span>{" "}
        — иконка появится на главном экране
      </Step>
      <p className="text-[11px] text-neutral-500 text-center mt-2">
        Работает в Safari. В Chrome откройте в Safari для установки.
      </p>
    </div>
  );
}

function AndroidInstructions() {
  return (
    <div className="space-y-4">
      <Step num={1} icon={<MoreVertical size={16} className="text-primary" />} bg="bg-primary/10">
        Нажмите{" "}
        <span className="inline-flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-md text-white font-bold text-[12px]">
          ⋮ Меню
        </span>{" "}
        в правом верхнем углу Chrome
      </Step>
      <Step num={2} icon={<Smartphone size={16} className="text-primary" />} bg="bg-primary/10">
        Выберите{" "}
        <span className="font-bold text-white">«Добавить на главный экран»</span>{" "}
        или{" "}
        <span className="font-bold text-white">«Установить приложение»</span>
      </Step>
      <Step num={3} icon={<span className="text-[12px] font-black text-primary">✓</span>} bg="bg-primary/10">
        Нажмите{" "}
        <span className="font-bold text-white">«Добавить»</span>{" "}
        — иконка появится на главном экране
      </Step>
    </div>
  );
}

function Step({ num, icon, bg, children }: { num: number; icon: React.ReactNode; bg: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
        {icon}
      </div>
      <div className="flex-1">
        <span className="text-[11px] font-black text-neutral-500 uppercase tracking-wider">Шаг {num}</span>
        <p className="text-neutral-300 text-[13px] leading-relaxed mt-0.5">{children}</p>
      </div>
    </div>
  );
}
