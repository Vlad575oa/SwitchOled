import Link from "next/link";
import { Home } from "lucide-react";

export function HomePageLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 rounded-full text-primary text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary/15 transition-all"
    >
      <Home size={14} />
      На главную
    </Link>
  );
}

