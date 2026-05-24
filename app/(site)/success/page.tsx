"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/features/cart/store/useCartStore";
import { trackEcommercePurchase } from "@/lib/analytics/metrikaEcommerce";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const { items, totalPrice, clearCart } = useCartStore();

  useEffect(() => {
    const orderId = searchParams.get("orderId") ?? "unknown";

    if (items.length > 0) {
      trackEcommercePurchase({
        orderId,
        revenue: totalPrice(),
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });
    }

    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="container py-32 text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
        <CheckCircle2 size={48} className="text-green-600" />
      </div>
      <h1 className="text-4xl font-black text-secondary mb-4">Спасибо за заказ!</h1>
      <p className="text-neutral-500 mb-10 max-w-md mx-auto">
        Ваш заказ успешно оформлен. Мы свяжемся с вами в ближайшее время для уточнения деталей доставки.
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/">
          <Button size="lg" className="rounded-2xl">На главную</Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="lg" className="rounded-2xl">В каталог</Button>
        </Link>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
