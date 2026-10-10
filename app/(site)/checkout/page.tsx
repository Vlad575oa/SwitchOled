"use client";

import { useForm } from "react-hook-form";
import { useCartStore } from "@/features/cart/store/useCartStore";
import { Button } from "@/components/ui/Button";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { formatPhoneInput, hasValidPhoneLength } from "@/lib/phone";
import { ShoppingBag, MapPin } from "lucide-react";
import { toast } from "sonner";
import { getYandexAttribution } from "@/lib/analytics/yandexAttribution";

const PICKUP_ADDRESS = "Москва, Митинская 10, корп. 1 (м. Волоколамская)";

interface CheckoutFormData {
  name: string;
  phone: string;
  address: string;
  comment: string;
  consent: boolean;
}

export default function CheckoutPage() {
  const { items, totalPrice } = useCartStore();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CheckoutFormData>();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPickup, setIsPickup] = useState(false);
  const phoneAlertShownRef = useRef(false);
  const prevPhoneDigitCountRef = useRef(0);
  const router = useRouter();

  const finalTotal = totalPrice();

  const showPhoneValidationToast = () => {
    if (phoneAlertShownRef.current) {
      return;
    }

    phoneAlertShownRef.current = true;
    toast.error("Проверьте номер телефона");
  };

  const resetPhoneValidationToast = () => {
    phoneAlertShownRef.current = false;
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (!hasValidPhoneLength(data.phone)) {
      setError("phone", { type: "manual", message: "Проверьте номер телефона" });
      showPhoneValidationToast();
      return;
    }

    setLoading(true);
    setSubmitError(null);
    try {
      const yandexAttribution = await getYandexAttribution();
      const response = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          address: data.address,
          comment: data.comment || undefined,
          items,
          totalAmount: finalTotal,
          ...yandexAttribution,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        setSubmitError(result?.error || "Ошибка при создании заказа. Попробуйте ещё раз.");
        return;
      }

      const confirmationUrl = result?.data?.confirmationUrl;
      if (confirmationUrl) {
        window.location.href = confirmationUrl;
      } else {
        setSubmitError("Ошибка при создании заказа. Попробуйте ещё раз.");
      }
    } catch {
      setSubmitError("Нет соединения с сервером. Проверьте интернет и попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  // Empty cart guard
  if (items.length === 0) {
    return (
      <main className="container py-32 text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={36} className="text-neutral-300" />
        </div>
        <h1 className="text-2xl font-black text-secondary mb-2">Корзина пуста</h1>
        <p className="text-neutral-400 font-medium mb-8">Добавьте товары перед оформлением заказа</p>
        <Link href="/catalog/all" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
          Перейти в каталог
        </Link>
      </main>
    );
  }

  return (
    <main className="container px-4 sm:px-6 py-6 sm:py-12 lg:py-20 max-w-4xl">
      <h1 className="text-2xl sm:text-4xl font-black text-secondary mb-6 sm:mb-12">Оформление заказа</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
        <div className="space-y-5 md:space-y-8">
          <h2 className="text-2xl font-black text-secondary">Ваши данные</h2>

          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-bold text-neutral-400 mb-1.5 md:mb-2">Имя Фамилия</label>
              <input
                {...register("name", { required: "Введите имя" })}
                className={`w-full px-4 py-3 md:px-6 md:py-4 bg-neutral-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold ${errors.name ? "ring-2 ring-red-500/20" : ""}`}
                placeholder="Иван Иванов"
              />
              {errors.name && <p className="text-xs font-bold text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-400 mb-1.5 md:mb-2">Телефон</label>
              <input
                {...register("phone", {
                  required: "Введите номер телефона",
                  validate: (value) => hasValidPhoneLength(value) || "Проверьте номер телефона",
                })}
                onChange={(event) => {
                  const formatted = formatPhoneInput(event.target.value, prevPhoneDigitCountRef.current);
                  prevPhoneDigitCountRef.current = formatted.replace(/\D/g, "").length;
                  setValue("phone", formatted, { shouldDirty: true, shouldTouch: true, shouldValidate: false });

                  if (formatted && !hasValidPhoneLength(formatted)) {
                    setError("phone", { type: "manual", message: "Проверьте номер телефона" });
                    showPhoneValidationToast();
                  } else {
                    clearErrors("phone");
                    resetPhoneValidationToast();
                  }
                }}
                onBlur={(event) => {
                  const formatted = formatPhoneInput(event.target.value);
                  setValue("phone", formatted, { shouldDirty: true, shouldTouch: true, shouldValidate: false });
                  if (formatted && !hasValidPhoneLength(formatted)) {
                    setError("phone", { type: "manual", message: "Проверьте номер телефона" });
                    showPhoneValidationToast();
                  } else {
                    clearErrors("phone");
                    resetPhoneValidationToast();
                  }
                }}
                className={`w-full px-4 py-3 md:px-6 md:py-4 bg-neutral-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold ${errors.phone ? "ring-2 ring-red-500/20" : ""}`}
                inputMode="tel"
                placeholder="+8(983)777-33-33"
              />
              {errors.phone && <p className="text-xs font-bold text-red-500 mt-1">{errors.phone.message}</p>}
            </div>

            {/* Pickup toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => {
                  const next = !isPickup;
                  setIsPickup(next);
                  if (next) {
                    setValue("address", PICKUP_ADDRESS, { shouldValidate: true });
                  } else {
                    setValue("address", "", { shouldValidate: false });
                  }
                }}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${isPickup ? "bg-primary border-primary" : "bg-white border-neutral-300"}`}
              >
                {isPickup && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 7l4 4 6-6" />
                  </svg>
                )}
              </div>
              <span className="flex items-center gap-2 text-sm font-bold text-secondary">
                <MapPin size={15} className="text-primary" />
                Самовывоз из офиса
              </span>
            </label>

            <div>
              <label className="block text-sm font-bold text-neutral-400 mb-1.5 md:mb-2">
                {isPickup ? "Адрес самовывоза" : "Адрес доставки"}
              </label>
              <textarea
                {...register("address", { required: "Введите адрес доставки" })}
                rows={isPickup ? 2 : 4}
                readOnly={isPickup}
                className={`w-full px-4 py-3 md:px-6 md:py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold ${
                  isPickup ? "bg-primary/5 text-secondary cursor-default" : "bg-neutral-50"
                } ${errors.address ? "ring-2 ring-red-500/20" : ""}`}
                placeholder="Город, улица, дом, квартира"
              />
              {errors.address && <p className="text-xs font-bold text-red-500 mt-1">{errors.address.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-400 mb-1.5 md:mb-2">Комментарий к заказу <span className="font-medium">(необязательно)</span></label>
              <input
                {...register("comment")}
                className="w-full px-4 py-3 md:px-6 md:py-4 bg-neutral-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                placeholder="Пожелания, уточнения по заказу..."
              />
            </div>

          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-secondary p-8 rounded-[40px] text-white">
            <h2 className="text-2xl font-black mb-8">Заказ</h2>
            <div className="space-y-4 mb-8">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-neutral-400 font-medium truncate max-w-[150px]">{item.name} × {item.quantity}</span>
                  <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/10 mb-8 flex justify-between">
              <span className="text-lg font-bold">Итого</span>
              <span className="text-2xl font-black text-primary">{formatPrice(finalTotal)}</span>
            </div>

            {submitError && (
              <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold">
                {submitError}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full h-16 rounded-2xl bg-white text-secondary hover:bg-neutral-100 disabled:bg-neutral-800 disabled:text-neutral-600"
            >
              {loading ? "Обработка..." : "Завершить оформление"}
            </Button>

            <div className="mt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("consent", { required: "Необходимо дать согласие на обработку персональных данных" })}
                  className="mt-0.5 w-5 h-5 rounded border-neutral-300 accent-primary flex-shrink-0 cursor-pointer"
                />
                <span className="text-sm font-medium text-neutral-600 leading-snug">
                  Я даю своё согласие на обработку персональных данных в соответствии с{" "}
                  <Link href="/legal/privacy" className="text-primary underline underline-offset-2 hover:no-underline">
                    Политикой конфиденциальности
                  </Link>
                </span>
              </label>
              {errors.consent && <p className="text-xs font-bold text-red-500 mt-1">{errors.consent.message}</p>}
            </div>

            <p className="text-[10px] text-neutral-500 font-bold text-center mt-6 uppercase tracking-wider">
              Оплата наличными при получении
            </p>
          </div>
        </div>
      </form>
    </main>
  );
}
