
import AuthModal from "@/components/AuthModal";
import authApi from "@/utils/authApi"; // keep your existing auth API wrapper
import React, { createContext, useContext, useEffect, useState } from "react";

export type MeUser = any; // narrow as per your authApi if you have types

export type AuthContextValue = {
  user?: MeUser | null;
  login?: (identifier: string, password: string, securityCode?: string | null) => Promise<any>;
  logout?: () => Promise<void>;
  openLogin: () => void;
  closeLogin: () => void;
  isOpen: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthModalProvider");
  return ctx;
};

export const AuthModalProvider: React.FC<{ children: React.ReactNode; anchorTop?: number }> = ({
  children,
  anchorTop = 0,
}) => {
  const [user, setUser] = useState<MeUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    (globalThis as any).AuthController = {
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    };
    // attempt to get current session user
    (async () => {
      try {
        const r = await authApi.getMe?.("FULL");
        if (r?.success && r.user) setUser(r.user);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      delete (globalThis as any).AuthController;
    };
  }, []);

  const login = async (identifier: string, password: string, securityCode?: string | null) => {
    const result = await authApi.login({ identifier, password, securityCode });
    if (result?.success) {
      const me = await authApi.getMe?.("FULL");
      if (me?.user) setUser(me.user);
      setIsOpen(false);
    }
    return result;
  };

  const logout = async () => {
    try {
      await authApi.postJson?.("/logout");
    } catch (e) {
      // ignore
    }
    setUser(null);
  };

  const openLogin = () => setIsOpen(true);
  const closeLogin = () => setIsOpen(false);

  const value: AuthContextValue = {
    user,
    login,
    logout,
    openLogin,
    closeLogin,
    isOpen,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Render the Auth modal here so it's physically mounted */}
      <AuthModal visible={isOpen} onClose={closeLogin} anchorTop={anchorTop} />
    </AuthContext.Provider>
  );
};

export { AuthModalProvider };
export default AuthModalProvider;