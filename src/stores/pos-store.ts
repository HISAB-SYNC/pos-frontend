import { create } from "zustand";

type PosState = {
  searchTerm: string;
  isCartOpen: boolean;
  setSearchTerm: (value: string) => void;
  setCartOpen: (value: boolean) => void;
};

export const usePosStore = create<PosState>((set) => ({
  searchTerm: "",
  isCartOpen: false,
  setSearchTerm: (value) => set({ searchTerm: value }),
  setCartOpen: (value) => set({ isCartOpen: value }),
}));
