import type { UserResponse } from "./api";

export interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    avatar?: string | null,
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
