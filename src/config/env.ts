export function isMockApiEnabled() {
  return process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
}

export const DEMO_CREDENTIALS = {
  superadmin: { email: "superadmin@example.com", password: "password123", role: "SUPER_ADMIN" },
  owner: { email: "owner@example.com", password: "password123", role: "OWNER" },
  admin: { email: "admin@example.com", password: "password123", role: "ADMIN" },
  sales: { email: "sales@example.com", password: "password123", role: "SALES" },
} as const;


export const DEMO_OTP = "123456";
