import { create } from "zustand";

type ShopState = {
  activeShopId: string | null;
  activeShopName: string | null;
  setActiveShop: (shop: { id: string; name: string } | null) => void;
};

export const useShopStore = create<ShopState>((set) => ({
  activeShopId: null,
  activeShopName: null,
  setActiveShop: (shop) =>
    set({
      activeShopId: shop?.id ?? null,
      activeShopName: shop?.name ?? null,
    }),
}));
