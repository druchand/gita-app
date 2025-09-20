// app/context/AuthModalContext.tsx
import React, { createContext, ReactNode, useCallback, useContext, useState } from "react";

/**
 * AuthModal context API expected by your components/AuthModal.tsx
 *
 * Fields included to match usage:
 *  - open: boolean
 *  - setOpen: (b: boolean) => void
 *  - loading: boolean
 *  - login: async function accepting { identifier, password } and resolving on success
 *  - signup, forgotPassword: simple stubs for future wiring
 *  - openLogin/openSignup helpers
 *  - user, setUser placeholders
 */

export type AuthCredentials = {
  identifier: string; // email or phone
  password?: string;
};

export type AuthModalCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  loading: boolean;
  user: any | null;
  login: (creds: AuthCredentials) => Promise<{ success: boolean; user?: any; error?: string }>;
  signup: (creds: AuthCredentials) => Promise<{ success: boolean; user?: any; error?: string }>;
  forgotPassword: (identifier: string) => Promise<{ success: boolean; error?: string }>;
  openLogin: () => void;
  openSignup: () => void;
  logout: () => void;
};

const AuthModalContext = createContext<AuthModalCtx | null>(null);

export const useAuthModal = (): AuthModalCtx => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used inside AuthModalProvider");
  return ctx;
};

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);

  // Example login implementation - replace with real backend call
  const login = useCallback(
    async (creds: AuthCredentials) => {
      console.log("[AuthModal] login()", creds);
      setLoading(true);
      try {
        // TODO: replace with real fetch to your Wix backend
        // Example:
        // const res = await fetch("/.netlify/functions/login", { method: "POST", body: JSON.stringify(creds) })
        await new Promise((r) => setTimeout(r, 900)); // simulate delay

        // fake success object
        const fakeUser = { id: "u123", name: "Demo User", identifier: creds.identifier };

        setUser(fakeUser);
        setOpen(false); // close modal on success
        return { success: true, user: fakeUser };
      } catch (err: any) {
        console.error("[AuthModal] login error", err);
        return { success: false, error: err?.message ?? "Unknown error" };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signup = useCallback(async (creds: AuthCredentials) => {
    console.log("[AuthModal] signup()", creds);
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      const fakeUser = { id: "u_new", name: creds.identifier };
      setUser(fakeUser);
      setOpen(false);
      return { success: true, user: fakeUser };
    } catch (err: any) {
      return { success: false, error: err?.message ?? "Unknown error" };
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (identifier: string) => {
    console.log("[AuthModal] forgotPassword()", identifier);
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message ?? "Unknown error" };
    } finally {
      setLoading(false);
    }
  }, []);

  const openLogin = () => {
    setOpen(true);
    // you can also set a "mode" state if your modal component needs to know which sub-form to show
  };

  const openSignup = () => {
    setOpen(true);
  };

  const logout = () => {
    setUser(null);
    console.log("[AuthModal] logged out");
  };

  const value: AuthModalCtx = {
    open,
    setOpen,
    loading,
    user,
    login,
    signup,
    forgotPassword,
    openLogin,
    openSignup,
    logout,
  };

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}