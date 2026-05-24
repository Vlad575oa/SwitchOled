"use client";

import { useCartStore } from "@/features/cart/store/useCartStore";
import { Button } from "@/components/ui/Button";
import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trackEcommerceAddToCart } from "@/lib/analytics/metrikaEcommerce";

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
      size="lg" 
      className={cn(
        "rounded-2xl h-16 transition-all gap-3",
        isAdded && "bg-green-600 hover:bg-green-700",
        className
      )}
      onClick={handleAdd}
    >
      {isAdded ? <Check size={20} /> : <ShoppingCart size={20} />}
      <span>{isAdded ? "В корзине" : "В корзину"}</span>
    </Button>
  );
};

import { cn } from "@/lib/utils";
