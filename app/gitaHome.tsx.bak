// app/gitaHome.tsx
import { useLanguage } from "@/context/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Block = {
  id?: string;
  title?: string;
  image?: string;
  description?: string;
  action?: { type?: string; target?: string };
};

const CACHE_KEY_PREFIX = "gita:home:"; // + lang
const FETCH_TIMEOUT_MS = 15000;

export default function GitaHome(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { lang: ctxLang } = useLanguage();

  const queryLang = typeof params?.lang === "string" ? params.lang : undefined;
  const safeLang = queryLang ?? (typeof ctxLang === "string" ? ctxLang : (ctxLang && (ctxLang as any).code) ?? "EN");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<any | null>(null);
  const [imageErrorIds, setImageErrorIds] = useState<Record<string, boolean>>({});

  const cacheKey = `${CACHE_KEY_PREFIX}${safeLang}`;

  // normalization: unwrap many possible backend shapes
  const normalizePayload = (raw: any) => {
    if (!raw) return null;
    // common wrappers:
    // { success: true, data: {...} }
    if (raw.success && raw.data) return raw.data;
    // { success: true, body: {...} } (some frameworks)
    if (raw.success && raw.body) {
      // some backends nest again: { body: { body: {...} } }
      if (raw.body.body) return raw.body.body;
      return raw.body;
    }
    // direct body: { lang, blocks }
    if (raw.lang || raw.blocks) return raw;
    // other wrappers: { body: { lang... } }
    if (raw.body && (raw.body.lang || raw.body.blocks)) return raw.body;
    // fallback to raw
    return raw;
  };

  const restoreFromCache = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        console.debug("[gitaHome] using cached payload for", safeLang);
        setPayload(parsed);
        setError(null);
        return true;
      }
    } catch (err) {
      console.warn("[gitaHome] failed to restore cache", err);
    }
    return false;
  }, [cacheKey, safeLang]);

  const persistToCache = useCallback(
    async (data: any) => {
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
        console.debug("[gitaHome] cached payload for", safeLang);
      } catch (err) {
        console.warn("[gitaHome] failed to persist cache", err);
      }
    },
    [cacheKey, safeLang]
  );

  const fetchHome = useCallback(
    async (suppliedLang?: string | null, { force = false }: { force?: boolean } = {}) => {
      const finalLang = suppliedLang ?? safeLang ?? "EN";
      const url = `https://eq21.co.in/_functions/AppHome?lang=${encodeURIComponent(finalLang)}`;

      console.debug("[gitaHome] fetch ->", url, { force });
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store" as RequestCache,
          signal: controller.signal,
        });

        clearTimeout(id);

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.warn("[gitaHome] fetch not ok", res.status, res.statusText, text?.slice?.(0, 200));
          setError(`Server returned ${res.status}`);
          // try cached fallback
          const used = await restoreFromCache();
          if (!used) setPayload(null);
          return;
        }

        // Read as text then parse once (defensive)
        const text = await res.text().catch((e) => {
          console.warn("[gitaHome] failed to read text body", e);
          return "";
        });

        if (!text) {
          console.warn("[gitaHome] empty response body");
          setError("Empty response from server");
          const used = await restoreFromCache();
          if (!used) setPayload(null);
          return;
        }

        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch (err) {
          // try res.json as a last resort (some servers may have different behavior)
          try {
            json = await (async () => {
              try {
                return await res.json();
              } catch (e) {
                return null;
              }
            })();
            console.warn("[gitaHome] JSON.parse failed; used res.json fallback", err);
          } catch (e) {
            console.warn("[gitaHome] final json fallback failed", e);
            json = null;
          }
        }

        if (!json) {
          console.warn("[gitaHome] no JSON parsed");
          setError("Invalid JSON from server");
          const used = await restoreFromCache();
          if (!used) setPayload(null);
          return;
        }

        const normalized = normalizePayload(json);
        if (!normalized) {
          console.warn("[gitaHome] normalized payload empty", Object.keys(json ?? {}));
          setError("Unexpected payload shape");
          const used = await restoreFromCache();
          if (!used) setPayload(null);
          return;
        }

        setPayload(normalized);
        setError(null);

        // persist best-effort
        persistToCache(normalized);
        console.debug("[gitaHome] loaded payload keys:", Object.keys(normalized ?? {}));
      } catch (err: any) {
        if (err?.name === "AbortError") {
          console.warn("[gitaHome] fetch aborted (timeout)");
          setError("Request timed out");
        } else {
          console.error("[gitaHome] fetchHome error", err);
          setError(String(err?.message ?? err));
        }
        // fallback to cache
        await restoreFromCache();
      } finally {
        clearTimeout(id);
        setLoading(false);
      }
    },
    [normalizePayload, persistToCache, restoreFromCache, safeLang]
  );

  useEffect(() => {
    fetchHome(safeLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeLang]);

  // memoized blocks
  const blocks: Block[] = useMemo(() => {
    if (!payload) return [];
    return Array.isArray(payload.blocks) ? payload.blocks : [];
  }, [payload]);

  const handleAction = (action?: { type?: string; target?: string }) => {
    if (!action) return;
    if (action.type === "navigate" && action.target) {
      try {
        router.push(action.target);
      } catch (err) {
        console.warn("[gitaHome] router.push failed", err);
        Alert.alert("Unable to navigate", action.target);
      }
      return;
    }
    if (action.type === "external" && action.target) {
      // open external url
      try {
        // Note: Linking.openURL can be used; keep simple for now:
        // Linking.openURL(action.target);
        Alert.alert("External", action.target);
      } catch (err) {
        console.warn("[gitaHome] open external failed", err);
      }
      return;
    }
    Alert.alert("Action", JSON.stringify(action));
  };

  const onImageError = (id?: string) => {
    if (!id) return;
    setImageErrorIds((s) => ({ ...s, [id]: true }));
  };

  // UI states
  if (loading && !payload) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading content…</Text>
      </View>
    );
  }

  if (error && !payload) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red", textAlign: "center" }}>Error: {error}</Text>
        <TouchableOpacity onPress={() => fetchHome(safeLang, { force: true })} style={{ marginTop: 12 }}>
          <Text style={{ color: "#007AFF" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!payload) {
    return (
      <View style={styles.center}>
        <Text>No content available.</Text>
        <TouchableOpacity onPress={() => fetchHome(safeLang, { force: true })} style={{ marginTop: 12 }}>
          <Text style={{ color: "#007AFF" }}>Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pageTitle = payload.title ?? payload.langName ?? "Gita App";

  const renderBlock = (b: Block, idx: number, hero = false) => {
    const key = b.id ?? `block-${idx}`;
    const failed = !!(b.id && imageErrorIds[b.id]);
    return (
      <View key={key} style={[styles.card, hero ? styles.heroCard : undefined]}>
        {b.image && !failed ? (
          <Image
            source={{ uri: b.image }}
            style={[styles.cardImage, hero ? styles.heroImage : undefined]}
            resizeMode="cover"
            onError={() => {
              console.warn("[gitaHome] image load error", b.image);
              onImageError(b.id);
            }}
          />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder, hero ? styles.heroImage : undefined]}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, hero ? styles.heroTitle : undefined]}>{b.title ?? "Untitled"}</Text>
          {b.description ? <Text style={styles.cardDesc}>{b.description}</Text> : null}

          {b.action?.type === "navigate" && b.action?.target ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction(b.action)}>
              <Text style={styles.actionText}>Open</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{pageTitle}</Text>

      {blocks.length > 0 ? (
        <View>
          {renderBlock(blocks[0], 0, true)}
          {blocks.slice(1).map((b, i) => renderBlock(b, i + 1, false))}
        </View>
      ) : (
        <>
          <View style={styles.emptyHero}>
            <Text>Image placeholder</Text>
          </View>
          <Text style={styles.desc}>{payload?.description ?? "Welcome — content will be populated from backend."}</Text>
        </>
      )}
    </ScrollView>
  );
}

const win = Dimensions.get("window");
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 20, fontWeight: "700", alignSelf: "center", marginBottom: 12 },

  emptyHero: { height: 200, backgroundColor: "#eee", borderRadius: 8, marginVertical: 12, alignItems: "center", justifyContent: "center" },
  desc: { marginTop: 12, color: "#444", lineHeight: 20 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  heroCard: {},
  cardImage: {
    width: "100%",
    height: Math.round(win.width * 0.45),
    backgroundColor: "#ddd",
  },
  heroImage: {
    height: Math.round(win.width * 0.55),
  },
  cardImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eee",
  },
  placeholderText: {
    color: "#666",
  },
  cardBody: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 22,
  },
  cardDesc: {
    color: "#444",
    marginBottom: 12,
  },
  actionBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
  },
  actionText: {
    fontWeight: "600",
  },
});