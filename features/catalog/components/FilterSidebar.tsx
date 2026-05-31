"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceRangeSlider } from "./PriceRangeSlider";
import { motion, AnimatePresence } from "framer-motion";
import { getFilteredProductsCountAction } from "../actions";

const MAX_PRICE = 200000;

const STATUS_OPTIONS = [
  { label: "В наличии", value: "inStock" },
  { label: "Под заказ", value: "onOrder" },
];

interface Category {
  id: number;
  name: string;
  slug: string;
  children?: Category[];
}

// ─── ColorScrollRow ─────────────────────────────────────────────────────────

interface ColorScrollRowProps {
  availableColors: Array<{ name: string; hex: string }>;
  selectedColors: string[];
  onToggle: (name: string) => void;
}

const ColorScrollRow = ({ availableColors, selectedColors, onToggle }: ColorScrollRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [availableColors]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  };

  // Split colors into rows of 6
  const ROW_SIZE = 6;
  const rows: Array<typeof availableColors> = [];
  for (let i = 0; i < availableColors.length; i += ROW_SIZE) {
    rows.push(availableColors.slice(i, i + ROW_SIZE));
  }

  return (
    <div className="relative -mx-1">
      {/* Left fade + arrow */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 z-10 flex items-center transition-opacity duration-200",
          canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="w-8 h-full bg-gradient-to-r from-white to-transparent" />
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 w-7 h-7 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-400 hover:text-secondary hover:border-neutral-300 transition-all active:scale-90"
        >
          <ChevronLeft size={13} />
        </button>
      </div>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide px-1 pt-2 pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex flex-col gap-2" style={{ width: "max-content" }}>
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-2">
              {row.map((colorObj) => {
                const isSelected = selectedColors.includes(colorObj.name);
                const isLight =
                  colorObj.name === "Белый" ||
                  colorObj.name === "Жёлтый" ||
                  colorObj.name === "White" ||
                  colorObj.name === "Серебристый" ||
                  colorObj.hex.toLowerCase() === "#ffffff" ||
                  colorObj.hex.toLowerCase() === "#f5f5f5" ||
                  colorObj.hex.toLowerCase() === "#fafafa" ||
                  colorObj.hex.toLowerCase() === "#f0f0f0" ||
                  colorObj.hex.toLowerCase() === "#e8e8e8";
                return (
                  <button
                    key={colorObj.name}
                    title={colorObj.name}
                    onClick={() => onToggle(colorObj.name)}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95 relative flex-shrink-0",
                      isSelected
                        ? "border-primary ring-2 ring-primary/30 scale-110"
                        : isLight
                        ? "border-neutral-300 shadow-sm hover:border-neutral-400"
                        : "border-white shadow-sm hover:border-neutral-300"
                    )}
                    style={{ backgroundColor: colorObj.hex }}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            isLight ? "bg-neutral-600" : "bg-white"
                          )}
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Right fade + arrow */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 z-10 flex items-center transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="w-8 h-full bg-gradient-to-l from-white to-transparent" />
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 w-7 h-7 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-400 hover:text-secondary hover:border-neutral-300 transition-all active:scale-90"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── Sub-components defined OUTSIDE FilterSidebar to prevent remount on state change ──

interface FilterSectionProps {
  title: string;
  id: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const FilterSection = ({ title, children, isOpen, onToggle }: FilterSectionProps) => (
  <div className="border-b border-neutral-100 last:border-0">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-5 text-left group"
    >
      <h3 className="text-sm font-black text-secondary group-hover:text-primary transition-colors duration-200">
        {title}
      </h3>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300",
          isOpen ? "bg-primary/8" : "bg-neutral-50"
        )}
      >
        <ChevronDown
          size={14}
          className={cn(
            "transition-colors duration-300",
            isOpen ? "text-primary" : "text-neutral-300"
          )}
        />
      </motion.div>
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
        >
          <div className="pb-5 space-y-3">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface CheckboxOptionProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  colorHex?: string;
}

const CheckboxOption = ({ label, checked, onChange, colorHex }: CheckboxOptionProps) => (
  <label className="flex items-center gap-3 cursor-pointer group px-1">
    <div
      className={cn(
        "w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center flex-shrink-0",
        checked
          ? "bg-primary border-primary"
          : "border-neutral-200 group-hover:border-primary/40"
      )}
      onClick={onChange}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
    {colorHex && (
      <div
        className="w-4 h-4 rounded-full flex-shrink-0 border border-neutral-200 shadow-sm"
        style={{ backgroundColor: colorHex }}
      />
    )}
    <span
      className={cn(
        "text-[13px] font-bold transition-colors",
        checked ? "text-secondary" : "text-neutral-400 group-hover:text-secondary"
      )}
    >
      {label}
    </span>
  </label>
);

// ─── Main component ───────────────────────────────────────────────────────────

interface FilterSidebarProps {
  currentCategory: string;
  totalCount: number;
  categoryTree: any[];
  availableColors: Array<{ name: string; hex: string }>;
  availableMemories: string[];
}

export const FilterSidebar = ({
  currentCategory,
  totalCount,
  categoryTree,
  availableColors,
  availableMemories,
}: FilterSidebarProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // ── Common filter state ────────────────────────────────────────────────────
  const [priceMin, setPriceMin] = useState(Number(searchParams.get("priceMin") ?? 0));
  const [priceMax, setPriceMax] = useState(Number(searchParams.get("priceMax") ?? MAX_PRICE));
  const [priceMinInput, setPriceMinInput] = useState(searchParams.get("priceMin") ?? "");
  const [priceMaxInput, setPriceMaxInput] = useState(searchParams.get("priceMax") ?? "");
  const [colors, setColors] = useState<string[]>(
    searchParams.get("color")?.split(",").filter(Boolean) ?? []
  );
  const [memories, setMemories] = useState<string[]>(
    searchParams.get("memory")?.split(",").filter(Boolean) ?? []
  );
  const [statuses, setStatuses] = useState<string[]>(
    searchParams.get("status")?.split(",").filter(Boolean) ?? []
  );

  // ── Live Count State ──────────────────────────────────────────────────────
  const [liveCount, setLiveCount] = useState(totalCount);
  const [isCounting, setIsCounting] = useState(false);

  // ── Open/close sections ────────────────────────────────────────────────────
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    price: true,
    color: Boolean(searchParams.get("color")),
    memory: Boolean(searchParams.get("memory")),
    status: Boolean(searchParams.get("status")),
  });
  const [collapsedRootCategories, setCollapsedRootCategories] = useState<Record<number, boolean>>({});

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleRootCategory = (id: number) =>
    setCollapsedRootCategories((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleValue = (arr: string[], setArr: (v: string[]) => void, value: string) =>
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

  // ─── Debounced Count Logic ────────────────────────────────────────────────
  useEffect(() => {
    const updateCount = async () => {
      setIsCounting(true);
      const res = await getFilteredProductsCountAction({
        category: currentCategory,
        priceMin,
        priceMax,
        colors,
        memories,
        statuses,
      });
      if (res.success && typeof res.count === 'number') {
        setLiveCount(res.count);
      }
      setIsCounting(false);
    };

    const timer = setTimeout(updateCount, 600);
    return () => clearTimeout(timer);
  }, [currentCategory, priceMin, priceMax, colors, memories, statuses]);

  const hasActiveFilters =
    priceMin > 0 ||
    priceMax < MAX_PRICE ||
    colors.length > 0 ||
    memories.length > 0 ||
    statuses.length > 0;

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (!v) next.delete(k);
        else next.set(k, v);
      });
      return next.toString();
    },
    [searchParams]
  );

  const handleApply = () => {
    const params: Record<string, string | null> = {
      priceMin: priceMin > 0 ? String(priceMin) : null,
      priceMax: priceMax < MAX_PRICE ? String(priceMax) : null,
      color: colors.length ? colors.join(",") : null,
      memory: memories.length ? memories.join(",") : null,
      status: statuses.length ? statuses.join(",") : null,
    };
    router.push(`${pathname}?${createQueryString(params)}`);
  };

  const handleClear = () => {
    setPriceMin(0);
    setPriceMax(MAX_PRICE);
    setColors([]);
    setMemories([]);
    setStatuses([]);
    router.push(pathname);
  };

  // ─── Recursive Category Tree component ───
  const CategoryItem = ({ item, depth = 0 }: { item: Category; depth?: number }) => {
    const isActive = currentCategory === item.slug;
    const hasChildren = item.children && item.children.length > 0;
    const isRoot = depth === 0;
    const isCollapsed = isRoot && !!collapsedRootCategories[item.id];
    
    return (
      <div className="space-y-1">
        <div
          className={cn(
            "text-[13px] lg:text-[15px] font-bold transition-all w-full text-left py-2 px-3 rounded-xl flex items-center justify-between group/cat",
            isActive
              ? "text-primary bg-primary/5 shadow-sm shadow-primary/5"
              : "text-neutral-400 hover:text-secondary hover:bg-neutral-50"
          )}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          <button
            onClick={() => router.push(`/catalog/${item.slug}`)}
            className="flex-1 text-left"
          >
            <span>{item.name}</span>
          </button>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isRoot) toggleRootCategory(item.id);
              }}
              className="w-6 h-6 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors"
              aria-label={isCollapsed ? "Развернуть категорию" : "Свернуть категорию"}
            >
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform",
                  isRoot && isCollapsed ? "-rotate-90" : "rotate-0"
                )}
              />
            </button>
          )}
        </div>
        {hasChildren && !isCollapsed && (
          <div className="mt-1">
            {item.children?.map(child => (
              <CategoryItem key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-[32px] border border-neutral-100 p-6 shadow-sm sticky top-[132px]">
      {/* ── Категории ── */}
      <FilterSection
        title="Категория"
        id="category"
        isOpen={openSections.category}
        onToggle={() => toggleSection("category")}
      >
        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {categoryTree.map((item) => (
            <CategoryItem key={item.id} item={item} />
          ))}
        </div>
      </FilterSection>

      {/* ── Цена ── */}
      <FilterSection
        title="Цена"
        id="price"
        isOpen={openSections.price}
        onToggle={() => toggleSection("price")}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                placeholder="0"
                value={priceMinInput}
                onChange={(e) => setPriceMinInput(e.target.value)}
                onBlur={() => {
                  const v = Math.max(0, Math.min(Number(priceMinInput) || 0, priceMax - 1));
                  setPriceMin(v);
                  setPriceMinInput(v === 0 ? "" : String(v));
                }}
                className="w-full pl-4 pr-7 py-3 bg-neutral-50 border border-neutral-100 focus:border-primary/30 focus:bg-white rounded-2xl text-[13px] font-black transition-all placeholder:text-neutral-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-300 font-bold pointer-events-none">₽</span>
            </div>
            <span className="text-neutral-200 font-bold text-sm">—</span>
            <div className="flex-1 relative">
              <input
                type="number"
                placeholder={MAX_PRICE.toLocaleString("ru-RU")}
                value={priceMaxInput}
                onChange={(e) => setPriceMaxInput(e.target.value)}
                onBlur={() => {
                  const raw = Number(priceMaxInput);
                  const v = priceMaxInput === "" ? MAX_PRICE : Math.min(MAX_PRICE, Math.max(raw, priceMin + 1));
                  setPriceMax(v);
                  setPriceMaxInput(v === MAX_PRICE ? "" : String(v));
                }}
                className="w-full pl-4 pr-7 py-3 bg-neutral-50 border border-neutral-100 focus:border-primary/30 focus:bg-white rounded-2xl text-[13px] font-black transition-all placeholder:text-neutral-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-300 font-bold pointer-events-none">₽</span>
            </div>
          </div>
          <PriceRangeSlider
            min={0}
            max={MAX_PRICE}
            valueMin={priceMin}
            valueMax={priceMax}
            onChangeMin={(v) => { setPriceMin(v); setPriceMinInput(v === 0 ? "" : String(v)); }}
            onChangeMax={(v) => { setPriceMax(v); setPriceMaxInput(v === MAX_PRICE ? "" : String(v)); }}
          />
        </div>
      </FilterSection>

      {availableMemories.length > 0 && (
        <FilterSection
          title="Память MicroSD"
          id="memory"
          isOpen={openSections.memory ?? false}
          onToggle={() => toggleSection("memory")}
        >
          {availableMemories.map((memoryValue) => (
            <CheckboxOption
              key={memoryValue}
              label={memoryValue}
              checked={memories.includes(memoryValue)}
              onChange={() => toggleValue(memories, setMemories, memoryValue)}
            />
          ))}
        </FilterSection>
      )}

      {/* ── Цвет ── */}
      {availableColors.length > 0 && (
        <FilterSection
          title="Цвет"
          id="color"
          isOpen={openSections.color}
          onToggle={() => toggleSection("color")}
        >
          <ColorScrollRow
            availableColors={availableColors}
            selectedColors={colors}
            onToggle={(name) => toggleValue(colors, setColors, name)}
          />
        </FilterSection>
      )}

      {/* ── Статус ── */}
      <FilterSection
        title="Статус товара"
        id="status"
        isOpen={openSections.status}
        onToggle={() => toggleSection("status")}
      >
        {STATUS_OPTIONS.map(({ label, value }) => (
          <CheckboxOption
            key={value}
            label={label}
            checked={statuses.includes(value)}
            onChange={() => toggleValue(statuses, setStatuses, value)}
          />
        ))}
      </FilterSection>

      {/* ── Кнопки ── */}
      <div className="pt-6 space-y-3">
        <button
          onClick={handleApply}
          disabled={isCounting && liveCount === 0}
          className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-red-700 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm uppercase tracking-wide flex items-center justify-center gap-2"
        >
          {isCounting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : null}
          Показать {liveCount} {liveCount === 1 ? 'товар' : liveCount > 1 && liveCount < 5 ? 'товара' : 'товаров'}
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="w-full py-4 bg-neutral-50 text-neutral-400 font-bold rounded-2xl hover:bg-neutral-100 hover:text-secondary transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <X size={15} />
            Очистить фильтры
          </button>
        )}
      </div>
    </div>
  );
};
