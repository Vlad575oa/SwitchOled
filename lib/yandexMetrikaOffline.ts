const DEFAULT_COUNTER_ID = "108974800";
const DEFAULT_TARGET = "order_paid";

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function getYandexOfflineConfig() {
  return {
    token: process.env.YANDEX_METRIKA_OAUTH_TOKEN?.trim(),
    counterId: process.env.YANDEX_METRIKA_COUNTER_ID?.trim() || DEFAULT_COUNTER_ID,
    target: process.env.YANDEX_METRIKA_PAID_GOAL_ID?.trim() || DEFAULT_TARGET,
  };
}

export function buildOfflineConversionCsv(input: {
  target: string;
  dateTime: Date;
  orderId: number;
  clientId?: string | null;
  yclid?: string | null;
  price: number;
}) {
  const headers = ["Target", "DateTime", "PurchaseId", "ClientId", "Yclid", "Price", "Currency"];
  const values = [
    input.target,
    Math.floor(input.dateTime.getTime() / 1000),
    input.orderId,
    input.clientId,
    input.yclid,
    (input.price / 100).toFixed(2),
    "RUB",
  ];
  return `${headers.map(csvCell).join(";")}\n${values.map(csvCell).join(";")}\n`;
}

export async function uploadYandexOfflineConversion(input: {
  orderId: number;
  dateTime: Date;
  clientId?: string | null;
  yclid?: string | null;
  price: number;
}) {
  const config = getYandexOfflineConfig();
  if (!config.token) throw new Error("Не настроен YANDEX_METRIKA_OAUTH_TOKEN");
  if (!input.clientId && !input.yclid) {
    throw new Error("У заказа нет ClientID или yclid для привязки к рекламе");
  }

  const csv = buildOfflineConversionCsv({ ...input, target: config.target });
  const form = new FormData();
  form.append("file", new Blob([csv], { type: "text/csv;charset=utf-8" }), `order-${input.orderId}.csv`);

  const response = await fetch(
    `https://api-metrika.yandex.net/management/v1/counter/${encodeURIComponent(config.counterId)}/offline_conversions/upload`,
    {
      method: "POST",
      headers: { Authorization: `OAuth ${config.token}` },
      body: form,
      cache: "no-store",
    }
  );
  const text = await response.text();
  if (!response.ok) throw new Error(`Яндекс Метрика: ${text.slice(0, 500)}`);

  let uploadId: string | null = null;
  try {
    const payload = JSON.parse(text) as { uploading?: { id?: number | string } };
    if (payload.uploading?.id !== undefined) uploadId = String(payload.uploading.id);
  } catch {
    // The upload was accepted even if the response is not JSON.
  }

  return { uploadId, target: config.target };
}
