import { Metadata } from "next";
import { getPageContent } from "@/lib/getPageContent";
import ContactsClient from "./ContactsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Свяжитесь с нами в MAX, по телефону или email. Среднее время ответа — 15 минут.",
  alternates: { canonical: "/contacts" },
};

export default async function ContactsPage() {
  const data = await getPageContent("contacts");
  return <ContactsClient data={data} />;
}
