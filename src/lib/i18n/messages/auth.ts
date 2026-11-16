import type { Area } from "./types";

// Keys for this area start with "auth." (example: "auth.title").
const en = {} as const;

export const auth: Area<typeof en> = {
  en,
  am: {},
  om: {},
};
