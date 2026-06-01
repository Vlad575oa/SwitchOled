import prisma from "@/lib/prisma";
import FAQClient from "@/components/FAQClient";
import { Metadata } from "next";
import { HomePageLink } from "@/components/HomePageLink";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Вопросы и ответы (FAQ) | Поддержка Gameshop24",
  description: "Всё о доставке, гарантии и оплате игровых консолей. Ответы на частые вопросы.",
  alternates: { canonical: "/faq" },
};

export default async function FAQPage() {
  const faqs = await prisma.fAQ.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <div className="bg-white min-h-screen pt-6 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="container max-w-[1400px] px-4 lg:px-12">
        <div className="mb-10">
          <HomePageLink />
        </div>


        {/* Categories + Accordion (client) */}
        <FAQClient faqs={faqs} />

        {/* Support CTA */}
        <div className="mt-24 md:mt-40 p-12 md:p-24 bg-secondary rounded-[64px] relative overflow-hidden text-center md:text-left shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <h3 className="text-4xl md:text-6xl font-black text-white leading-[1.05] uppercase italic">
                Всё ещё нужна помощь? <br /><span className="text-primary">Мы на связи 24/7.</span>
              </h3>
              <p className="text-neutral-400 font-bold text-lg md:text-2xl max-w-xl">
                Наши специалисты ответят в течение 5 минут в MAX или WhatsApp.
              </p>
            </div>
            <div className="flex flex-wrap justify-center lg:justify-end gap-6">
              <button className="px-12 py-6 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm md:text-base hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30">
                Открыть Чат
              </button>
              <button className="px-12 py-6 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-sm md:text-base hover:bg-white/20 transition-all border border-white/10">
                Позвонить
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
