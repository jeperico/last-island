import { apiGet, apiPost } from "./client";
import type {
  AuthResponse,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  UserResponse,
} from "./types";

export function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/register", data, { skipAuth: true });
}

export function login(data: LoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/login", data, { skipAuth: true });
}

export function refresh(data: RefreshRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/refresh", data, { skipAuth: true });
}

export function getProfile(): Promise<UserResponse> {
  return apiGet<UserResponse>("/api/auth/me");
}
