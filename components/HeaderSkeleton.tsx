// Static skeleton rendered server-side while Header JS loads.
// Matches Header dimensions exactly to prevent CLS.
export function HeaderSkeleton() {
  return (
    <header className="relative z-40 px-3 pt-3" aria-hidden="true">
      <div className="flex items-center justify-between h-12 px-2 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="w-[18px] h-[18px] rounded-full border-[4.5px] border-black" />
          <span className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.01em] text-black">Switch OLED</span>
        </div>
        <div className="h-4 w-24 rounded bg-neutral-100" />
      </div>
    </header>
  );
}
