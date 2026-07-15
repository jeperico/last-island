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
  logout as logoutApi,
  getProfile,
} from "@/lib/api/auth";
import { setOnUnauthorized } from "@/lib/api/client";
import type { UserResponse } from "@/lib/api/types";
import type { AuthContextValue } from "@/interfaces/auth";

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const performLogout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore errors — cookies may already be cleared
    }
    setUser(null);

    // Skip redirect if already on an auth page to prevent flash/loop
    const pathname = window.location.pathname;
    if (pathname !== "/login" && pathname !== "/register") {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    setOnUnauthorized(() => performLogout());

    const hydrate = async () => {
      try {
        const profile = await getProfile();
        setUser(profile);
      } catch {
        // 401 or network error — user is not logged in
        setUser(null);
      }
      setIsLoading(false);
    };

    hydrate();
  }, [performLogout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginApi({ email, password });
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
      avatar?: string | null,
    ) => {
      const response = await registerApi({
        name,
        email,
        password,
        filiation: filiation as "PIRATE" | "MARINE",
        avatar: avatar ?? null,
      });
      setUser(response.user);
    },
    [],
  );

  const refreshUser = useCallback(async () => {
    const profile = await getProfile();
    setUser(profile);
  }, []);

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, login, register, logout: performLogout, refreshUser }}
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
