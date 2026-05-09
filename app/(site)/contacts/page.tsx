import { Metadata } from "next";
import { readFile } from "fs/promises";
import { join } from "path";
import ContactsClient from "./ContactsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Контакты | Gameshop24",
  description: "Свяжитесь с нами в MAX, по телефону или email. Среднее время ответа — 15 минут.",
  alternates: { canonical: "/contacts" },
};

async function getContactsData(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(join(process.cwd(), "content", "pages.json"), "utf-8");
    return JSON.parse(raw)?.contacts ?? {};
  } catch {
    return {};
  }
}

export default async function ContactsPage() {
  const data = await getContactsData();
  return <ContactsClient data={data} />;
}
