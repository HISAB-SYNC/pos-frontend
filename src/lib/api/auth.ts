import { isMockApiEnabled } from "@/config/env";
import * as mockAuth from "@/lib/mock/auth.mock";

import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { User } from "./types";

type LoginResult = {
  user: User;
  token: string;
};

type MessageResult = {
  message: string;
};

type VerifyOtpResult = {
  resetToken: string;
  message: string;
};

export async function login(email: string, password: string) {
  if (isMockApiEnabled()) {
    return mockAuth.mockLogin(email, password);
  }

  return apiRequest<LoginResult>(API_ENDPOINTS.auth.login, {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export async function logout() {
  if (isMockApiEnabled()) {
    return { message: "Logged out successfully" };
  }

  try {
    return await apiRequest<MessageResult>(API_ENDPOINTS.auth.logout, {
      method: "POST",
      auth: false,
    });
  } catch {
    return { message: "Logged out successfully" };
  }
}

export async function registerOwner(input: { email: string; password: string; name: string }) {
  if (isMockApiEnabled()) {
    return mockAuth.mockRegisterOwner(input);
  }

  return apiRequest<User>(API_ENDPOINTS.auth.registerOwner, {
    method: "POST",
    body: input,
    auth: false,
  });
}

export async function registerStaff(input: {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "SALES";
  shopId: string;
}) {
  if (isMockApiEnabled()) {
    return mockAuth.mockRegisterStaff(input);
  }

  return apiRequest<User>(API_ENDPOINTS.auth.registerStaff, {
    method: "POST",
    body: input,
  });
}

export async function requestPasswordReset(email: string) {
  if (isMockApiEnabled()) {
    return mockAuth.mockRequestPasswordReset(email);
  }

  return apiRequest<MessageResult>(API_ENDPOINTS.auth.requestResetPassword, {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export async function verifyPasswordResetOtp(input: { email: string; otp: string }) {
  if (isMockApiEnabled()) {
    return {
      resetToken: "mock-reset-token",
      message: "OTP verified successfully",
    } as VerifyOtpResult;
  }

  return apiRequest<VerifyOtpResult>(API_ENDPOINTS.auth.verifyResetPassword, {
    method: "POST",
    body: input,
    auth: false,
  });
}

export async function confirmPasswordReset(input: { resetToken: string; newPassword: string }) {
  if (isMockApiEnabled()) {
    return { message: "Password has been reset successfully" } as MessageResult;
  }

  return apiRequest<MessageResult>(API_ENDPOINTS.auth.confirmResetPassword, {
    method: "POST",
    body: input,
    auth: false,
  });
}

export async function resetPassword(input: { email?: string; token?: string; resetToken?: string; newPassword: string }) {
  return confirmPasswordReset({
    resetToken: input.resetToken || input.token || "",
    newPassword: input.newPassword,
  });
}

