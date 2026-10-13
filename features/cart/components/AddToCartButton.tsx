"use client";

import { useCartStore } from "@/features/cart/store/useCartStore";
import { Button } from "@/components/ui/Button";
import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trackEcommerceAddToCart } from "@/lib/analytics/metrikaEcommerce";

import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    images: string[];
    inStock?: boolean;
  };
  className?: string;
}

export const AddToCartButton = ({ product, className }: AddToCartButtonProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images?.[0] || "/placeholder.jpg",
      quantity: 1,
      inStock: product.inStock !== false,
    });
    trackEcommerceAddToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      },
      "product_page"
    );
    fetch("/api/cart-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, source: "product_page" }),
    }).catch(() => {});

    setIsAdded(true);
    toast.success("Добавлено в корзину", { description: product.name, duration: 2000 });
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <Button 
      className={cn(
        "rounded-2xl h-14 px-3 sm:px-4 transition-all gap-2 text-sm font-black whitespace-nowrap",
        isAdded && "bg-green-600 hover:bg-green-700",
        className
      )}
      onClick={handleAdd}
    >
      {isAdded ? (
        <Check size={18} className="shrink-0" />
      ) : (
        <ShoppingCart size={18} className="shrink-0" />
      )}
      <span className="whitespace-nowrap">{isAdded ? "В корзине" : "В корзину"}</span>
    </Button>
  );
};
