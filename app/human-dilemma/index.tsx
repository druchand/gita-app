// app/human-dilemma/index.tsx
import { useLanguage } from "@/context/LanguageContext";
import { Link } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Raw = Record<string, any>;

type Item = {
  id: string;
  title: string;
  summary?: string;
  image?: string;
};

function pickTitle(raw: Raw): string | undefined {
  // Try common title-ish fields in order
  const candidates = [
    raw.title,
    raw.name,
    raw.label,
    raw.text,
    raw.topic?.title,
    raw.heading,
  ];
  const found = candidates.find((v) => typeof v === "string" && v.trim().length > 0);
  return found?.trim();
}

function normalize(raw: Raw): Item | null {
  // Find an id: prefer explicit ids, otherwise any stable key
  const id =
    String(
      raw.id ??
        raw._id ??
        raw.key ??
        raw.slug ??
        raw.code ??
        raw.value ??
        ""
    ).trim();

  const title = pickTitle(raw);
  if (!title) return null; // skip rows with no displayable title

  return {
    id: id || title, // fallback: use title as id if absolutely nothing else
    title,
    summary:
      typeof raw.summary === "string" && raw.summary.trim()
        ? raw.summary.trim()
        : undefined,
    image:
      typeof raw.image === "string" && raw.image.trim()
        ? raw.image.trim()
        : undefined,
  };
}

export default function HumanDilemmas(): React.ReactElement {
  const { lang } = useLanguage();

  const url = useMemo(() => {
    const u = new URL("https://eq21.co.in/_functions/dilemmaList");
    if (lang) u.searchParams.set("lang", lang);
    return u.toString();
  }, [lang]);

  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; data: Item[] }
    | { status: "error"; message: string }
  >({ status: "idle" });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setState({ status: "loading" });
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as Raw[] | Raw;

        // Accept either an array or an object with a data array
        const list: Raw[] = Array.isArray(json)
          ? json
          : Array.isArray((json as any)?.data)
          ? (json as any).data
          : [];

        const normalized = list
          .map(normalize)
          .filter((x): x is Item => !!x)
          // Optionally dedupe by id/title
          .reduce<Item[]>((acc, cur) => {
            const key = `${cur.id}|${cur.title}`.toLowerCase();
            if (!acc.some((a) => `${a.id}|${a.title}`.toLowerCase() === key)) acc.push(cur);
            return acc;
          }, [])
          .sort((a, b) => a.title.localeCompare(b.title));

        if (!alive) return;
        setState({ status: "ready", data: normalized });
      } catch (e: any) {
        if (!alive) return;
        setState({ status: "error", message: e?.message ?? "Fetch failed" });
      }
    })();
    return () => {
      alive = false;
    };
  }, [url]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.h1}>Human Dilemmas</Text>
      </View>

      {state.status === "loading" || state.status === "idle" ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text>Loading…</Text>
        </View>
      ) : state.status === "error" ? (
        <View style={styles.center}>
          <Text style={styles.error}>Failed to load: {state.message}</Text>
        </View>
      ) : state.data.length === 0 ? (
        <View style={styles.center}>
          <Text>No dilemmas found.</Text>
        </View>
      ) : (
        <FlatList
          data={state.data}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Link
              href={{
                pathname: "/human-dilemma/[id]",
                params: {
                  id: item.id,
                  title: item.title,
                  summary: item.summary,
                  image: item.image,
                },
              }}
              asChild
            >
              <Pressable style={styles.card}>
                <Text style={styles.title}>{item.title}</Text>
                {item.summary ? (
                  <Text numberOfLines={2} style={styles.summary}>
                    {item.summary}
                  </Text>
                ) : null}
              </Pressable>
            </Link>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  h1: { fontSize: 24, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  error: { color: "#b00020" },
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    // subtle border / shadow
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  title: { fontSize: 17, fontWeight: "600" },
  summary: { marginTop: 6, color: "#444" },
});