export type CartEventSource = "catalog_grid" | "product_page" | string;

export interface CartEventStatInput {
  createdAt: Date;
  source: CartEventSource;
}

export interface CartEventsByDate {
  dateKey: string;
  dateLabel: string;
  total: number;
  grid: number;
  page: number;
}

const keyFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Moscow",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const labelFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function groupCartEventsByDate(events: CartEventStatInput[]): CartEventsByDate[] {
  const grouped = new Map<string, CartEventsByDate>();

  for (const event of events) {
    const dateKey = keyFormatter.format(event.createdAt);
    const current = grouped.get(dateKey) ?? {
      dateKey,
      dateLabel: labelFormatter.format(event.createdAt),
      total: 0,
      grid: 0,
      page: 0,
    };

    current.total += 1;
    if (event.source === "catalog_grid") current.grid += 1;
    if (event.source === "product_page") current.page += 1;

    grouped.set(dateKey, current);
  }

  return Array.from(grouped.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}
