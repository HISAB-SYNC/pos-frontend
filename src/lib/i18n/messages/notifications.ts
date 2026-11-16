import type { Area } from "./types";

// Keys for this area start with "notifications." (example: "notifications.title").
const en = {} as const;

export const notifications: Area<typeof en> = {
  en,
  am: {},
  om: {},
};
