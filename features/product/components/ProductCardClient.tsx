"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { ProductCardActions } from "./ProductCardActions";
import type { ProductCardProduct } from "./ProductCard";
import { ProductCardMedia } from "./ProductCardMedia";
import { QuickOrderModal } from "./QuickOrderModal";

interface ProductCardClientProps {
  product: ProductCardProduct;
  eagerImage?: boolean;
}

const renderProductName = (name: string) => {
  const parts = name.split(/\s*\+\s*/).filter(Boolean);

  return parts.map((part, index) => (
    <span
      key={`${part}-${index}`}
      className={
        index === 0
          ? "block whitespace-normal break-words"
          : "block mt-1 text-[13px] sm:text-[14px] font-black text-secondary leading-tight whitespace-normal break-words"
      }
    >
      {index === 0 ? part : `+ ${part}`}
    </span>
  ));
};

export function ProductCardClient({ product, eagerImage = false }: ProductCardClientProps) {
  const productUrl = `/catalog/${product.category?.slug || "any"}/${product.slug}`;
  const paymentMethodsPrice = product.priceOld ?? Math.round(product.price * 1.13);

  return (
    <article className="group bg-surface-card rounded-lg p-2 sm:p-2.5 transition-[border-color,box-shadow] duration-200 border border-transparent hover:border-neutral-200 active:shadow-[0_4px_12px_rgba(0,0,0,0.16)] flex flex-col relative overflow-hidden h-full select-none">
      <QuickOrderModal
        product={{ id: product.id, name: product.name }}
        buttonClassName="w-full h-10 mb-2 rounded-full border border-primary bg-transparent px-2 text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.03em] text-primary hover:bg-primary hover:text-white transition-colors"
      />

      <div className="absolute top-[60px] left-4 z-10 flex gap-1 font-medium text-[10px] uppercase tracking-normal pointer-events-none">
        {product.isNew && <span className="bg-primary text-white px-2.5 py-0.5 rounded-full">New</span>}
        {product.isSale && <span className="bg-white text-black border border-black px-2.5 py-0.5 rounded-full">Sale</span>}
      </div>

      <Link href={productUrl} className="flex flex-col flex-1">
        <ProductCardMedia images={product.images} name={product.name} eagerImage={eagerImage} />

        <div className="flex flex-col flex-1 pt-2">
          <div className="text-[14px] font-normal text-secondary leading-[1.35] flex-none">
            {renderProductName(product.name)}
          </div>

          {/* Stock on the left, price on the right — pinned to the bottom of the card */}
          <div className="mt-auto pt-3 flex items-end justify-between gap-2">
            {product.inStock !== false ? (
              <span className="pb-1 text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.08em] leading-none text-green-600 whitespace-nowrap">● В наличии</span>
            ) : (
              <span className="pb-1 text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.08em] leading-none text-neutral-400 whitespace-nowrap">● Под заказ</span>
            )}
            <div className="text-right">
              <p className="text-[18px] sm:text-xl font-bold text-secondary leading-none whitespace-nowrap">
                {formatPrice(product.price)}
              </p>
              <p className="mt-1 text-[10px] sm:text-[11px] text-neutral-400 leading-none whitespace-nowrap">
                {product.showOtherPaymentPrice ? `${formatPrice(paymentMethodsPrice)} — другие способы` : "наличными"}
              </p>
            </div>
          </div>
        </div>
      </Link>

      <ProductCardActions product={product} />
    </article>
  );
}
