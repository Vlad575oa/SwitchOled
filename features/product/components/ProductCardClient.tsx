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
    <article className="group bg-white rounded-[32px] p-2 sm:p-2.5 transition-colors duration-300 hover:shadow-xl border border-transparent hover:border-neutral-100 flex flex-col relative overflow-hidden h-full select-none">
      <div className="absolute top-4 left-4 z-10 flex gap-1 font-black text-[8px] uppercase tracking-tighter pointer-events-none">
        {product.isNew && <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full shadow-sm">New</span>}
        {product.isSale && <span className="bg-red-600 text-white px-2 py-0.5 rounded-full shadow-sm">Sale</span>}
      </div>

      <Link href={productUrl} className="block">
        <ProductCardMedia images={product.images} name={product.name} eagerImage={eagerImage} />

        <div className="flex flex-col flex-1">
          <div className="mb-2">
            <p className="text-[10px] sm:text-xs text-neutral-400 font-bold uppercase leading-tight tracking-wide">При оплате наличными</p>
            <p className="text-xl font-black text-secondary leading-none my-1">
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
              <span className="text-[12px] font-black uppercase tracking-[0.18em] leading-none text-green-500">● В наличии</span>
            ) : (
              <span className="text-[12px] font-black uppercase tracking-[0.18em] leading-none text-neutral-400">● Под заказ</span>
            )}
          </div>

          <div className="text-[12px] font-bold text-secondary leading-[1.28] mb-0 flex-none">
            {renderProductName(product.name)}
          </div>
        </div>
      </Link>

      <ProductCardActions product={product} />
    </article>
  );
}
