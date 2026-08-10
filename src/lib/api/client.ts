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
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as Partial<ApiError> | null;

    throw {
      message: errorBody?.message ?? "Request failed",
      status: response.status,
      details: errorBody?.details,
    } satisfies ApiError;
  }

  return (await response.json()) as ApiResponse<T>;
}
