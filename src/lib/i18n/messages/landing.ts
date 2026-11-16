import type { Area } from "./types";

// Keys for this area start with "landing." (example: "landing.title").
const en = {} as const;

export const landing: Area<typeof en> = {
  en,
  am: {},
  om: {},
};
