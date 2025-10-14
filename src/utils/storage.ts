// src/utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

async function setItem(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}
async function getItem(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}
async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
async function clear(): Promise<void> {
  await AsyncStorage.clear();
}

const storage = {
  setItem,
  getItem,
  removeItem,
  clear,
};

export default storage;
export { clear, getItem, removeItem, setItem };
// Session-specific helpers
const SESSION_KEY = "sessionId";

export async function setSessionToken(token: string): Promise<void> {
  await setItem(SESSION_KEY, token);
}

export async function getSessionToken(): Promise<string | null> {
  return getItem(SESSION_KEY);
}

export async function clearSessionToken(): Promise<void> {
  await removeItem(SESSION_KEY);
}