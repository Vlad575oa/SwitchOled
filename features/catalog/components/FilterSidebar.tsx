"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { ChevronDown, Loader2, Check } from "lucide-react";
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

const FilterSection = ({ title, children }: FilterSectionProps) => (
  <div className="py-5 border-b border-black/[0.07] last:border-0">
    <h3 className="text-[16px] font-semibold text-black mb-3">{title}</h3>
    {children}
  </div>
);

interface CheckItem {
  value: string;
  label: string;
  colorHex?: string;
}

const VISIBLE_LIMIT = 5;

// Soft square checkboxes; long lists collapse behind «Посмотреть все».
const CheckList = ({
  items,
  selected,
  onToggle,
}: {
  items: CheckItem[];
  selected: string[];
  onToggle: (value: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, VISIBLE_LIMIT);
  return (
    <div>
      <ul className="space-y-1">
        {shown.map((item) => {
          const checked = selected.includes(item.value);
          return (
            <li key={item.value}>
              <label className="flex items-center gap-3 py-1.5 cursor-pointer group">
                <input type="checkbox" className="sr-only" checked={checked} onChange={() => onToggle(item.value)} />
                <span
                  className={cn(
                    "w-6 h-6 shrink-0 rounded-md border flex items-center justify-center transition-colors",
                    checked ? "bg-black border-black" : "bg-[#f4f6fa] border-[#dfe3ea] group-hover:border-black/30"
                  )}
                  aria-hidden
                >
                  {checked && <Check size={15} strokeWidth={2.5} className="text-white" />}
                </span>
                {item.colorHex && (
                  <span className="w-4 h-4 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: item.colorHex }} />
                )}
                <span className="text-[15px] text-black">{item.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {items.length > VISIBLE_LIMIT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[15px] font-medium text-black underline underline-offset-4 decoration-black/30 hover:decoration-black"
        >
          {expanded ? "Свернуть" : "Посмотреть все"}
        </button>
      )}
    </div>
  );
};

const memoryLabel = (value: string) => (/^0\s*ГБ$/i.test(value.trim()) ? "Без карты памяти" : `Карта ${value}`);

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
  availableGames?: string[];
  onApply?: () => void;
  inDrawer?: boolean;
}

export const FilterSidebar = ({
  currentCategory,
  totalCount,
  categoryTree,
  availableColors,
  availableMemories,
  availableGames = [],
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
  const [games, setGames] = useState<string[]>(
    searchParams.get("games")?.split(",").filter(Boolean) ?? []
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
        games,
        statuses,
      });
      if (res.success && typeof res.count === 'number') {
        setLiveCount(res.count);
      }
      setIsCounting(false);
    };

    const timer = setTimeout(updateCount, 600);
    return () => clearTimeout(timer);
  }, [currentCategory, priceMin, priceMax, colors, memories, games, statuses]);

  const hasActiveFilters =
    priceMin > 0 ||
    priceMax < MAX_PRICE ||
    colors.length > 0 ||
    memories.length > 0 ||
    games.length > 0 ||
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
      games: games.length ? games.join(",") : null,
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
    setGames([]);
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
    (priceMin > 0 || priceMax < MAX_PRICE ? 1 : 0) + colors.length + memories.length + games.length + statuses.length;

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
        <FilterSection title="Память" id="memory" isOpen onToggle={() => {}}>
          <CheckList
            items={availableMemories.map((m) => ({ value: m, label: memoryLabel(m) }))}
            selected={memories}
            onToggle={(v) => toggleValue(memories, setMemories, v)}
          />
        </FilterSection>
      )}

      {availableGames.length > 0 && (
        <FilterSection title="Игр в комплекте" id="games" isOpen onToggle={() => {}}>
          <CheckList
            items={availableGames.map((g) => ({ value: g, label: `${g} игр` }))}
            selected={games}
            onToggle={(v) => toggleValue(games, setGames, v)}
          />
        </FilterSection>
      )}

      {availableColors.length > 0 && (
        <FilterSection title="Цвет" id="color" isOpen onToggle={() => {}}>
          <CheckList
            items={availableColors.map((c) => ({ value: c.name, label: c.name, colorHex: c.hex }))}
            selected={colors}
            onToggle={(v) => toggleValue(colors, setColors, v)}
          />
        </FilterSection>
      )}

      <FilterSection title="Наличие" id="status" isOpen onToggle={() => {}}>
        <CheckList
          items={STATUS_OPTIONS.map(({ label, value }) => ({ value, label }))}
          selected={statuses}
          onToggle={(v) => toggleValue(statuses, setStatuses, v)}
        />
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
