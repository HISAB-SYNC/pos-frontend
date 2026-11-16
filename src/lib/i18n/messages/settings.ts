import type { Area } from "./types";

// Keys for this area start with "settings." (example: "settings.title").
const en = {} as const;

export const settings: Area<typeof en> = {
  en,
  am: {},
  om: {},
};
