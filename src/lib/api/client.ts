import { useAuthStore } from "@/stores/auth-store";

import type { ApiError, ApiResponse } from "./types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

function getApiBaseUrl() {
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return apiBaseUrl.replace(/\/$/, "");
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const { body, auth = true, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type") && body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload || payload.success === false) {
    throw {
      message:
        payload && "error" in payload
          ? payload.error
          : `Request failed with status ${response.status}`,
      status: response.status,
    } satisfies ApiError;
  }

  return payload.data;
}
