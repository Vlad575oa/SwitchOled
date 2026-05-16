import { randomUUID } from "crypto";

const SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;

const auth = Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString("base64");

export const yookassa = {
  createPayment: async (amount: number, description: string, returnUrl: string) => {
    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Idempotence-Key": randomUUID(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: {
          value: amount.toFixed(2),
          currency: "RUB",
        },
        confirmation: {
          type: "redirect",
          return_url: returnUrl,
        },
        capture: true,
        description,
      }),
    });
    if (!response.ok) throw new Error(`YooKassa error: ${response.status}`);
    return response.json();
  },
};
