import { DEMO_OTP } from "@/config/env";
import type { User } from "@/lib/api/types";

import { createMockId, getMockStore, mockDelay, mockError } from "./store";

type LoginResult = {
  user: User;
  token: string;
};

type MessageResult = {
  message: string;
};

export async function mockLogin(email: string, password: string): Promise<LoginResult> {
  await mockDelay();

  const store = getMockStore();
  const normalizedEmail = email.trim().toLowerCase();
  const user = store.users.find((entry) => entry.email.toLowerCase() === normalizedEmail);

  if (!user || store.passwords[normalizedEmail] !== password) {
    mockError("Invalid email or password", 401);
  }

  return {
    user,
    token: `mock-token-${user.id}`,
  };
}

export async function mockRegisterOwner(input: {
  email: string;
  password: string;
  name: string;
}): Promise<User> {
  await mockDelay();

  const store = getMockStore();
  const email = input.email.trim().toLowerCase();

  if (store.users.some((entry) => entry.email.toLowerCase() === email)) {
    mockError("A user with this email already exists", 409);
  }

  const now = new Date().toISOString();
  const user: User = {
    id: createMockId("user"),
    email,
    name: input.name,
    role: "OWNER",
    shopId: null,
    createdAt: now,
    updatedAt: now,
  };

  store.users.push(user);
  store.passwords[email] = input.password;

  return user;
}

export async function mockRegisterStaff(input: {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "SALES";
  shopId: string;
}): Promise<User> {
  await mockDelay();

  const store = getMockStore();
  const email = input.email.trim().toLowerCase();

  if (!store.shops.some((shop) => shop.id === input.shopId)) {
    mockError("Shop not found", 404);
  }

  const now = new Date().toISOString();
  const user: User = {
    id: createMockId("user"),
    email,
    name: input.name,
    role: input.role,
    shopId: input.shopId,
    createdAt: now,
    updatedAt: now,
  };

  store.users.push(user);
  store.passwords[email] = input.password;

  return user;
}

export async function mockRequestPasswordReset(email: string): Promise<MessageResult> {
  await mockDelay();

  const store = getMockStore();
  const normalizedEmail = email.trim().toLowerCase();

  store.resetTokens[normalizedEmail] = DEMO_OTP;

  return {
    message: "If that email exists, a password reset token has been generated.",
  };
}

export async function mockResetPassword(input: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<MessageResult> {
  await mockDelay();

  const store = getMockStore();
  const normalizedEmail = input.email.trim().toLowerCase();
  const expectedToken = store.resetTokens[normalizedEmail];

  if (!expectedToken || expectedToken !== input.token) {
    mockError("Invalid or expired reset token", 400);
  }

  store.passwords[normalizedEmail] = input.newPassword;
  delete store.resetTokens[normalizedEmail];

  return { message: "Password has been reset successfully" };
}
