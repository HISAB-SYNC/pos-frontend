/**
 * Shop API. Each area lives in its own module; this file re-exports them so
 * existing imports from "@/lib/api/app-data" keep working.
 */
export * from "./customers";
export * from "./local-cache";
export * from "./debts";
export * from "./sales";
export * from "./expenses";
export * from "./dashboard";
export * from "./analytics";
export * from "./profile";
export * from "./orders";
export * from "./team";
export * from "./notifications";
export * from "./funds";

export type {
  DashboardMetrics,
  ReportMetrics,
} from "@/lib/mock/data";
