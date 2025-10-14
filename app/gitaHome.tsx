// app/gitaHome.tsx
import CollapsibleText from "@/components/CollapsibleText"; // existing component
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type ChapterItem = { chapter: number; title?: string };
type AppHomeData = {
  title?: string;
  image?: string | null;
  description?: string | null;
  chapters?: ChapterItem[];
  lang?: string;
};

const BASE = (globalThis as any)?.AUTH_BASE_URL ?? "https://eq21.co.in";

export default function GitaHome(): React.ReactElement {
  const router = useRouter();
  // ensure default "EN" if language provider returns null
  const languageCtx = useLanguage?.();
  const lang = (languageCtx?.lang ?? "EN") as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AppHomeData | null>(null);

  useEffect(() => {
    let mounted = true;
    const url = `${BASE}/_functions/gitaHome?lang=${encodeURIComponent(String(lang ?? "EN"))}`;
    console.debug("[gitaHome] fetch ->", url);

    (async () => {
      try {
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.debug("[gitaHome] fetch response not ok", res.status, txt);
          if (!mounted) return;
          setError(`Backend returned ${res.status}`);
          setLoading(false);
          return;
        }
        const json = await res.json().catch(() => null);
        // console.debug("[gitaHome] fetch ok preview:", json);
        if (!mounted) return;

        // Normalize into our shape
        const payload: AppHomeData = {
          title: json?.title ?? json?.heading ?? "Gita",
          image: json?.image ?? json?.cover ?? null,
          description: json?.description ?? json?.desc ?? json?.summary ?? null,
          chapters: (json?.chapters ?? json?.items ?? []) as ChapterItem[],
          lang: json?.lang ?? lang,
        };
        setData(payload);
        setLoading(false);
      } catch (err) {
        console.error("[gitaHome] fetch error", err);
        if (!mounted) return;
        // safe access to err.message
        setError(String((err as any)?.message ?? err));
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [lang]);
  
  function openChapter(chap: ChapterItem) {
    const id = String(chap.chapter);
    const route = `/chapter/${id}`;
    console.debug("[gitaHome] navigate to chapter", id, "->", route);
    try {
      router.push(route);
    } catch (err) {
      console.error("[gitaHome] router.push failed", err);
      Alert.alert("Navigation failed", String((err as any)?.message ?? err));
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No data</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.safe} contentContainerStyle={{ padding: 16 }}>
      {/* Block 1: Hero */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>{data.title ?? "Bhagavad Gita"}</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.imageWrap}
          onPress={() => {
            console.debug("[gitaHome] hero pressed - no-op currently");
          }}
        >
          {data.image ? (
            <Image source={{ uri: data.image }} style={styles.heroImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>Image</Text>
            </View>
          )}
        </TouchableOpacity>

        {data.description ? (
          <CollapsibleText text={data.description} numberOfLines={4} />
        ) : null}
      </View>

      {/* Block 2: Chapters Grid */}
      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Chapters</Text>
        <View style={styles.grid}>
          {(data.chapters ?? []).map((c) => {
            const idStr = String(c.chapter);
            return (
              <TouchableOpacity
                key={idStr}
                style={styles.chapterBtn}
                onPress={() => openChapter(c)}
              >
                <Text style={styles.chapterBtnText}>
                  {c.chapter}
                  {c.title ? ` — ${c.title}` : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
          {(!data.chapters || data.chapters.length === 0) && (
            <Text style={styles.small}>No chapters available.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, padding: 16 },
  block: { marginBottom: 20 },
  blockTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  imageWrap: { alignItems: "center", marginBottom: 12 },
  heroImage: { width: "100%", height: 180, borderRadius: 8, resizeMode: "cover" },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: { color: "#888" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  chapterBtn: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    margin: 6,
    borderRadius: 8,
    minWidth: 110,
  },
  chapterBtnText: { fontSize: 14 },
  small: { color: "#666", marginTop: 8 },
  errorText: { color: "red" },
});