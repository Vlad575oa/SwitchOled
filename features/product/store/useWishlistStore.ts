import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  ids: number[];
  synced: boolean;
  add: (id: number) => void;
  remove: (id: number) => void;
  toggle: (id: number) => void;
  has: (id: number) => boolean;
  clear: () => void;
  count: () => number;
  syncWithAccount: () => Promise<void>;
}

const postWishlist = async (payload: { productId?: number; ids?: number[] }) => {
  await fetch("/api/account/wishlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
};

const deleteWishlist = async (payload: { productId?: number; all?: boolean }) => {
  await fetch("/api/account/wishlist", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      synced: false,
      add: (id) => {
        set((s) => ({ ids: s.ids.includes(id) ? s.ids : [...s.ids, id] }));
        void postWishlist({ productId: id });
      },
      remove: (id) => {
        set((s) => ({ ids: s.ids.filter((i) => i !== id) }));
        void deleteWishlist({ productId: id });
      },
      toggle: (id) => {
        const { ids } = get();
        if (ids.includes(id)) {
          set({ ids: ids.filter((i) => i !== id) });
          void deleteWishlist({ productId: id });
        } else {
          set({ ids: [...ids, id] });
          void postWishlist({ productId: id });
        }
      },
      has: (id) => get().ids.includes(id),
      clear: () => {
        set({ ids: [], synced: false });
        void deleteWishlist({ all: true });
      },
      count: () => get().ids.length,
      syncWithAccount: async () => {
        const localIds = get().ids;
        const res = await fetch("/api/account/wishlist").catch(() => null);
        if (!res || !res.ok) return;
        const data = await res.json().catch(() => ({ ids: [] as number[] }));
        const accountIds = Array.isArray(data?.ids) ? data.ids.filter((n: unknown) => Number.isInteger(n)) : [];

        const localOnly = localIds.filter((id) => !accountIds.includes(id));
        if (localOnly.length > 0) {
          await postWishlist({ ids: localOnly });
        }

        const merged = Array.from(new Set([...localIds, ...accountIds]));
        set({ ids: merged, synced: true });
      },
    }),
    { name: "nintendo-wishlist" }
  )
);
