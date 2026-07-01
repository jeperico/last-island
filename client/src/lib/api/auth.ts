import { apiGet, apiPost } from "./client";
import type {
  AuthResponse,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  UserResponse,
} from "./types";

export function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/register", data);
}

export function login(data: LoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/login", data);
}

export function refresh(data: RefreshRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/refresh", data);
}

export function getProfile(): Promise<UserResponse> {
  return apiGet<UserResponse>("/api/auth/me");
}
