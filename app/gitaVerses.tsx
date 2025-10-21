// app/gitaVerses.tsx
import { useLanguage } from "@/context/LanguageContext";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ expo-audio
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioSource,
} from "expo-audio";

type Verse = {
  id?: string | number;
  index?: number;
  text?: string;
  transliteration?: string;
  translation?: string;
  audioUrl?: string;
};

type VersesPayload = {
  chapter?: string | number;
  lang?: string;
  verses?: Verse[];
};

function formatTime(ms: number) {
  if (!ms || ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function GitaVerses(): React.ReactElement {
  const params = useLocalSearchParams() as Record<string, string | undefined>;
  const fetchChapter = params.chapter ?? params.id ?? null;

  const { lang } = useLanguage();
  const safeLang =
    typeof lang === "string" ? lang : (lang && (lang as any).code) ?? "EN";

  const endpoint = useMemo(() => {
    if (!fetchChapter) return null;
    return `https://eq21.co.in/_functions/gitaVerses?chapter=${encodeURIComponent(
      String(fetchChapter)
    )}&lang=${encodeURIComponent(safeLang)}`;
  }, [fetchChapter, safeLang]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player); // ✅ single arg

  const [currentId, setCurrentId] = useState<string | number | null>(null);
  const playing = !!status?.playing;
  const position = status?.currentTime ?? 0; // ✅ currentTime
  const duration = status?.duration ?? 0; // ✅ duration

  const fetchVerses = useCallback(async () => {
    if (!endpoint) {
      setErr("Missing chapter id.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      console.log("[gitaVerses] fetch ->", endpoint);
      const res = await fetch(endpoint);
      const text = await res.text().catch(() => "<no body>");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

      let json: any = {};
      try {
        json = JSON.parse(text);
      } catch {
        json = {};
      }

      const payload: VersesPayload = Array.isArray(json)
        ? { verses: json as Verse[] }
        : json?.data && Array.isArray(json.data)
        ? { verses: json.data as Verse[] }
        : json?.verses && Array.isArray(json.verses)
        ? { verses: json.verses as Verse[] }
        : { verses: [] };

      const normalized = (payload.verses ?? []).map((v: any, i: number) => ({
        id: v.id ?? v.index ?? i + 1,
        index: v.index ?? i + 1,
        text: v.text ?? v.shloka ?? v.verse ?? "",
        transliteration: v.transliteration ?? v.roma ?? "",
        translation: v.translation ?? v.meaning ?? "",
        audioUrl: v.audioUrl ?? v.audio ?? v.mp3 ?? undefined,
      }));

      setVerses(normalized);
    } catch (e: any) {
      console.warn("[gitaVerses] load failed:", e?.message || e);
      setErr(e?.message ? String(e.message) : String(e));
      setVerses([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchVerses();
  }, [fetchVerses]);

  // release on chapter/lang change and unmount
  useEffect(() => {
    return () => {
      (async () => {
        try {
          await player.release();
        } catch {}
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchChapter, safeLang]);

  const handleToggle = useCallback(
    async (v: Verse) => {
      if (!v?.audioUrl) {
        Alert.alert("No audio", "No audio available for this verse.");
        return;
      }
      try {
        if (!status?.isLoaded || currentId !== (v.id ?? v.index)) {
          await player.replace({ uri: v.audioUrl } as AudioSource);
          await player.play();
          setCurrentId(v.id ?? v.index ?? null);
        } else if (status.playing) {
          await player.pause();
        } else {
          if (duration > 0 && position >= duration) {
            await player.seekTo(0);
          }
          await player.play();
        }
      } catch (e) {
        console.error("[gitaVerses] audio error:", e);
        Alert.alert("Audio error", "Unable to play verse audio.");
      }
    },
    [player, status, currentId, duration, position]
  );

  const renderItem = useCallback(
    ({ item }: { item: Verse }) => {
      const isActive = currentId === (item.id ?? item.index);
      const showTime = isActive && status?.isLoaded;
      return (
        <View style={styles.verseCard}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={[styles.iconButton, isActive && styles.activeIcon]}
              onPress={() => handleToggle(item)}
            >
              <Text style={styles.iconText}>
                {isActive && playing ? "⏸" : "▶"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.verseIndex}>
              {(item.index ?? item.id ?? "?") as any}.
            </Text>
          </View>

          {showTime ? (
            <Text style={styles.timeText}>
              {formatTime(position)} / {formatTime(duration)}
            </Text>
          ) : null}

          {item.text ? (
            <Text style={styles.verseText}>{item.text}</Text>
          ) : null}
          {item.translation ? (
            <Text style={styles.translation}>{item.translation}</Text>
          ) : null}
          {item.transliteration ? (
            <Text style={styles.translit}>{item.transliteration}</Text>
          ) : null}
        </View>
      );
    },
    [currentId, duration, handleToggle, playing, position, status?.isLoaded]
  );

  const keyExtractor = useCallback(
    (item: Verse, idx: number) => String(item.id ?? item.index ?? idx),
    []
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {fetchChapter ? `Verses — Chapter ${fetchChapter}` : "Verses"}
      </Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text>Loading verses…</Text>
        </View>
      ) : err ? (
        <View style={styles.center}>
          <Text style={styles.error}>Unable to load verses. {err}</Text>
          <TouchableOpacity style={styles.button} onPress={fetchVerses}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : verses.length === 0 ? (
        <View style={styles.center}>
          <Text>No verses found.</Text>
          <TouchableOpacity style={styles.button} onPress={fetchVerses}>
            <Text style={styles.buttonText}>Reload</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16, paddingHorizontal: 12 },
  header: {
    fontSize: 20,
    fontWeight: "700",
    alignSelf: "center",
    marginBottom: 12,
  },
  center: { alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: "red" },
  button: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignSelf: "flex-start",
  },
  buttonText: { color: "#fff", fontWeight: "600" },

  verseCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e6e6e6",
  },
  iconButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  activeIcon: { backgroundColor: "#dfefff" },
  iconText: { fontSize: 18, fontWeight: "700" },
  verseIndex: { marginLeft: 10, fontWeight: "600" },

  timeText: { marginTop: 6, color: "#444", fontSize: 13 },

  verseText: { marginTop: 10, fontSize: 16, lineHeight: 24, color: "#222" },
  translation: { marginTop: 6, fontSize: 15, lineHeight: 22, color: "#444" },
  translit: { marginTop: 6, fontSize: 14, lineHeight: 21, color: "#666" },
});