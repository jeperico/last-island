import { apiGet, apiPost } from "./client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from "./types";

export function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/register", data, { skipAuth: true });
}

export function login(data: LoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/login", data, { skipAuth: true });
}

export function refresh(): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/refresh", undefined, { skipAuth: true });
}

export function logout(): Promise<void> {
  return apiPost<void>("/api/auth/logout");
}

export function getProfile(): Promise<UserResponse> {
  return apiGet<UserResponse>("/api/auth/me");
}
