import { translateBackendText } from "@/lib/i18n/backend-match";
import { messages, type MessageKey } from "@/lib/i18n/messages";
import { useAuthStore } from "@/stores/auth-store";
import { useLanguageStore } from "@/stores/language-store";

import type { ApiError, ApiResponse } from "./types";

/** Translates a known backend message to the current interface language (unknown text is kept). */
function localized(message: string) {
  const language = useLanguageStore.getState().language;
  const dictionary = messages[language] ?? messages.en;
  return translateBackendText(message, (key: MessageKey, vars) => {
    let text = dictionary[key] ?? messages.en[key] ?? key;
    for (const [name, value] of Object.entries(vars ?? {})) text = text.split(`{${name}}`).join(String(value));
    return text;
  });
}

export function getApiBaseUrl() {
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pos:network-offline"));
    }
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
    const extra = (payload ?? {}) as { code?: string; details?: Record<string, unknown> };
    const rawMessage =
      payload && "error" in payload ? payload.error : `Request failed with status ${response.status}`;
    throw {
      message: localized(rawMessage),
      rawMessage,
      status: response.status,
      ...(extra.code ? { code: extra.code } : {}),
      ...(extra.details ? { details: extra.details } : {}),
    } satisfies ApiError;
  }

  return payload.data;
}
