// src/utils/authApi.ts
import Constants from "expo-constants";

/** =========================
 * Config: base URL
 * ========================= */
const DEFAULT_BASE = "https://eq21.co.in/_functions";

export const AUTH_BASE: string =
  // allow overriding at runtime (dev/testing)
  (globalThis as any)?.AUTH_BASE_URL ??
  // allow configuring via app.config.js / app.json extra
  (Constants?.expoConfig?.extra?.AUTH_BASE_URL as string | undefined) ??
  DEFAULT_BASE;

/** =========================
 * Public types
 * ========================= */
export type MeScope = "BASIC" | "FULL";

export type AuthCredentials = {
  identifier: string; // email or phone
  password: string;
  securityCode?: string | null; // optional second factor / future use
};

export type LoginResult = {
  success: boolean;
  sessionId?: string; // JWS.* token returned by backend
  token?: string;     // if backend also returns a token field
  errorCode?: string;
  message?: string;
  error?: string;     // normalized alias of message/error for caller convenience
  [k: string]: any;   // allow backend to return extra fields
};

/** =========================
 * Internal helpers
 * ========================= */
function rid(len = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function safeJson(res: Response): Promise<any | null> {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function joinUrl(base: string, path: string): string {
  if (path.startsWith("http")) return path;
  const slash = path.startsWith("/") ? "" : "/";
  return `${base}${slash}${path}`;
}

/** =========================
 * Low-level HTTP
 * ========================= */
export async function postJson<T = any>(path: string, body?: any, headers?: Record<string, string>): Promise<{
  ok: boolean;
  status: number;
  json: T | null;
}> {
  const url = joinUrl(AUTH_BASE, path);
  const reqId = rid();
  const previewBody =
    body && typeof body === "object"
      ? JSON.stringify({
          ...body,
          ...(body.password ? { password: "•••" } : {}),
        })
      : undefined;

  console.debug(`[authApi:${reqId}] fetch: POST ${url} bodyPreview: ${previewBody ?? "null"}`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await safeJson(res);
  console.debug(
    `[authApi:${reqId}] response ${res.status} preview: ${
      json ? JSON.stringify(truncateForLog(json)) : "null"
    }`
  );

  return { ok: res.ok, status: res.status, json: (json as T) ?? null };
}

export async function getJson<T = any>(path: string, headers?: Record<string, string>): Promise<{
  ok: boolean;
  status: number;
  json: T | null;
}> {
  const url = joinUrl(AUTH_BASE, path);
  const reqId = rid();

  console.debug(`[authApi:${reqId}] fetch: GET ${url}`);
  if (headers?.Authorization) {
    console.debug("[authApi] auth header (preview):", previewAuth(headers.Authorization));
  }

  const res = await fetch(url, { method: "GET", headers });
  const json = await safeJson(res);

  console.debug(
    `[authApi:${reqId}] response ${res.status} preview: ${
      json ? JSON.stringify(truncateForLog(json)) : "null"
    }`
  );

  return { ok: res.ok, status: res.status, json: (json as T) ?? null };
}

// small helper: avoid dumping huge blobs to the console
function truncateForLog(v: any): any {
  try {
    const s = JSON.stringify(v);
    if (s.length > 400) return JSON.parse(s.slice(0, 400) + '…"');
  } catch {
    /* ignore */
  }
  return v;
}

function previewAuth(token: string): string {
  if (!token) return "(empty)";
  return token.length <= 12 ? token : token.slice(0, 12) + "…";
}

/** =========================
 * High-level API
 * ========================= */

/** POST /login  ->  { success, sessionId, token, ... } */
export async function login(creds: AuthCredentials): Promise<LoginResult> {
  // Backend expects { identifier, password, securityCode? }
  const r = await postJson<any>("/login", creds);

  if (!r.ok) {
    const msg = (r.json as any)?.message || (r.json as any)?.error || `HTTP ${r.status}`;
    return {
      success: false,
      errorCode: (r.json as any)?.errorCode,
      message: msg,
      error: msg,
      status: r.status,
    };
  }

  const data = (r.json as any) ?? {};
  const sessionId: string | undefined = data.sessionId ?? data.token ?? undefined;
  const msg: string | undefined = data.message ?? data.error ?? undefined;

  console.debug("[authApi] login ok:", {
    success: true,
    hasSessionId: !!sessionId,
  });

  return {
    success: data.success ?? !!sessionId,
    sessionId,
    token: data.token,
    errorCode: data.errorCode,
    message: msg,
    error: msg, // normalized alias so callers using `res.error` keep working
    ...data,
  };
}

/** GET /me?scope=MIN|FULL (Authorization header carries raw sessionId) */
export async function getMe(scope: MeScope = "FULL", sessionId?: string): Promise<{
  success: boolean;
  user?: any;
  status?: number;
  error?: string;
}> {
  const qs = `?scope=${encodeURIComponent(scope)}`;
  const headers: Record<string, string> = {};
  if (sessionId) headers.Authorization = sessionId;

  console.debug("[authApi] GET ->", joinUrl(AUTH_BASE, `/me${qs}`));
  const r = await getJson<any>(`/me${qs}`, headers);

  if (!r.ok) {
    const msg = (r.json as any)?.message || (r.json as any)?.error || `HTTP ${r.status}`;
    return { success: false, status: r.status, error: msg };
  }

  // Expecting { success: boolean, user: { ... } }
  return (r.json as any) ?? { success: false, error: "Empty response" };
}

/** POST /forgot-password */
export async function forgotPassword(identifier: string): Promise<{
  success: boolean;
  status?: number;
  error?: string;
}> {
  const r = await postJson<any>("/forgotPassword", { identifier });

  if (!r.ok) {
    const msg = (r.json as any)?.message || (r.json as any)?.error || `HTTP ${r.status}`;
    return { success: false, status: r.status, error: msg };
  }

  const data = (r.json as any) ?? {};
  return {
    success: data.success ?? true,
    ...(data ?? {}),
  };
}

/** =========================
 * Default export (object style)
 * ========================= */
const authApi = {
  AUTH_BASE,
  login,
  getMe,
  forgotPassword,
  postJson,
  getJson,
};

export default authApi;