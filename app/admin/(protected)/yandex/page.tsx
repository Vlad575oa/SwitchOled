import YandexDirectPanel from "../analytics/YandexDirectPanel";

export const dynamic = "force-dynamic";

export default function YandexDirectPage() {
  return (
    <>
      <header className="border-b border-neutral-100 bg-white px-8 py-5">
        <h1 className="text-xl font-black text-[#111827]">Яндекс Директ</h1>
        <p className="mt-0.5 text-xs font-bold text-neutral-400">Подключение кабинета и анализ рекламных кампаний</p>
      </header>
      <div className="p-8">
        <YandexDirectPanel />
      </div>
    </>
  );
}
