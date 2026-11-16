import type { Area } from "./types";

// Keys for this area start with "inventory." (example: "inventory.title").
const en = {} as const;

export const inventory: Area<typeof en> = {
  en,
  am: {},
  om: {},
};
