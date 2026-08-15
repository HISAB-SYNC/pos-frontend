export function isMockApiEnabled() {
  return process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
}

export const DEMO_CREDENTIALS = {
  owner: { email: "owner@demo.com", password: "demo1234", role: "OWNER" },
  admin: { email: "admin@demo.com", password: "demo1234", role: "ADMIN" },
  sales: { email: "sales@demo.com", password: "demo1234", role: "SALES" },
} as const;

export const DEMO_OTP = "123456";
