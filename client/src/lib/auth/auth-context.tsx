"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  login as loginApi,
  register as registerApi,
  getProfile,
} from "@/lib/api/auth";
import { setTokenProvider, setOnUnauthorized } from "@/lib/api/client";
import {
  setTokens,
  getAccessToken,
  clearTokens,
} from "@/lib/auth-storage";
import type { UserResponse } from "@/lib/api/types";

// ─── Context types ───────────────────────────────────────────────────────────

export interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    filiation: string,
  ) => Promise<void>;
  logout: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const performLogout = useCallback(() => {
    clearTokens();
    setTokenProvider(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    setTokenProvider(() => getAccessToken());
    setOnUnauthorized(() => performLogout());

    const hydrate = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const profile = await getProfile();
          setUser(profile);
        } catch {
          clearTokens();
        }
      }
      setIsLoading(false);
    };

    hydrate();
  }, [performLogout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginApi({ email, password });
      setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
    },
    [],
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      filiation: string,
    ) => {
      const response = await registerApi({
        name,
        email,
        password,
        filiation: filiation as "PIRATE" | "MARINE",
      });
      setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
    },
    [],
  );

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, login, register, logout: performLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
