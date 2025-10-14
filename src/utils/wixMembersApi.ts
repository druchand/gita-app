// src/utils/wixMembersApi.ts
import { getStoredTokens } from "@/utils/wixOAuth";
import Constants from "expo-constants";

const API_BASE = (Constants.expoConfig?.extra?.WIX_API_BASE as string) ?? "https://www.wixapis.com";

// NOTE: Confirm the exact endpoint in Wix Headless docs for your project.
// Common pattern:
const CURRENT_MEMBER_PATH = "/members/v1/members/current";

/**
 * Fetch the current member from Wix Headless API.
 * Uses tokens from getStoredTokens() (canonical shape: accessToken).
 */
export async function getCurrentMember(): Promise<any> {
  const tokens = await getStoredTokens();
  if (!tokens?.accessToken) {
    throw new Error("Not authenticated (no access token).");
  }

  const res = await fetch(`${API_BASE}${CURRENT_MEMBER_PATH}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Wix API error ${res.status}${text ? ` - ${text}` : ""}`);
  }

  return res.json();
}
export default { getCurrentMember };