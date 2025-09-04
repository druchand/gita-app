// utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_VISIT_KEY = 'eq21:lastVisit:v1';

export type LastVisit = {
  chapterId: string;   // e.g. "2"
  shloka: string;      // e.g. "12"
  lang?: string | null; // optional current language key, e.g. "hi" / "en"
};

// Save last visited
export async function setLastVisit(v: LastVisit) {
  try {
    await AsyncStorage.setItem(LAST_VISIT_KEY, JSON.stringify(v));
  } catch {}
}

// Read last visited (or null)
export async function getLastVisit(): Promise<LastVisit | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_VISIT_KEY);
    return raw ? (JSON.parse(raw) as LastVisit) : null;
  } catch {
    return null;
  }
}

// Optional: clear
export async function clearLastVisit() {
  try { await AsyncStorage.removeItem(LAST_VISIT_KEY); } catch {}
}
