// app/index.tsx
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function Index(): React.ReactElement {
  const router = useRouter();
  const mounted = useRef(false);
  const [ready, setReady] = useState(false);
  const { lang, availableLangs } = useLanguage();

  // Mark component mounted
  useEffect(() => {
    mounted.current = true;
    const timeout = setTimeout(() => setReady(true), 200);
    return () => {
      mounted.current = false;
      clearTimeout(timeout);
    };
  }, []);

  // Safe navigation only when ready
  useEffect(() => {
    if (!mounted.current || !ready) return;

    const target = "/gitaHome"; // adjust route if needed
    const navigate = async () => {
      try {
        await router.replace(target);
        console.debug("[index] router.replace ->", target);
      } catch (err) {
        console.warn("[index] router.replace failed:", err);
        try {
          await router.push(target);
        } catch (e) {
          console.warn("[index] router.push failed:", e);
        }
      }
    };

    navigate();
  }, [router, ready, lang, availableLangs]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Loading home...</Text>
    </View>
  );
}