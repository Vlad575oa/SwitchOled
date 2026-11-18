"use client";

import { cn, formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { ProductVariantOption } from "@/lib/queries";
import { useSelectedVariantStore } from "@/features/product/store/useSelectedVariantStore";
import { QuickOrderModal } from "@/features/product/components/QuickOrderModal";
import { getAvitoUrl } from "@/lib/avitoLinks";
import { readAvitoUrl } from "@/lib/productAttributes";
import { CONTACTS } from "@/lib/constants/contacts";

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
  excerpt?: string;
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

export function PurchaseBlock({ product, variants = [], categorySlug, excerpt }: PurchaseBlockProps) {
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

  const sku = selectedVariant.sku || product.sku || `L0${selectedVariant.id + 4000}`;
  const chip = (selected: boolean, available: boolean) =>
    cn(
      "h-10 px-4 rounded-lg text-[15px] border transition-colors",
      selected
        ? "border-black text-black"
        : available
        ? "border-transparent text-black hover:bg-surface-soft"
        : "border-transparent bg-surface-soft text-black/25"
    );

  return (
    <div className="flex flex-col">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <p className="text-[19px] font-semibold text-black">{formatPrice(selectedVariant.price)}</p>
        {selectedVariant.showOtherPaymentPrice && selectedVariant.priceOld && (
          <p className="text-[14px] text-black/45">{formatPrice(selectedVariant.priceOld)} — другие способы оплаты</p>
        )}
      </div>
      <p className="mt-1 text-[13px] text-black/45">При оплате наличными</p>

      {excerpt && (
        <div className="mt-6">
          <p className="text-[15px] leading-[1.6] text-black/80">{excerpt}</p>
          <a href="#description" className="mt-3 inline-flex items-center gap-2 text-[15px] font-medium text-black hover:text-black/60">
            <Plus size={16} /> Читать дальше
          </a>
        </div>
      )}

      {/* Options */}
      {canSelectVariants && (
        <div className="mt-6 space-y-5">
          {memoryOptions.length > 1 && (
            <div>
              <p className="text-[15px] font-medium text-black mb-2">Память</p>
              <div className="flex flex-wrap gap-2">
                {memoryOptions.map((memory) => (
                  <button
                    key={memory}
                    onClick={() => onMemoryChange(memory)}
                    className={chip(selectedVariant.memory === memory, availableMemories.has(memory))}
                  >
                    {memory}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colorOptions.length > 1 && (
            <div>
              <p className="text-[15px] font-medium text-black mb-2">Цвет</p>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => {
                  const hex = variantItems.find((v) => v.color === color)?.colorHex ?? null;
                  return (
                    <button
                      key={color}
                      onClick={() => onColorChange(color)}
                      className={cn(chip(selectedVariant.color === color, availableColors.has(color)), "inline-flex items-center gap-2")}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: hex ?? "#d1d5db" }} />
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-7 space-y-2.5">
        <AddToCartButton
          product={selectedVariant}
          label={`В корзину (${formatPrice(selectedVariant.price)})`}
          className="w-full h-14 rounded-full text-[15px] font-semibold bg-black hover:bg-[#2b2b2b] border-none"
        />
        <QuickOrderModal
          product={selectedVariant}
          buttonClassName="w-full h-12 rounded-full border border-black/15 bg-transparent px-4 text-[15px] font-medium text-black hover:border-black transition-colors"
        />
        <div className="flex items-center justify-between px-1 pt-1 text-[13px]">
          <span className={selectedVariant.inStock ? "text-green-600" : "text-black/45"}>
            {selectedVariant.inStock ? "● В наличии" : "○ Под заказ"}
          </span>
          {avitoUrl && (
            <a href={avitoUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-black/55 underline underline-offset-4 hover:text-black">
              Заказать через Авито
            </a>
          )}
        </div>
      </div>

      {/* Accordion */}
      <div className="mt-8 border-t border-neutral-200">
        <AccordionRow title="Гарантия">
          Гарантия 1 год на консоль и выполненные работы. Обслуживание в нашем сервисном центре в Москве.{" "}
          <Link href="/warranty" className="text-black underline underline-offset-4">Подробнее</Link>
        </AccordionRow>
        <AccordionRow title="Доставка и оплата">
          Доставка по Москве в день заказа или самовывоз из шоурума: {CONTACTS.address}.{" "}
          <Link href="/delivery" className="text-black underline underline-offset-4">Доставка</Link>
          {" · "}
          <Link href="/payment" className="text-black underline underline-offset-4">Оплата</Link>
        </AccordionRow>
        <AccordionRow title="О заказе">
          Цена, условия, комплектация и внешний вид являются предварительными и могут быть изменены в момент поступления товара на склад.
          <span className="block mt-2 text-black/45">Артикул: {sku}{product.brand ? ` · ${product.brand}` : ""}</span>
        </AccordionRow>
        <AccordionRow title="Поддержка">
          Поможем выбрать консоль, установить игры и настроить её. Звоните{" "}
          <a href={`tel:${CONTACTS.phoneHref}`} className="text-black underline underline-offset-4">{CONTACTS.phoneDisplay}</a>{" "}
          или пишите в чат.
        </AccordionRow>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[15px] text-black">Остались вопросы по консоли?</p>
        <Link href="/contacts#support-chat" className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-medium text-black hover:text-black/60">
          Написать в чат <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

function AccordionRow({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-5 text-left text-[16px] text-black"
      >
        {title}
        <Plus size={20} strokeWidth={1.5} className={cn("transition-transform duration-200", open && "rotate-45")} />
      </button>
      {open && <div className="pb-5 -mt-1 text-[14px] leading-[1.6] text-black/65">{children}</div>}
    </div>
  );
}
