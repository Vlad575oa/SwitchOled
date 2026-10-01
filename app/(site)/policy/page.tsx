import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Политика и юридическая информация",
  description: "Юридические документы Gameshop24: оферта, политика конфиденциальности, условия использования и cookie.",
  alternates: { canonical: "/policy" },
};

export default function PolicyPage() {
  return (
    <div className="bg-white min-h-screen pt-10 pb-24">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-black text-secondary mb-6 uppercase">Политика и документы</h1>
        <div className="space-y-3 text-neutral-600 font-medium">
          <p>Актуальные юридические документы размещены на отдельных страницах:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><Link className="text-primary hover:underline" href="/legal/offer">Публичная оферта</Link></li>
            <li><Link className="text-primary hover:underline" href="/legal/privacy">Политика конфиденциальности</Link></li>
            <li><Link className="text-primary hover:underline" href="/legal/terms">Условия использования</Link></li>
            <li><Link className="text-primary hover:underline" href="/legal/cookies">Политика cookie</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
