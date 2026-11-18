"use client";

import { ArrowLeft, Heart, GitCompare, Share2, Send, Copy, Check } from "lucide-react";
import { useCompareStore } from "@/features/product/store/useCompareStore";
import { useWishlistStore } from "@/features/product/store/useWishlistStore";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProductMetaProps {
  productId: number;
  fallbackHref?: string;
}

export function ProductMeta({ productId, fallbackHref = "/catalog/all" }: ProductMetaProps) {
  const router = useRouter();
  const inWishlist = useWishlistStore((s) => s.has(productId));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const inCompare = useCompareStore((s) => s.has(productId));
  const compareFull = useCompareStore((s) => s.isFull());
  const toggleCompare = useCompareStore((s) => s.toggle);

  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setShareOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const [currentUrl, setCurrentUrl] = useState("");
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const telegramShareUrl = useMemo(() => {
    if (!currentUrl) return "https://t.me/+79266763488";
    return `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}`;
  }, [currentUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl || window.location.href);
      setCopied(true);
      toast.success("Ссылка скопирована");
      setTimeout(() => setCopied(false), 1500);
      setShareOpen(false);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-black/55">
      <button
        onClick={() => {
          if (window.history.length > 1) router.back();
          else router.push(fallbackHref);
        }}
        className="flex items-center gap-1.5 hover:text-black transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Назад</span>
      </button>

      <button
        onClick={() => toggleWishlist(productId)}
        className={cn(
          "flex items-center gap-1.5 transition-colors",
          inWishlist ? "text-black" : "hover:text-black"
        )}
      >
        <Heart size={14} className={inWishlist ? "fill-black" : ""} />
        <span>В избранное</span>
      </button>

      <button
        onClick={() => toggleCompare(productId)}
        disabled={!inCompare && compareFull}
        className={cn(
          "flex items-center gap-1.5 transition-colors",
          inCompare
            ? "text-black"
            : compareFull
            ? "text-black/25 cursor-not-allowed"
            : "hover:text-black"
        )}
      >
        <GitCompare size={14} />
        <span>К сравнению</span>
      </button>

      <div className="relative" ref={shareRef}>
        <button
          onClick={() => setShareOpen((v) => !v)}
          className="flex items-center gap-1.5 hover:text-black transition-colors"
        >
          <Share2 size={14} />
          <span>Поделиться</span>
        </button>

        {shareOpen && (
          <div className="absolute top-full mt-2 right-0 w-52 bg-white border border-neutral-200 rounded-xl shadow-lg z-30 p-1.5">
            <a
              href={telegramShareUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-50 text-neutral-600"
              onClick={() => setShareOpen(false)}
            >
              <Send size={14} />
              <span>Telegram</span>
            </a>

            <a
              href="tel:+79266763488"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-50 text-neutral-600"
              onClick={() => setShareOpen(false)}
            >
              <img
                src="/icons/logotip-messendzhera-max.svg"
                alt="MAX"
                className="w-[14px] h-[14px] object-contain rounded-full"
              />
              <span>MAX</span>
            </a>

            <button
              onClick={copyLink}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-50 text-neutral-600"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? "Скопировано" : "Копировать ссылку"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
