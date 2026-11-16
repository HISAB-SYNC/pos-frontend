import type { Area } from "./types";

// Keys for this area start with "debts." (example: "debts.title").
const en = {} as const;

export const debts: Area<typeof en> = {
  en,
  am: {},
  om: {},
};
