import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Info } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const ProductCardActions = dynamic(
  () => import("./ProductCardActions").then((m) => m.ProductCardActions),
  { ssr: false, loading: () => <div className="h-10 mt-auto pt-3" /> }
);

export interface ProductCardProduct {
  id: number;
  name: string;
  slug: string;
  sku?: string | null;
  price: number;
  priceOld?: number | null;
  showOtherPaymentPrice?: boolean;
  images: string[];
  isNew?: boolean;
  isSale?: boolean;
  inStock?: boolean;
  category?: { slug: string; name?: string };
}

interface ProductCardProps {
  product: ProductCardProduct;
  eagerImage?: boolean;
}

export function ProductCard({ product, eagerImage = false }: ProductCardProps) {
  const productUrl = `/catalog/${product.category?.slug || "any"}/${product.slug}`;
  const paymentMethodsPrice = product.priceOld ?? Math.round(product.price * 1.13);

  return (
    <article className="group bg-white rounded-[32px] p-3 transition-colors duration-300 hover:shadow-xl border border-transparent hover:border-neutral-100 flex flex-col relative overflow-hidden h-full select-none">
      <div className="absolute top-4 left-4 z-10 flex gap-1 font-black text-[8px] uppercase tracking-tighter pointer-events-none">
        {product.isNew && <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full shadow-sm">New</span>}
        {product.isSale && <span className="bg-red-600 text-white px-2 py-0.5 rounded-full shadow-sm">Sale</span>}
      </div>

      <Link href={productUrl} className="block">
        <div className="relative aspect-[16/11] mb-3 px-2">
          <div className="relative w-full h-full">
            <Image
              src={product.images[0] || "/placeholder.jpg"}
              alt={`Купить ${product.name} в Gameshop24`}
              title={`${product.name} — Фото в Gameshop24`}
              fill
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, (max-width: 1280px) 22vw, 16vw"
              quality={40}
              priority={eagerImage}
              loading={eagerImage ? "eager" : "lazy"}
              fetchPriority={eagerImage ? "high" : "auto"}
              className="object-contain p-1 transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>

        <div className="flex flex-col flex-1">
          <div className="mb-2">
            <p className="text-[10px] text-neutral-400 font-bold uppercase leading-tight tracking-wide">При оплате наличными</p>
            <p className="text-lg font-black text-secondary leading-none my-1">
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

          <div className="flex items-center mb-2">
            {product.inStock !== false ? (
              <span className="text-[9px] font-black uppercase tracking-wider text-green-500">● В наличии</span>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">● Под заказ</span>
            )}
          </div>

          <p className="text-[11px] font-bold text-secondary leading-[1.3] line-clamp-2 mb-4 flex-1">
            {product.name}
          </p>
        </div>
      </Link>

      <ProductCardActions product={product} />
    </article>
  );
}
