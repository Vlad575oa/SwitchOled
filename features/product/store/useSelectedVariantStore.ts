import { create } from "zustand";

interface SelectedVariantState {
  images: string[] | null;
  setImages: (images: string[]) => void;
  reset: () => void;
}

export const useSelectedVariantStore = create<SelectedVariantState>((set) => ({
  images: null,
  setImages: (images) => set({ images }),
  reset: () => set({ images: null }),
}));
