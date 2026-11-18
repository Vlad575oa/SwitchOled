"use client";

import { useState, useRef, useEffect } from "react";
import { Search as SearchIcon, X, Loader2, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { searchProductsAction } from "@/lib/actions";

interface SearchProduct {
  id: number;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  image: string;
}

export const Search = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [popularItems, setPopularItems] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [popularLoaded, setPopularLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const displayItems = query.length >= 2 ? results : popularItems;
  const quickTags = popularItems.slice(0, 5).map((item) => item.name);

  const handleSubmit = () => {
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/catalog/all?q=${encodeURIComponent(query.trim())}`);
    }
  };

  useEffect(() => {
    if (!isOpen || popularLoaded) return;

    const fetchPopular = async () => {
      try {
        const data = await searchProductsAction(""); // I'll update the action to return defaults if empty
        if (data && data.length > 0) {
          setPopularItems(data);
        }
      } catch (e) {
        console.error("Failed to fetch popular items", e);
      } finally {
        setPopularLoaded(true);
      }
    };
    fetchPopular();
  }, [isOpen, popularLoaded]);

  useEffect(() => {
    const handleSearch = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const data = await searchProductsAction(query);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative z-50 transition-[max-width,width,left,transform] duration-300 lg:mx-auto",
        isOpen
          ? "w-screen left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:w-[760px] lg:max-w-[760px]"
          : "w-full lg:w-[680px] lg:max-w-[680px]"
      )}
    >
      {/* Ozon-style Search Bar */}
      <div className={cn(
        "flex items-center h-11 bg-white border-2 rounded-[14px] transition-all duration-300 overflow-hidden",
        isOpen ? "border-primary shadow-[0_0_0_4px_rgba(17,17,17,0.1)]" : "border-neutral-200"
      )}>
        {/* Input Area */}
        <div className="flex-1 relative flex items-center px-3 h-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Искать в Gameshop24..."
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full bg-transparent border-none focus:ring-0 outline-none text-[16px] lg:text-[14px] font-medium text-secondary ml-1 placeholder:text-neutral-400"
          />
          {query && (
            <button 
              onClick={() => setQuery("")} 
              className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors mr-1"
            >
              <X size={16} className="text-neutral-400" />
            </button>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={() => {
            if (query.trim()) {
              handleSubmit();
            } else {
              setIsOpen(true);
            }
          }}
          className="flex items-center justify-center w-14 h-full bg-primary hover:bg-primary-pressed transition-all group shrink-0"
        >
          {isLoading ? (
            <Loader2 size={20} className="text-white animate-spin" />
          ) : (
            <SearchIcon size={20} className="text-white group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* Ozon-style Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-1/2 w-screen -translate-x-1/2 bg-white border border-neutral-100 p-5 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] sm:left-0 sm:right-0 sm:w-auto sm:translate-x-0 sm:rounded-lg">
          
          {/* Quick Tags */}
          {quickTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {quickTags.map((tag) => (
              <button 
                key={tag} 
                className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 rounded-full text-[11px] font-bold text-neutral-500 hover:text-secondary transition-all"
                onClick={() => {
                  setQuery(tag);
                  setIsOpen(false);
                }}
              >
                {tag}
              </button>
              ))}
            </div>
          )}

          <div className="space-y-6">
            <section>
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp size={12} />
                {query.length >= 2 ? "Результаты поиска" : "Популярные товары"}
              </h3>
              
              <div className="space-y-1">
                {displayItems.map((item) => (
                  <Link 
                    key={item.id} 
                    href={`/catalog/${item.categorySlug}/${item.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 p-2.5 rounded-2xl hover:bg-neutral-50 transition-all group"
                  >
                    <div className="w-11 h-11 relative rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-100">
                      <Image
                        src={item.image || "/images/placeholder.webp"}
                        alt={item.name}
                        fill
                        sizes="44px"
                        quality={65}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-secondary group-hover:text-primary transition-colors truncate">{item.name}</h4>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{item.category}</p>
                    </div>
                  </Link>
                ))}
                {!isLoading && displayItems.length === 0 && (
                  <div className="px-2 py-4 text-sm font-medium text-neutral-400">
                    {query.length >= 2
                      ? "Ничего не найдено в текущем каталоге."
                      : "В каталоге пока нет товаров для показа в поиске."}
                  </div>
                )}
              </div>
            </section>
          </div>
          
          {query.trim() && (
            <div className="mt-6 pt-5 border-t border-neutral-50">
              <button
                onClick={handleSubmit}
                className="block w-full text-center text-xs font-black text-primary uppercase tracking-[0.1em] hover:text-red-700 transition-colors"
              >
                Смотреть все результаты по «{query.trim()}»
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
