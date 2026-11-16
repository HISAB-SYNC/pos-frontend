import type { Area } from "./types";

// Keys for this area start with "expenses." (example: "expenses.title").
const en = {} as const;

export const expenses: Area<typeof en> = {
  en,
  am: {},
  om: {},
};
