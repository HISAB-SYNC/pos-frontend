import type { Area } from "./types";

// Keys for this area start with "customers." (example: "customers.title").
const en = {} as const;

export const customers: Area<typeof en> = {
  en,
  am: {},
  om: {},
};
