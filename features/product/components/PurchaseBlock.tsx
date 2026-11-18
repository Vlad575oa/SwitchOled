"use client";

import { cn, formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { Info, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProductVariantOption } from "@/lib/queries";
import { useSelectedVariantStore } from "@/features/product/store/useSelectedVariantStore";
import { QuickOrderModal } from "@/features/product/components/QuickOrderModal";
import { getAvitoUrl } from "@/lib/avitoLinks";
import { readAvitoUrl } from "@/lib/productAttributes";
import { ExternalLink } from "lucide-react";

interface PurchaseBlockProps {
  product: {
    id: number;
    name: string;
    slug: string;
    sku?: string | null;
    price: number;
    priceOld?: number | null;
    showOtherPaymentPrice?: boolean;
    inStock: boolean;
    brand?: string | null;
    images: string[];
    attributes?: unknown;
  };
  variants?: ProductVariantOption[];
  categorySlug?: string;
}

type VariantCardItem = {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  priceOld: number | null;
  showOtherPaymentPrice: boolean;
  inStock: boolean;
  images: string[];
  memory: string | null;
  color: string | null;
  colorHex: string | null;
  avitoUrl: string | null;
};

const pickBestMatch = (
  items: VariantCardItem[],
  memory: string | null,
  color: string | null
) => {
  const exact = items.find(
    (item) =>
      (memory ? item.memory === memory : true) && (color ? item.color === color : true)
  );
  if (exact) return exact;

  const byMemory = memory ? items.find((item) => item.memory === memory) : null;
  if (byMemory) return byMemory;

  const byColor = color ? items.find((item) => item.color === color) : null;
  if (byColor) return byColor;

  return items[0];
};

export function PurchaseBlock({ product, variants = [], categorySlug }: PurchaseBlockProps) {
  const setVariantImages = useSelectedVariantStore((s) => s.setImages);
  const variantItems = useMemo<VariantCardItem[]>(() => {
    if (!variants.length) {
      return [
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku ?? null,
          price: product.price,
          priceOld: product.priceOld ?? null,
          showOtherPaymentPrice: product.showOtherPaymentPrice ?? false,
          inStock: product.inStock,
          images: product.images,
          memory: null,
          color: null,
          colorHex: null,
          avitoUrl: readAvitoUrl(product.attributes),
        },
      ];
    }
    return variants;
  }, [product, variants]);

  const [selectedVariantId, setSelectedVariantId] = useState(product.id);

  const selectedVariant = useMemo(
    () =>
      variantItems.find((variant) => variant.id === selectedVariantId) ?? variantItems[0],
    [selectedVariantId, variantItems]
  );

  const memoryOptions = useMemo(
    () =>
      Array.from(
        new Set(variantItems.map((variant) => variant.memory).filter(Boolean) as string[])
      ).filter((m) => m !== "0" && m !== "Не указана"),
    [variantItems]
  );

  const colorOptions = useMemo(
    () =>
      Array.from(
        new Set(variantItems.map((variant) => variant.color).filter(Boolean) as string[])
      ),
    [variantItems]
  );

  const canSelectVariants = memoryOptions.length > 1 || colorOptions.length > 1;

  const availableMemories = useMemo(() => {
    if (!selectedVariant.color) return new Set(memoryOptions);
    const matches = variantItems
      .filter((item) => item.color === selectedVariant.color)
      .map((item) => item.memory)
      .filter(Boolean) as string[];
    return matches.length > 0 ? new Set(matches) : new Set(memoryOptions);
  }, [variantItems, selectedVariant.color, memoryOptions]);

  const availableColors = useMemo(() => {
    if (!selectedVariant.memory) return new Set(colorOptions);
    const matches = variantItems
      .filter((item) => item.memory === selectedVariant.memory)
      .map((item) => item.color)
      .filter(Boolean) as string[];
    return matches.length > 0 ? new Set(matches) : new Set(colorOptions);
  }, [variantItems, selectedVariant.memory, colorOptions]);

  const applyVariant = (next: VariantCardItem) => {
    setSelectedVariantId(next.id);
    if (next.images.length) setVariantImages(next.images);
    if (categorySlug) {
      window.history.replaceState(null, "", `/catalog/${categorySlug}/${next.slug}`);
    }
  };

  const avitoUrl = selectedVariant.avitoUrl ?? getAvitoUrl(selectedVariant.slug);

  const onMemoryChange = (memory: string) => {
    const next = pickBestMatch(variantItems, memory, selectedVariant.color);
    applyVariant(next);
  };

  const onColorChange = (color: string) => {
    const next = pickBestMatch(variantItems, selectedVariant.memory, color);
    applyVariant(next);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Main card */}
      <div className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm">
        {/* Pricing */}
        <div className="space-y-4 mb-8">
          <div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">При оплате наличными</p>
            <p className="text-4xl font-black text-secondary leading-none">
              {formatPrice(selectedVariant.price)}
            </p>
          </div>
          
          {selectedVariant.showOtherPaymentPrice && selectedVariant.priceOld && (
            <div>
              <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">Другие способы оплаты</p>
              <p className="text-lg font-bold text-neutral-300">
                {formatPrice(selectedVariant.priceOld)}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <AddToCartButton
              product={selectedVariant}
              className="w-full h-14 rounded-full px-2.5 sm:px-3 text-sm font-bold bg-primary hover:bg-primary-pressed border-none whitespace-nowrap"
            />
            <QuickOrderModal
              product={selectedVariant}
              buttonClassName="w-full h-14 rounded-full border border-primary bg-transparent px-2 text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors whitespace-nowrap"
            />
          </div>
          {avitoUrl && (
            <a
              href={avitoUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#00a86b]/25 bg-[#00a86b]/5 px-4 text-sm font-black text-[#008f5b] transition-colors hover:bg-[#00a86b] hover:text-white"
            >
              <ExternalLink size={17} />
              Заказать через Авито
            </a>
          )}
          <div className="flex items-center gap-2 px-1 text-sm font-bold text-neutral-400">
             <span className={selectedVariant.inStock ? "text-green-500" : "text-yellow-500"}>
                {selectedVariant.inStock ? "● В наличии" : "○ Под заказ"}
             </span>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between py-4 border-t border-neutral-50 mb-4">
           <span className="text-xs font-bold text-neutral-400">Артикул: {selectedVariant.sku || product.sku || `L0${selectedVariant.id + 4000}`}</span>
           {product.brand && (
             <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                <span className="text-[10px] font-black uppercase text-secondary">{product.brand}</span>
             </div>
           )}
        </div>

        {/* Info Box */}
        <div className="bg-neutral-50 rounded-2xl p-4 flex gap-3 text-[11px] leading-relaxed text-neutral-500 font-medium">
            <Info size={16} className="text-neutral-300 flex-shrink-0 mt-0.5" />
            <p>
                <b>О заказе:</b> Цена, условия, комплектация и внешний вид являются предварительными и могут быть изменены в момент поступления товара на склад.
            </p>
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-3">
         {canSelectVariants && (
          <div className="space-y-3">
            {memoryOptions.length > 1 && (
              <div className="bg-[#f0f9ff] rounded-2xl p-4">
                <label className="text-[10px] text-blue-500 font-bold uppercase mb-3 block">
                  Объем памяти
                </label>
                <div className="flex flex-wrap gap-2">
                  {memoryOptions.map((memory) => {
                    const isSelected = selectedVariant.memory === memory;
                    const isAvailable = availableMemories.has(memory);
                    return (
                      <button
                        key={memory}
                        onClick={() => onMemoryChange(memory)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                          isSelected
                            ? "bg-secondary text-white border-secondary"
                            : isAvailable
                            ? "bg-white text-secondary border-neutral-200 hover:border-secondary hover:shadow-sm"
                            : "bg-white text-neutral-300 border-neutral-100 line-through"
                        )}
                      >
                        {memory}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {colorOptions.length > 1 && (
              <div className="bg-[#f0f9ff] rounded-2xl p-4">
                <label className="text-[10px] text-blue-500 font-bold uppercase mb-3 block">
                  Цвет: <span className="text-secondary normal-case tracking-normal">{selectedVariant.color}</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((color) => {
                    const isSelected = selectedVariant.color === color;
                    const isAvailable = availableColors.has(color);
                    const hex = variantItems.find((v) => v.color === color)?.colorHex ?? null;
                    return (
                      <button
                        key={color}
                        onClick={() => onColorChange(color)}
                        title={color}
                        className={cn(
                          "flex flex-col items-center gap-1 group focus:outline-none",
                          !isAvailable && "opacity-40"
                        )}
                      >
                        <span
                          className={cn(
                            "w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center shadow-sm",
                            isSelected
                              ? "border-primary scale-110 shadow-md shadow-primary/20"
                              : "border-transparent group-hover:border-neutral-300"
                          )}
                          style={hex ? { backgroundColor: hex } : { backgroundColor: "#d1d5db" }}
                        >
                          {isSelected && (
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-white"
                              style={hex ? { boxShadow: `0 0 0 1px ${hex}` } : {}}
                            />
                          )}
                        </span>
                        <span className={cn(
                          "text-[9px] font-bold max-w-[48px] text-center leading-tight break-words",
                          isSelected ? "text-primary" : "text-neutral-400"
                        )}>
                          {color}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
         )}

         <div className="bg-white border border-neutral-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-neutral-300" />
                <span className="text-sm font-bold text-secondary">Гарантия 1 год</span>
            </div>
            <Info size={18} className="text-neutral-200" />
         </div>
      </div>

      {/* Seller info */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-black text-neutral-400 text-xs">IS</div>
          <div>
              <p className="text-sm font-black text-secondary leading-tight">Gameshop24</p>
              <p className="text-[10px] text-neutral-400 font-bold">Официальный продавец</p>
          </div>
      </div>
    </div>
  );
}
