// Static skeleton rendered server-side while Header JS loads.
// Matches Header dimensions exactly to prevent CLS.
export function HeaderSkeleton() {
  return (
    <header
      className="sticky top-10 z-50 h-[76px] xl:h-[88px] flex items-center bg-[#2c2c30] border-b border-white/[0.07]"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
      aria-hidden="true"
    >
      <div className="w-full max-w-[1920px] mx-auto px-4 lg:pl-6 lg:pr-4 2xl:pl-4 2xl:pr-4 flex items-center gap-2 xl:gap-6">
        {/* Logo placeholder */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 xl:w-11 xl:h-11 bg-primary rounded-xl opacity-80" />
          <div className="hidden lg:flex flex-col gap-1">
            <div className="h-2 w-20 bg-white/10 rounded" />
            <div className="h-4 w-28 bg-white/20 rounded" />
          </div>
        </div>

        {/* Catalog button placeholder */}
        <div className="hidden lg:block h-10 xl:h-12 w-32 bg-white/[0.06] border border-white/[0.08] rounded-xl shrink-0" />

        {/* Search placeholder */}
        <div className="flex-1 min-w-[150px] max-w-2xl h-10 bg-white/[0.06] rounded-xl" />

        {/* Icons placeholder */}
        <div className="flex items-center gap-5 lg:gap-6 shrink-0 ml-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[68px] xl:w-[76px] h-[52px] xl:h-[58px] rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
    </header>
  );
}
