import Link from "next/link";
import type { CategorySeoContent } from "@/lib/categorySeoContent";

export function CategorySeoIntro({ content }: { content: CategorySeoContent }) {
  return (
    <section className="mb-8 rounded-lg border border-neutral-100 bg-white p-6 md:p-8">
      {content.intro.eyebrow ? (
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
          {content.intro.eyebrow}
        </p>
      ) : null}
      <h2 className="max-w-4xl text-2xl font-black leading-tight text-secondary md:text-4xl">
        {content.intro.title}
      </h2>
      <p className="mt-4 max-w-3xl text-sm font-medium leading-relaxed text-neutral-500 md:text-base">
        {content.intro.description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {content.intro.badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-primary/15 bg-primary/5 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-primary"
          >
            {badge}
          </span>
        ))}
      </div>
    </section>
  );
}

export function CategorySeoDetails({ content }: { content: CategorySeoContent }) {
  return (
    <section className="mt-14 space-y-10">
      <div className="grid gap-6 lg:grid-cols-3">
        {content.audience.items.map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-neutral-100 bg-white p-6"
          >
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
              Кому подойдет
            </p>
            <h3 className="mb-3 text-lg font-black text-secondary">{item.title}</h3>
            <p className="text-sm font-medium leading-relaxed text-neutral-500">
              {item.description}
            </p>
          </article>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-100 bg-white p-6 md:p-8">
        <h3 className="text-2xl font-black text-secondary">{content.memory.title}</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {content.memory.items.map((item) => (
            <article key={item.label} className="rounded-lg bg-neutral-50 p-5">
              <p className="text-xl font-black text-secondary">{item.label}</p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-500">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-neutral-100 bg-white p-6 md:p-8">
          <h3 className="text-2xl font-black text-secondary">{content.firmware.title}</h3>
          <div className="mt-5 space-y-4">
            {content.firmware.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm font-medium leading-relaxed text-neutral-500 md:text-base">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {content.firmware.highlights.map((item) => (
              <span
                key={item}
                className="rounded-full bg-secondary px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-100 bg-white p-6 md:p-8">
          <h3 className="text-2xl font-black text-secondary">{content.compare.title}</h3>
          <div className="mt-5 space-y-4">
            {content.compare.items.map((item) => (
              <div key={item.label} className="rounded-[20px] bg-neutral-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-600">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-100 bg-white p-6 md:p-8">
        <h3 className="text-2xl font-black text-secondary">Частые вопросы</h3>
        <div className="mt-6 space-y-4">
          {content.faqs.map((faq) => (
            <article key={faq.question} className="rounded-lg bg-neutral-50 p-5">
              <h4 className="text-base font-black text-secondary md:text-lg">{faq.question}</h4>
              <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-500 md:text-base">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-neutral-100 bg-white p-6 md:p-8">
        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          Полезно перед покупкой
        </p>
        <div className="flex flex-wrap gap-3">
          {content.internalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-neutral-200 px-4 py-3 text-xs font-black uppercase tracking-wide text-secondary transition-colors hover:border-primary/30 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
