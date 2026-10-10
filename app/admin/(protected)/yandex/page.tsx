import { Suspense } from "react";
import YandexDirectAdminClient from "./YandexDirectAdminClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Яндекс Директ | Панель управления",
};

export default function YandexDirectPage() {
  return (
    <>
      <header className="border-b border-neutral-100 bg-white px-8 py-5">
        <h1 className="text-xl font-black text-[#111827]">Яндекс Директ</h1>
        <p className="mt-0.5 text-xs font-bold text-neutral-400">
          Подключение любого аккаунта, отчёты по кампаниям, статистика и поиск минус-слов
        </p>
      </header>
      <div className="p-8">
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center rounded-2xl border border-neutral-100 bg-white">
              <p className="text-xs font-bold text-neutral-400">Загрузка данных Яндекс Директа…</p>
            </div>
          }
        >
          <YandexDirectAdminClient />
        </Suspense>
      </div>
    </>
  );
}
