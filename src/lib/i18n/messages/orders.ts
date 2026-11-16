import type { Area } from "./types";

// Keys for this area start with "orders." (example: "orders.title").
const en = {} as const;

export const orders: Area<typeof en> = {
  en,
  am: {},
  om: {},
};
