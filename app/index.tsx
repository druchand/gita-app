// app/index.tsx
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

/**
 * index.tsx (splash / routing)
 *
 * Purpose:
 *  - Minimal entry page that ensures LanguageContext is available and hydrated,
 *    normalizes language code and redirects to /gitaHome.
 *
 * Behavior:
 *  - Uses router.replace('/gitaHome') so users don't navigate back to this splash.
 *  - Shows a simple loading indicator while language is resolved.
 *  - Logs the chosen language to Metro for easier debugging.
 *
 * Note:
 *  - Keep this file lightweight; the heavy lifting + fetch should live in gitaHome.tsx.
 */

export default function Index(): React.ReactElement {
  const router = useRouter();
  const { lang, availableLangs } = useLanguage();
  const [navigated, setNavigated] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Wait until language is available (LanguageProvider persists; if not, lang still has default)
    // Normalize lang to a string code
    const safeLang = typeof lang === "string" ? lang : (lang && (lang as any).code) ?? "EN";
    console.debug("[index] resolved lang:", safeLang, "available:", (availableLangs || []).length);

    // Only navigate once
    if (!navigated) {
      setNavigated(true);
      // Replace so splash isn't in history
      try {
        router.replace(`/gitaHome?lang=${encodeURIComponent(safeLang)}`);
      } catch (err) {
        console.warn("[index] router.replace failed:", err);
        // fallback: push if replace fails
        try {
          router.push(`/gitaHome?lang=${encodeURIComponent(safeLang)}`);
        } catch (e) {
          console.error("[index] router.push failed too:", e);
        }
      }
    }
  }, [lang, availableLangs, navigated, router]);

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Preparing Gita App…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  text: { marginTop: 12, fontSize: 16, color: "#333" },
});