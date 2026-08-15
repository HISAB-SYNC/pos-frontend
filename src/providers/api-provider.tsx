"use client";

import { createContext, useContext, useMemo } from "react";

import { DEMO_CREDENTIALS, DEMO_OTP, isMockApiEnabled } from "@/config/env";

type DemoUser = {
  email: string;
  password: string;
  role: string;
};

type ApiContextValue = {
  isMockMode: boolean;
  demoUsers: DemoUser[];
  demoOtp: string;
};

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<ApiContextValue>(
    () => ({
      isMockMode: isMockApiEnabled(),
      demoUsers: Object.values(DEMO_CREDENTIALS),
      demoOtp: DEMO_OTP,
    }),
    [],
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const context = useContext(ApiContext);

  if (!context) {
    throw new Error("useApi must be used within ApiProvider");
  }

  return context;
}
