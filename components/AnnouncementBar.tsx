const ITEMS = [
  "Прошитые Nintendo Switch с гарантией 1 год",
  "Доставка в день заказа по Москве",
  "100+ игр уже в комплекте",
  "Шоурум в Москве · Митинская 10",
  "Работаем с 1997 года",
  "5.0 · 1000+ отзывов",
];

// Black rounded marquee strip above the navigation.
export function AnnouncementBar() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="px-3 pt-3">
      <div className="h-10 sm:h-11 rounded-xl bg-black text-white overflow-hidden flex items-center [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex animate-marquee whitespace-nowrap will-change-transform">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
              {row.map((item, i) => (
                <span key={i} className="shrink-0 px-3 text-[13px] sm:text-[15px] font-medium">
                  {item}
                  <span className="pl-6 text-white/50">–</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
