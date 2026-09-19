import { create } from "zustand";
import { persist } from "zustand/middleware";

type ShopState = {
  activeShopId: string | null;
  activeShopName: string | null;
  setActiveShop: (shop: { id: string; name: string } | null) => void;
};

export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      activeShopId: null,
      activeShopName: null,
      setActiveShop: (shop) =>
        set({
          activeShopId: shop?.id ?? null,
          activeShopName: shop?.name ?? null,
        }),
    }),
    {
      name: "andalus-shop",
    },
  ),
);
