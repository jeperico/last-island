import type { ApiErrorResponse } from "./types";
import { getRefreshToken, setTokens } from "../auth-storage";

// ─── Base URL ────────────────────────────────────────────────────────────────

const BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ─── ApiError class ──────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly status: number;
  public readonly error: string;
  public readonly timestamp: string;
  public readonly isUnauthorized: boolean;

  constructor(response: ApiErrorResponse) {
    super(response.message);
    this.name = "ApiError";
    this.status = response.status;
    this.error = response.error;
    this.timestamp = response.timestamp;
    this.isUnauthorized = response.status === 401;
  }
}

// ─── Token provider ──────────────────────────────────────────────────────────

type TokenProvider = () => string | null;

let tokenProvider: TokenProvider | null = null;

export function setTokenProvider(fn: TokenProvider | null): void {
  tokenProvider = fn;
}

// ─── Unauthorized callback ───────────────────────────────────────────────────

let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorized(fn: () => void): void {
  onUnauthorizedCallback = fn;
}

// ─── Refresh deduplication ───────────────────────────────────────────────────

let refreshPromise: Promise<void> | null = null;

async function attemptRefresh(): Promise<void> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Import refresh dynamically to avoid circular dependency
      const { refresh } = await import("./auth");
      const response = await refresh({ refreshToken });
      setTokens(response.accessToken, response.refreshToken);
    } catch {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      throw new Error("Refresh failed");
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (tokenProvider) {
    const token = tokenProvider();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, BASE_URL);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json();
    throw new ApiError(errorBody);
  }

  return (await response.json()) as T;
}

// ─── Public fetch functions ──────────────────────────────────────────────────

export async function apiGet<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = buildUrl(path, params);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      await attemptRefresh();
      // Retry once with new token
      const retryResponse = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });
      return await handleResponse<T>(retryResponse);
    }
    throw error;
  }
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  const url = buildUrl(path);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      await attemptRefresh();
      // Retry once with new token
      const retryResponse = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      return await handleResponse<T>(retryResponse);
    }
    throw error;
  }
}
