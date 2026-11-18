"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// Appends the next portion of products by bumping the `show` param; the page keeps its scroll.
export function LoadMoreButton({ nextCount }: { nextCount: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const show = Math.max(1, Number(searchParams.get("show")) || 1);

  const params = new URLSearchParams(searchParams);
  params.set("show", String(show + 1));

  return (
    <div className="flex justify-center mt-8">
      <Link
        href={`${pathname}?${params.toString()}`}
        scroll={false}
        className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-black text-white text-[15px] font-semibold hover:bg-[#2b2b2b] transition-colors"
      >
        Показать ещё {nextCount}
      </Link>
    </div>
  );
}
