import type { Area } from "./types";

// Keys for this area start with "suppliers." (example: "suppliers.title").
const en = {} as const;

export const suppliers: Area<typeof en> = {
  en,
  am: {},
  om: {},
};
