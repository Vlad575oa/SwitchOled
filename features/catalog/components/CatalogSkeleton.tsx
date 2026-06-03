export function CatalogSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="-mx-6 sm:mx-0">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-[3px] sm:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)]"
          >
            <div className="aspect-square bg-[var(--bg-elevated)] animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3.5 bg-[var(--bg-elevated)] rounded animate-pulse" />
              <div className="h-3.5 bg-[var(--bg-elevated)] rounded w-3/4 animate-pulse" />
              <div className="h-5 bg-[var(--bg-elevated)] rounded w-1/2 animate-pulse mt-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
