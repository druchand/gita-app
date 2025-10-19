// src/context/AuthModalContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";

type User = {
  id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
};

type AuthModalContextValue = {
  user: User | null | undefined;
  isOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  login: (payload: Partial<User>) => Promise<void>;
  logout: () => void;
  setUser: (u: User | null) => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null | undefined>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openLogin = () => {
    console.debug("[AuthModalContext] openLogin() - prev isOpen:", isOpen);
    try {
      setIsOpen(true);
      console.debug("[AuthModalContext] openLogin() - requested visible: true");
    } catch (err) {
      console.warn("[AuthModalContext] openLogin() error", err);
    }
  };

  const closeLogin = () => {
    console.debug("[AuthModalContext] closeLogin() - prev isOpen:", isOpen);
    try {
      setIsOpen(false);
      console.debug("[AuthModalContext] closeLogin() - requested visible: false");
    } catch (err) {
      console.warn("[AuthModalContext] closeLogin() error", err);
    }
  };

  const login = async (payload: Partial<User>) => {
    // do not log sensitive data like passwords
    console.debug("[AuthModalContext] login() called with", { id: payload.id, email: payload.email, name: payload.name });
    try {
      // simulate/perform auth; this function should be replaced with real API call
      // For now set user and close modal
      setUser({
        id: payload.id ?? "local-temp-id",
        name: payload.name ?? "User",
        email: payload.email ?? undefined,
        avatarUrl: payload.avatarUrl ?? undefined,
      });
      setIsOpen(false);
      console.debug("[AuthModalContext] login() set user and closed modal");
    } catch (err) {
      console.warn("[AuthModalContext] login() error", err);
      throw err;
    }
  };

  const logout = () => {
    console.debug("[AuthModalContext] logout() called - clearing user");
    try {
      setUser(null);
      console.debug("[AuthModalContext] logout() cleared user");
    } catch (err) {
      console.warn("[AuthModalContext] logout() error", err);
    }
  };

  const value = useMemo<AuthModalContextValue>(
    () => ({ user, isOpen, openLogin, closeLogin, login, logout, setUser }),
    [user, isOpen]
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
};

export function useAuth(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuth must be used within AuthModalProvider");
  return ctx;
}