// app/gitaHome.tsx
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type HomeBlock = {
  id?: string;
  title?: string;
  image?: string;
  description?: string;
  action?: { type?: string; target?: string };
};

type HomePayload =
  | { lang?: string; langName?: string; blocks?: HomeBlock[] }
  | { success?: boolean; data?: any };

const CACHE = new Map<string, HomeBlock[]>();

export default function GitaHome(): React.ReactElement {
  const router = useRouter();
  const { lang } = useLanguage();
  const safeLang =
    typeof lang === "string" ? lang : (lang && (lang as any).code) ?? "EN";

  const endpoint = useMemo(
    () =>
      `https://eq21.co.in/_functions/AppHome?lang=${encodeURIComponent(
        safeLang
      )}`,
    [safeLang]
  );

  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<HomeBlock[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const normalize = useCallback((json: any): HomeBlock[] => {
    if (!json) return [];
    // support {success,data}, or plain object, or array
    const body = json?.success ? json.data : json;
    const arr = Array.isArray(body?.blocks) ? body.blocks : [];
    return arr.map((b: any) => ({
      id: b?.id ?? String(Math.random()),
      title: b?.title ?? "",
      image: b?.image ?? "",
      description: b?.description ?? "",
      action: b?.action ?? null,
    }));
  }, []);

  const fetchHome = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      console.debug("[gitaHome] fetch ->", endpoint, { force: false });
      if (CACHE.has(safeLang)) {
        setBlocks(CACHE.get(safeLang)!);
        setLoading(false);
        return;
      }
      const res = await fetch(endpoint);
      const text = await res.text().catch(() => "<no body>");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

      let json: HomePayload = {};
      try {
        json = JSON.parse(text);
      } catch {
        json = {};
      }
      const list = normalize(json);
      setBlocks(list);
      CACHE.set(safeLang, list);
      console.debug("[gitaHome] loaded payload keys:", Object.keys(json as any));
    } catch (e: any) {
      console.warn("[gitaHome] load failed:", e?.message || e);
      setErr(e?.message ? String(e.message) : String(e));
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, normalize, safeLang]);

  useEffect(() => {
    fetchHome();
  }, [fetchHome]);

  const handleOpen = useCallback(
    (b: HomeBlock) => {
      const target = b?.action?.target;
      if (!target) return;

      // Trust backend path (e.g. "/gitaHome", "/human-dilemma", "/mediaDemo", etc.)
      // For convenience: map "/gitaHome" to an actual screen if needed.
      if (target === "/gitaHome") {
        // Example: jump to Chapter 1 with current lang
        return router.push(
          `/chapter/1?lang=${encodeURIComponent(safeLang)}`
        );
      }

      // Otherwise push as-is (you can update your backend to send "/mediaDemo")
      router.push(target);
    },
    [router, safeLang]
  );

  const renderItem = useCallback(
    ({ item }: { item: HomeBlock }) => {
      return (
        <TouchableOpacity style={styles.card} onPress={() => handleOpen(item)}>
          {!!item.image && (
            <Image
              source={{ uri: item.image }}
              style={styles.cardImage}
              onError={() =>
                console.warn("[gitaHome] image load error", item.image)
              }
            />
          )}
          {!!item.title && <Text style={styles.cardTitle}>{item.title}</Text>}
          {!!item.description && (
            <Text style={styles.cardDesc}>{item.description}</Text>
          )}
          <Text style={styles.cardCta}>Open →</Text>
        </TouchableOpacity>
      );
    },
    [handleOpen]
  );

  const keyExtractor = useCallback(
    (b: HomeBlock, i: number) => String(b.id ?? i),
    []
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gita — Home</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text>Loading…</Text>
        </View>
      ) : err ? (
        <View style={styles.center}>
          <Text style={styles.error}>Failed to load. {err}</Text>
          <TouchableOpacity style={styles.button} onPress={fetchHome}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : blocks.length === 0 ? (
        <View style={styles.center}>
          <Text>No content.</Text>
          <TouchableOpacity style={styles.button} onPress={fetchHome}>
            <Text style={styles.buttonText}>Reload</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListFooterComponent={
            <View style={{ marginTop: 24 }}>
              <Text style={styles.subHeader}>Developer quick tests</Text>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() =>
                    router.push(
                      `/chapter/1?lang=${encodeURIComponent(safeLang)}`
                    )
                  }
                >
                  <Text style={styles.buttonText}>🎧 Chapter 1 (audio)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => router.push("/mediaDemo")}
                >
                  <Text style={styles.buttonText}>🎬 Media Demo</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16, paddingHorizontal: 12 },
  header: { fontSize: 20, fontWeight: "700", alignSelf: "center", marginBottom: 12 },
  subHeader: { fontSize: 16, fontWeight: "600" },

  center: { alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: "red" },

  card: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e6e6e6",
    backgroundColor: "#fff",
    padding: 12,
  },
  cardImage: { width: "100%", height: 160, borderRadius: 8, marginBottom: 8, backgroundColor: "#f3f3f3" },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  cardDesc: { marginTop: 6, color: "#444" },
  cardCta: { marginTop: 8, fontWeight: "600", color: "#007AFF" },

  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});