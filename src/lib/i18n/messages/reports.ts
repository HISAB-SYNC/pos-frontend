import type { Area } from "./types";

// Keys for this area start with "reports." (example: "reports.title").
const en = {} as const;

export const reports: Area<typeof en> = {
  en,
  am: {},
  om: {},
};
