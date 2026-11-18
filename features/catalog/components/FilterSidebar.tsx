"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { ChevronDown, Plus, Loader2 } from "lucide-react";
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

// ─── Sub-components defined OUTSIDE FilterSidebar to prevent remount on state change ──

interface FilterSectionProps {
  title: string;
  id: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const FilterSection = ({ title, children, isOpen, onToggle }: FilterSectionProps) => (
  <div className="border-b border-black/[0.07] last:border-0">
    <button
      onClick={onToggle}
      aria-expanded={isOpen}
      className="flex items-center justify-between w-full py-4 text-left"
    >
      <h3 className="text-[15px] font-medium text-black">{title}</h3>
      <Plus
        size={18}
        strokeWidth={1.5}
        className={cn("text-black transition-transform duration-300", isOpen && "rotate-45")}
      />
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          className="overflow-hidden"
        >
          <div className="pb-5">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  colorHex?: string;
}

// Toggle chip: white when idle, black when selected.
const Chip = ({ label, active, onClick, colorHex }: ChipProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-[14px] border transition-colors",
      active
        ? "bg-black border-black text-white"
        : "bg-white border-black/10 text-black hover:border-black/30"
    )}
  >
    {colorHex && (
      <span
        className={cn("w-3.5 h-3.5 rounded-full border", active ? "border-white/40" : "border-black/10")}
        style={{ backgroundColor: colorHex }}
      />
    )}
    {label}
  </button>
);

