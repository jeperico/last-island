import type { ApiErrorResponse } from "./types";

// ─── Base URL ────────────────────────────────────────────────────────────────

const BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL ?? "";

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

// ─── Unauthorized callback ───────────────────────────────────────────────────

let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorized(fn: () => void): void {
  onUnauthorizedCallback = fn;
}

// ─── Refresh deduplication ───────────────────────────────────────────────────

let refreshPromise: Promise<void> | null = null;

export async function attemptRefresh(): Promise<void> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      // Import refresh dynamically to avoid circular dependency
      const { refresh } = await import("./auth");
      await refresh();
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
  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
}

function buildUrl(path: string, params?: Record<string, string>): string {
  if (BASE_URL) {
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

  // Relative path (local dev with Next.js rewrites)
  let url = path;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, value);
      }
    }
    const qs = searchParams.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  return url;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorBody: ApiErrorResponse;
    try {
      errorBody = await response.json();
    } catch {
      // Non-JSON error response (e.g. empty 401/403 from Spring Security)
      errorBody = {
        status: response.status,
        error: response.statusText || "Error",
        message: response.statusText || "Request failed",
        timestamp: new Date().toISOString(),
      };
    }
    throw new ApiError(errorBody);
  }

  // 204 No Content — no body to parse
  if (response.status === 204) {
    return undefined as T;
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
      credentials: "include",
    });
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      await attemptRefresh();
      // Retry once with new cookie
      const retryResponse = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
        credentials: "include",
      });
      return await handleResponse<T>(retryResponse);
    }
    throw error;
  }
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: { skipAuth?: boolean },
): Promise<T> {
  const url = buildUrl(path);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return await handleResponse<T>(response);
  } catch (error) {
    if (!options?.skipAuth && error instanceof ApiError && error.isUnauthorized) {
      await attemptRefresh();
      // Retry once with new cookie
      const retryResponse = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      return await handleResponse<T>(retryResponse);
    }
    throw error;
  }
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  const url = buildUrl(path);

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: getHeaders(),
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      await attemptRefresh();
      // Retry once with new cookie
      const retryResponse = await fetch(url, {
        method: "PUT",
        headers: getHeaders(),
        credentials: "include",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      return await handleResponse<T>(retryResponse);
    }
    throw error;
  }
}
