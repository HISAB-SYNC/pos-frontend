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

export async function login(email: string, password: string) {
  return apiRequest<LoginResult>(API_ENDPOINTS.auth.login, {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export async function registerOwner(input: { email: string; password: string; name: string }) {
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
  return apiRequest<User>(API_ENDPOINTS.auth.registerStaff, {
    method: "POST",
    body: input,
  });
}

export async function requestPasswordReset(email: string) {
  return apiRequest<MessageResult>(API_ENDPOINTS.auth.requestResetPassword, {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export async function resetPassword(input: { email: string; token: string; newPassword: string }) {
  return apiRequest<MessageResult>(API_ENDPOINTS.auth.resetPassword, {
    method: "POST",
    body: input,
    auth: false,
  });
}
