import type { Area } from "./types";

// Keys for this area start with "funds." (example: "funds.title").
const en = {} as const;

export const funds: Area<typeof en> = {
  en,
  am: {},
  om: {},
};
