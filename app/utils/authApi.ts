// src/utils/authApi.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_BASE = "https://eq21.co.in/_functions";
const BASE =
  (typeof globalThis !== "undefined" && (globalThis as any).AUTH_BASE_URL) ||
  DEFAULT_BASE;

export type AuthCredentials = {
  identifier: string;
  password?: string;
};

export type LoginResult = {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
};

const AUTH_TOKEN_KEY = "@gita:auth_token";

async function fetchJson<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<{ ok: boolean; status: number; json?: T; error?: string }> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };

  try {
    const token = await getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {
    /* ignore */
  }

  const init: RequestInit = { ...opts, headers };

  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let json: any;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = undefined;
    }
    return {
      ok: res.ok,
      status: res.status,
      json,
      error: res.ok ? undefined : (json as any)?.error ?? text,
    };
  } catch (e: any) {
    return { ok: false, status: 0, json: undefined, error: e?.message ?? "Network error" };
  }
}

export async function login(creds: AuthCredentials): Promise<LoginResult> {
  if ((globalThis as any).__DEV_MOCK_AUTH) {
    await new Promise((r) => setTimeout(r, 500));
    return {
      success: true,
      user: { id: "mock", name: "Demo User", identifier: creds.identifier },
      token: "mock-token",
    };
  }

  const { ok, json, error } = await fetchJson<{ success?: boolean; user?: any; token?: string }>(
    "/login",
    {
      method: "POST",
      body: JSON.stringify(creds),
    }
  );

  if (!ok) {
    return { success: false, error: error ?? "Login failed" };
  }

  const user = (json as any)?.user ?? null;
  const token = (json as any)?.token;

  return {
    success: (json as any)?.success ?? true,
    user,
    token,
    error: undefined,
  };
}

export async function signup(creds: AuthCredentials): Promise<LoginResult> {
  const { ok, json, error } = await fetchJson<{ success?: boolean; user?: any; token?: string }>(
    "/signup",
    {
      method: "POST",
      body: JSON.stringify(creds),
    }
  );

  if (!ok) return { success: false, error: error ?? "Signup failed" };

  return {
    success: (json as any)?.success ?? true,
    user: (json as any)?.user,
    token: (json as any)?.token,
  };
}

export async function forgotPassword(identifier: string): Promise<{ success: boolean; error?: string }> {
  const { ok, json, error } = await fetchJson<{ success?: boolean; message?: string; error?: string }>(
    "/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }
  );

  if (!ok) return { success: false, error: error ?? "Forgot password failed" };

  return {
    success: (json as any)?.success ?? true,
    error: (json as any)?.error,
  };
}

export async function setAuthToken(token?: string | null): Promise<void> {
  if (!token) {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } else {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return (await AsyncStorage.getItem(AUTH_TOKEN_KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

export default {
  login,
  signup,
  forgotPassword,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
};