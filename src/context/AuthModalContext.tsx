// src/context/AuthModalContext.tsx
import authApi, { AuthCredentials, LoginResult } from "app/utils/authApi";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

/**
 * AuthModal context API expected by components/AuthModal.tsx and AppHeader.
 */
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

  /**
   * login - calls authApi.login, persists token on success, sets user, closes modal
   */
  const login = useCallback(async (creds: AuthCredentials) => {
    setLoading(true);
    try {
      const res: LoginResult = await authApi.login(creds);

      if (!res.success) {
        return { success: false, error: res.error ?? "Login failed" };
      }

      // persist token if available
      if (res.token) {
        try {
          await authApi.setAuthToken(res.token);
        } catch (e) {
          // non-fatal: log and continue
          console.warn("[AuthModal] setAuthToken failed", e);
        }
      }

      setUser(res.user ?? null);
      setOpen(false); // close modal on success
      return { success: true, user: res.user };
    } catch (err: any) {
      console.error("[AuthModal] login error", err);
      return { success: false, error: err?.message ?? "Unknown error" };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * signup - calls authApi.signup, persists token on success, sets user, closes modal
   */
  const signup = useCallback(async (creds: AuthCredentials) => {
    setLoading(true);
    try {
      const res: LoginResult = await authApi.signup(creds);

      if (!res.success) {
        return { success: false, error: res.error ?? "Signup failed" };
      }

      if (res.token) {
        try {
          await authApi.setAuthToken(res.token);
        } catch (e) {
          console.warn("[AuthModal] setAuthToken failed", e);
        }
      }

      setUser(res.user ?? null);
      setOpen(false);
      return { success: true, user: res.user };
    } catch (err: any) {
      console.error("[AuthModal] signup error", err);
      return { success: false, error: err?.message ?? "Unknown error" };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * forgotPassword - calls authApi.forgotPassword
   */
  const forgotPassword = useCallback(async (identifier: string) => {
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(identifier);
      return { success: res.success, error: res.error };
    } catch (err: any) {
      console.error("[AuthModal] forgotPassword error", err);
      return { success: false, error: err?.message ?? "Unknown error" };
    } finally {
      setLoading(false);
    }
  }, []);

  const openLogin = () => {
    setOpen(true);
    // If your modal has multiple modes (login/signup) you can set a mode state here.
  };

  const openSignup = () => {
    setOpen(true);
  };

  const logout = useCallback(async () => {
    try {
      await authApi.clearAuthToken();
    } catch (e) {
      console.warn("[AuthModal] clearAuthToken failed", e);
    }
    setUser(null);
    console.log("[AuthModal] logged out");
  }, []);

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

export default AuthModalContext;