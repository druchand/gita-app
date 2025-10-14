// src/utils/wixOAuth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type WixTokens = {
  // canonical fields your app should use:
  accessToken?: string;   // canonical (camelCase) access token
  sessionId?: string;     // raw Wix session id (JWS) — optional
  refreshToken?: string;
  expiresIn?: number;
  // extra raw fields allowed (for backward compatibility)
  [k: string]: any;
};

const STORAGE_KEY = "wix_tokens_v1";

/**
 * Merge + persist tokens. This function will ensure the canonical
 * accessToken is present; if caller provided access_token (snake_case),
 * it will be normalized to accessToken before saving.
 */
export async function setStoredTokens(tokens: Partial<WixTokens> & Record<string, any>): Promise<void> {
  try {
    const text = await AsyncStorage.getItem(STORAGE_KEY);
    const prev = text ? (JSON.parse(text) as Record<string, any>) : {};

    // Normalise snake_case -> camelCase if present
    if (tokens["access_token"] && !tokens.accessToken) {
      tokens.accessToken = tokens["access_token"];
    }
    if (tokens.accessToken && !tokens["access_token"]) {
      // Optionally keep snake case for compatibility; comment out if you don't want both persisted
      tokens["access_token"] = tokens.accessToken;
    }

    const merged = { ...prev, ...(tokens as Record<string, any>) };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn("[wixOAuth] setStoredTokens error", e);
  }
}

/**
 * Read tokens and return canonical shape (accessToken).
 * If older snake_case exists in storage, normalize it on return (and optionally re-save).
 */
export async function getStoredTokens(): Promise<WixTokens | null> {
  try {
    const text = await AsyncStorage.getItem(STORAGE_KEY);
    if (!text) return null;
    const parsed = JSON.parse(text) as Record<string, any>;

    // Normalize: prefer accessToken camelCase; fall back to access_token.
    if (!parsed.accessToken && parsed["access_token"]) parsed.accessToken = parsed["access_token"];
    // Also normalize sessionId if present under different name:
    if (!parsed.sessionId && parsed["session_id"]) parsed.sessionId = parsed["session_id"];

    // Optionally re-save the normalized shape so future reads are canonical.
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    // Return typed shape
    const result: WixTokens = {
      accessToken: parsed.accessToken,
      sessionId: parsed.sessionId,
      refreshToken: parsed.refreshToken,
      expiresIn: parsed.expiresIn,
      ...parsed,
    };
    return result;
  } catch (e) {
    console.warn("[wixOAuth] getStoredTokens error", e);
    return null;
  }
}

/**
 * Clear stored tokens
 */
export async function clearStoredTokens(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("[wixOAuth] clearStoredTokens error", e);
  }
}

/**
 * Convenience helpers for using sessionId in storage (if you use sessionId like an access token).
 */
export async function setSessionId(sessionId: string): Promise<void> {
  await setStoredTokens({ sessionId, accessToken: sessionId });
}
export async function getSessionId(): Promise<string | null> {
  const t = await getStoredTokens();
  return (t?.sessionId ?? t?.accessToken) ?? null;
}

export default {
  getStoredTokens,
  setStoredTokens,
  clearStoredTokens,
  setSessionId,
  getSessionId,
};