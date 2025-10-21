// app/chapter/[id].tsx
import { useLanguage } from "@/context/LanguageContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ChapterPayload = {
  id?: string | number;
  title?: string;
  description?: string;
  audioUrl?: string;
  SanskritChapterAudioUrl?: string;
  // add any other fields you return
};

function coerceId(param: string | string[] | undefined): string | null {
  if (typeof param === "string" && param.length) return param;
  if (Array.isArray(param) && param.length && typeof param[0] === "string") return param[0];
  return null;
}

export default function ChapterPage(): React.ReactElement {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const fetchId = coerceId(params.id);
  const { lang } = useLanguage();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<ChapterPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const idForFetch = fetchId ?? null;
    console.log("[chapterPage] resolved params:", params, "coerced id:", idForFetch, "lang:", lang);

    if (!idForFetch) {
      setError("Missing chapter id.");
      return;
    }

    const url = `https://eq21.co.in/_functions/chapter?chapter=${encodeURIComponent(
      idForFetch
    )}&lang=${encodeURIComponent(lang)}`;
    console.log("[chapterPage] fetching chapter", url);

    setLoading(true);
    setError(null);

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // accept both {success, data} and direct object
        const data: ChapterPayload = (json?.data ?? json) as ChapterPayload;
        if (mounted.current) {
          setPayload(data ?? {});
        }
      })
      .catch((e) => {
        console.warn("[chapterPage] fetch failed:", e);
        if (mounted.current) setError(e?.message ?? "Failed to load chapter.");
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
  }, [fetchId, lang]);

  // ---- Render ----
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Chapter</Text>

      {!fetchId && (
        <View style={styles.card}>
          <Text style={styles.error}>No chapter id provided in URL.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.btn}>
            <Text style={styles.btnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {fetchId && loading && (
        <View style={styles.card}>
          <ActivityIndicator />
          <Text style={styles.note}>Loading chapter {fetchId}…</Text>
        </View>
      )}

      {fetchId && error && !loading && (
        <View style={styles.card}>
          <Text style={styles.error}>Error: {error}</Text>
          <TouchableOpacity onPress={() => router.replace(`/chapter/${fetchId}`)} style={styles.btn}>
            <Text style={styles.btnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {fetchId && !loading && !error && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{payload?.title ?? `Chapter ${fetchId}`}</Text>
          {!!payload?.description && <Text style={styles.note}>{payload.description}</Text>}

          {/* If you want to re-enable audio later, wire it below using expo-audio
             but only after payload is loaded and URLs exist. */}
          {/* Example placeholders:
          <AudioControls label="Sanskrit" url={payload?.SanskritChapterAudioUrl} />
          <AudioControls label="Narration" url={payload?.audioUrl} />
          */}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5ea",
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 6 },
  note: { color: "#666" },
  error: { color: "#d00", fontWeight: "600" },
  btn: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#e8f0ff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#a7c2ff",
  },
  btnText: { color: "#2546bd", fontWeight: "600" },
});