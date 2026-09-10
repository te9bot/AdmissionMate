"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { TokenPair, User } from "@/lib/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  requestOtp: (email: string) => Promise<{ dev_code: string | null }>;
  verifyOtp: (email: string, code: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  setPassword: (password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "admissionmate-admin.auth";
const NOT_ADMIN_MESSAGE = "This account does not have admin access.";

interface StoredAuth {
  user: User;
  accessToken: string;
  refreshToken: string;
}

function loadStored(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

function saveStored(data: StoredAuth | null) {
  if (typeof window === "undefined") return;
  if (data) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  else window.localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, accessToken: null, loading: true });

  useEffect(() => {
    const stored = loadStored();
    setState({ user: stored?.user ?? null, accessToken: stored?.accessToken ?? null, loading: false });
  }, []);

  const requestOtp = useCallback(async (email: string) => {
    return api.post<{ message: string; dev_code: string | null }>("/auth/request-otp", { email });
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    const result = await api.post<TokenPair>("/auth/verify-otp", { email, code });
    if (result.user.role !== "admin") {
      throw new ApiError(403, NOT_ADMIN_MESSAGE);
    }
    saveStored({ user: result.user, accessToken: result.access_token, refreshToken: result.refresh_token });
    setState({ user: result.user, accessToken: result.access_token, loading: false });
    return result.user;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<TokenPair>("/auth/login", { email, password });
    if (result.user.role !== "admin") {
      throw new ApiError(403, NOT_ADMIN_MESSAGE);
    }
    saveStored({ user: result.user, accessToken: result.access_token, refreshToken: result.refresh_token });
    setState({ user: result.user, accessToken: result.access_token, loading: false });
    return result.user;
  }, []);

  const setPassword = useCallback(async (password: string) => {
    const stored = loadStored();
    if (!stored) throw new Error("Not authenticated");
    const updatedUser = await api.post<User>("/auth/set-password", { password }, stored.accessToken);
    saveStored({ ...stored, user: updatedUser });
    setState((prev) => ({ ...prev, user: updatedUser }));
    return updatedUser;
  }, []);

  const logout = useCallback(() => {
    saveStored(null);
    setState({ user: null, accessToken: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, requestOtp, verifyOtp, login, setPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
