import type { Area } from "./types";

// Keys for this area start with "users." (example: "users.title").
const en = {} as const;

export const users: Area<typeof en> = {
  en,
  am: {},
  om: {},
};