const PRICE_PRESETS = [
  { label: "до 30 000", min: 0, max: 30000 },
  { label: "30–40 000", min: 30000, max: 40000 },
  { label: "от 40 000", min: 40000, max: MAX_PRICE },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface FilterSidebarProps {
  currentCategory: string;
  totalCount: number;
  categoryTree: any[];
  availableColors: Array<{ name: string; hex: string }>;
  availableMemories: string[];
  onApply?: () => void;
  inDrawer?: boolean;
}

export const FilterSidebar = ({
  currentCategory,
  totalCount,
  categoryTree,
  availableColors,
  availableMemories,
  onApply,
  inDrawer = false,
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
    color: true,
    memory: true,
    status: true,
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
    onApply?.();
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
      <div>
        <div
          className={cn(
            "text-[14px] transition-colors w-full text-left py-2 pr-1 rounded-lg flex items-center justify-between",
            isActive
              ? "text-black font-semibold"
              : "text-black/60 hover:text-black"
          )}
          style={{ paddingLeft: `${depth * 14}px` }}
        >
          <button
            onClick={() => router.push(`/catalog/${item.slug}`)}
            className="flex-1 text-left"
          >
            <span className="inline-flex items-center gap-2">
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
              {item.name}
            </span>
          </button>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isRoot) toggleRootCategory(item.id);
              }}
              className="w-6 h-6 rounded-full hover:bg-white flex items-center justify-center transition-colors"
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

  const activeCount =
    (priceMin > 0 || priceMax < MAX_PRICE ? 1 : 0) + colors.length + memories.length + statuses.length;

  const plural = (n: number) =>
    n % 10 === 1 && n % 100 !== 11 ? "товар" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "товара" : "товаров";

  const setPrice = (min: number, max: number) => {
    setPriceMin(min);
    setPriceMax(max);
    setPriceMinInput(min === 0 ? "" : String(min));
    setPriceMaxInput(max === MAX_PRICE ? "" : String(max));
  };

  const priceInput =
    "w-full h-11 pl-9 pr-3 bg-white border border-black/10 focus:border-black/40 outline-none rounded-lg text-[14px] transition-colors placeholder:text-black/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className={inDrawer ? "px-3" : "bg-surface-soft rounded-2xl px-5 pt-4 pb-5 lg:sticky lg:top-6"}>
      <div className={cn("flex items-center justify-between pb-2", inDrawer && !hasActiveFilters && "hidden")}>
        <p className={cn("text-[17px] font-semibold text-black", inDrawer && "invisible")}>
          Фильтры
          {activeCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-black text-white text-[11px] align-middle">
              {activeCount}
            </span>
          )}
        </p>
        {hasActiveFilters && (
          <button onClick={handleClear} className="text-[13px] text-black/55 underline underline-offset-4 hover:text-black">
            Сбросить
          </button>
        )}
      </div>

      {/* ── Категории ── */}
      <FilterSection
        title="Категория"
        id="category"
        isOpen={openSections.category}
        onToggle={() => toggleSection("category")}
      >
        <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          <button
            onClick={() => router.push("/catalog/all")}
            className={cn(
              "w-full text-left py-2 text-[14px] transition-colors inline-flex items-center gap-2",
              currentCategory === "all" ? "text-black font-semibold" : "text-black/60 hover:text-black"
            )}
          >
            {currentCategory === "all" && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
            Все товары
          </button>
          {categoryTree.map((item) => (
            <CategoryItem key={item.id} item={item} />
          ))}
        </div>
      </FilterSection>

      {/* ── Цена ── */}
      <FilterSection
        title="Цена, ₽"
        id="price"
        isOpen={openSections.price}
        onToggle={() => toggleSection("price")}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-black/40 pointer-events-none">от</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={priceMinInput}
                onChange={(e) => setPriceMinInput(e.target.value)}
                onBlur={() => {
                  const v = Math.max(0, Math.min(Number(priceMinInput) || 0, priceMax - 1));
                  setPriceMin(v);
                  setPriceMinInput(v === 0 ? "" : String(v));
                }}
                className={priceInput}
              />
            </label>
            <label className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-black/40 pointer-events-none">до</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder={MAX_PRICE.toLocaleString("ru-RU")}
                value={priceMaxInput}
                onChange={(e) => setPriceMaxInput(e.target.value)}
                onBlur={() => {
                  const raw = Number(priceMaxInput);
                  const v = priceMaxInput === "" ? MAX_PRICE : Math.min(MAX_PRICE, Math.max(raw, priceMin + 1));
                  setPriceMax(v);
                  setPriceMaxInput(v === MAX_PRICE ? "" : String(v));
                }}
                className={priceInput}
              />
            </label>
          </div>
          <PriceRangeSlider
            min={0}
            max={MAX_PRICE}
            valueMin={priceMin}
            valueMax={priceMax}
            onChangeMin={(v) => { setPriceMin(v); setPriceMinInput(v === 0 ? "" : String(v)); }}
            onChangeMax={(v) => { setPriceMax(v); setPriceMaxInput(v === MAX_PRICE ? "" : String(v)); }}
          />
          <div className="flex flex-wrap gap-2">
            {PRICE_PRESETS.map((p) => (
              <Chip
                key={p.label}
                label={p.label}
                active={priceMin === p.min && priceMax === p.max}
                onClick={() =>
                  priceMin === p.min && priceMax === p.max ? setPrice(0, MAX_PRICE) : setPrice(p.min, p.max)
                }
              />
            ))}
          </div>
        </div>
      </FilterSection>

      {availableMemories.length > 0 && (
        <FilterSection
          title="Память MicroSD"
          id="memory"
          isOpen={openSections.memory ?? false}
          onToggle={() => toggleSection("memory")}
        >
          <div className="flex flex-wrap gap-2">
            {availableMemories.map((memoryValue) => (
              <Chip
                key={memoryValue}
                label={memoryValue}
                active={memories.includes(memoryValue)}
                onClick={() => toggleValue(memories, setMemories, memoryValue)}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {availableColors.length > 0 && (
        <FilterSection
          title="Цвет"
          id="color"
          isOpen={openSections.color}
          onToggle={() => toggleSection("color")}
        >
          <div className="flex flex-wrap gap-2">
            {availableColors.map((c) => (
              <Chip
                key={c.name}
                label={c.name}
                colorHex={c.hex}
                active={colors.includes(c.name)}
                onClick={() => toggleValue(colors, setColors, c.name)}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* ── Наличие ── */}
      <FilterSection
        title="Наличие"
        id="status"
        isOpen={openSections.status}
        onToggle={() => toggleSection("status")}
      >
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(({ label, value }) => (
            <Chip
              key={value}
              label={label}
              active={statuses.includes(value)}
              onClick={() => toggleValue(statuses, setStatuses, value)}
            />
          ))}
        </div>
      </FilterSection>

      <button
        onClick={handleApply}
        disabled={isCounting && liveCount === 0}
        className="mt-4 w-full h-12 bg-black text-white text-[15px] font-semibold rounded-full hover:bg-[#2b2b2b] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isCounting && <Loader2 className="w-4 h-4 animate-spin" />}
        Показать {liveCount} {plural(liveCount)}
      </button>
    </div>
  );
};
