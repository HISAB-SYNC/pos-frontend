import { useAuthStore } from "@/stores/auth-store";

import type { ApiError, ApiResponse } from "./types";

function getApiBaseUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL || "https://pos-backend-0fzk.onrender.com";
  return url.replace(/\/$/, "");
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

    if (!token && process.env.NEXT_PUBLIC_USE_MOCK_API !== "true") {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      throw {
        message: "Authentication token missing. Please sign in.",
        status: 401,
      } satisfies ApiError;
    }

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...rest,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError: unknown) {
    const errorMsg =
      networkError instanceof Error ? networkError.message : "Network request failed";
    throw {
      message: `Unable to connect to backend: ${errorMsg}. Please check your connection or backend status.`,
      status: 0,
    } satisfies ApiError;
  }

  if (response.status === 401) {
    useAuthStore.getState().clearSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw {
      message: "Authentication token missing or expired. Redirecting to login...",
      status: 401,
    } satisfies ApiError;
  }

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
