import { DEMO_OTP } from "@/config/env";

import { createSeedStore, type MockStore } from "./data";

let store: MockStore = createSeedStore();

export function getMockStore() {
  return store;
}

export function resetMockStore() {
  store = createSeedStore();
}

export function mockDelay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function mockError(message: string, status = 400): never {
  throw { message, status };
}

export function getDemoOtp() {
  return DEMO_OTP;
}
