"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ProductCardActions } from "./ProductCardActions";
import type { ProductCardProduct } from "./ProductCard";
import { ProductCardMedia } from "./ProductCardMedia";

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
      <div className="absolute top-4 left-4 z-10 flex gap-1 font-medium text-[10px] uppercase tracking-normal pointer-events-none">
        {product.isNew && <span className="bg-primary text-white px-2.5 py-0.5 rounded-full">New</span>}
        {product.isSale && <span className="bg-commerce text-white px-2.5 py-0.5 rounded-full">Sale</span>}
      </div>

      <Link href={productUrl} className="block">
        <ProductCardMedia images={product.images} name={product.name} eagerImage={eagerImage} />

        <div className="flex flex-col flex-1">
          <div className="mb-2">
            <p className="text-[10px] sm:text-xs text-neutral-400 font-bold uppercase leading-tight tracking-wide">При оплате наличными</p>
            <p className="text-xl font-bold text-secondary leading-none my-1">
              {formatPrice(product.price)}
            </p>
            {product.showOtherPaymentPrice && (
              <>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-[10px] text-neutral-400 font-bold">Другие способы оплаты</p>
                  <Info size={10} className="text-neutral-300" />
                </div>
                <p className="text-xs font-bold text-neutral-400 mt-0.5">
                  {formatPrice(paymentMethodsPrice)}
                </p>
              </>
            )}
          </div>

          <div className="flex items-center mb-0.5">
            {product.inStock !== false ? (
              <span className="text-[12px] font-semibold uppercase tracking-[0.12em] leading-none text-green-600">● В наличии</span>
            ) : (
              <span className="text-[12px] font-black uppercase tracking-[0.18em] leading-none text-neutral-400">● Под заказ</span>
            )}
          </div>

          <div className="text-[14px] font-normal text-secondary leading-[1.35] mb-0 flex-none">
            {renderProductName(product.name)}
          </div>
        </div>
      </Link>

      <ProductCardActions product={product} />
    </article>
  );
}
