// src/context/AuthModalContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type User = {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
};

export type AuthContextValue = {
  isOpen: boolean;
  visible: boolean; // alias
  openLogin: () => void;
  closeLogin: () => void;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  user: User | null;
  setUser: (u: User | null) => void;
};

const AuthModalContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = "gita:auth";

export const AuthModalProvider: React.FC<{ children: React.ReactNode; anchorTop?: number }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // load persisted user
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { user: User; token?: string };
          setUser(parsed.user ?? null);
          // TODO: restore token in secure store if used
        }
      } catch (e) {
        console.warn("Auth load error", e);
      }
    })();
  }, []);

  const openLogin = () => setIsOpen(true);
  const closeLogin = () => setIsOpen(false);

  const login = async (token: string, userPayload: User) => {
    // Save token securely (placeholder using AsyncStorage; consider SecureStore)
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user: userPayload }));
      setUser(userPayload);
      setIsOpen(false);
    } catch (e) {
      console.warn("Auth save error", e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    } catch (e) {
      console.warn("Auth logout error", e);
    }
  };

  const value: AuthContextValue = {
    isOpen,
    visible: isOpen,
    openLogin,
    closeLogin,
    login,
    logout,
    user,
    setUser,
  };

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuth must be used within AuthModalProvider");
  return ctx;
};