// app/gitaVerses.tsx
import { useLanguage } from '@/context/LanguageContext';
import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;

type Translation = { lang?: string; text?: string; audioUrl?: string };
type Verse = {
  id?: string;
  verse?: number;
  sanskrit?: string;
  learn2Recite?: string;
  recite?: string;
  translations?: Translation[];
};
type BackendResponse = {
  chapter?: string | number;
  SanskritChapterAudioUrl?: string;
  totalCount?: number;
  verses?: Verse[];
};

function formatTime(ms: number | null | undefined) {
  if (!ms || ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function GitaVersesScreen({ navigation }: any) {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const chapterParam = (searchParams?.chapter ?? searchParams?.id) as string | undefined;

  const { lang: ctxLang } = useLanguage();
  const lang = (ctxLang ?? "EN").toString().toUpperCase();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState<number>(0);
  const [pageSize] = useState<number>(20);

  const [index, setIndex] = useState<number>(0);
  const indexRef = useRef<number>(0); // keep ref in sync with index for callbacks
  indexRef.current = index;

  const pendingIndexRef = useRef<number | null>(null); // used to restore index after replace fetch

  const listRef = useRef<FlatList<Verse> | null>(null);

  // single audio player
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playingForRef = useRef<{ type: "learn" | "recite" | null; verse?: number } | null>(null);

  // playback timers for currently loaded audio
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [playbackDuration, setPlaybackDuration] = useState<number>(0);

  // --- fetch function
  const fetchMore = useCallback(
    async (startSkip = 0, replace = false) => {
      if (!chapterParam) {
        setError("No chapter specified");
        return;
      }
      // if replace is true and we have an index, remember it for restore
      if (replace) {
        pendingIndexRef.current = indexRef.current;
      }
      setLoading(true);
      setError(null);
      try {
        const url = `https://eq21.co.in/_functions/shlokas?chapter=${encodeURIComponent(
          chapterParam
        )}&lang=${encodeURIComponent(lang)}&skip=${encodeURIComponent(String(startSkip))}&limit=${encodeURIComponent(
          String(pageSize)
        )}`;
        console.log("[gitaVerses] fetching", url);
        const res = await fetch(url);
        console.log("[gitaVerses] response status", res.status);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Bad status ${res.status} ${text}`);
        }
        const body: BackendResponse = await res.json();
        const incoming = body.verses ?? [];
        setTotalCount(body.totalCount ?? null);

        // update verses; if replace, replace array else append
        setVerses((prev) => {
          const next = replace ? incoming : [...prev, ...incoming];

          // after we've updated the verses state, if a pending index is set, try to restore
          if (replace && pendingIndexRef.current != null) {
            // schedule scroll on next tick to allow FlatList to render
            const restoreIndex = pendingIndexRef.current;
            setTimeout(() => {
              const safeIndex = Math.min(restoreIndex, next.length - 1);
              if (typeof safeIndex === "number" && safeIndex >= 0) {
                try {
                  listRef.current?.scrollToIndex({ index: safeIndex, animated: false });
                  setIndex(safeIndex);
                } catch {
                  // ignore if scroll fails (e.g. item not laid out yet)
                }
              }
              pendingIndexRef.current = null;
            }, 80);
          }

          return next;
        });

        if (incoming.length > 0) {
          const lastVerseNum = incoming[incoming.length - 1].verse ?? 0;
          setSkip(lastVerseNum + 1);
        }
      } catch (e: any) {
        console.warn("[gitaVerses] fetch error", e);
        setError("Failed to load verses.");
      } finally {
        setLoading(false);
      }
    },
    [chapterParam, lang, pageSize]
  );

  // reset when chapter changes OR language changes — but DO NOT forcibly reset index (we try to preserve)
  useEffect(() => {
    setVerses([]); // keep emptying the array so UI will show loader while first page fetches
    setSkip(0);
    // DO NOT reset setIndex(0) here — we preserve index and restore after fetch
    setTotalCount(null);
    fetchMore(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterParam, lang]);

  const onEndReached = useCallback(() => {
    if (totalCount !== null && verses.length >= totalCount) return;
    if (loading) return;
    fetchMore(skip, false);
  }, [skip, verses.length, totalCount, loading, fetchMore]);

  const onViewableItemsChanged = useRef((info: any) => {
    const viewableItems = info?.viewableItems;
    if (viewableItems && viewableItems.length > 0) {
      const vIndex = viewableItems[0]?.index ?? 0;
      if (typeof vIndex === "number") {
        setIndex(vIndex);
        indexRef.current = vIndex;
      }
    }
  }).current;

  // unload sound helper
  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (_) {}
      soundRef.current = null;
      playingForRef.current = null;
      setIsPlaying(false);
      setPlaybackPosition(0);
      setPlaybackDuration(0);
    }
  }, []);

  // create / toggle audio and update timers
  const loadAndToggleAudio = useCallback(
    async (uri?: string | null, type?: "learn" | "recite", verseNo?: number) => {
      if (!uri) return;

      if (
        soundRef.current &&
        playingForRef.current &&
        playingForRef.current.type === type &&
        playingForRef.current.verse === verseNo
      ) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if ((status as any)?.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
          return;
        } catch (e) {
          // fallback
        }
      }

      await unloadSound();

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status) => {
            if ((status as any)?.isLoaded) {
              setPlaybackPosition((status as any).positionMillis ?? 0);
              setPlaybackDuration((status as any).durationMillis ?? 0);
              setIsPlaying(Boolean((status as any).isPlaying));
            } else {
              setPlaybackPosition(0);
              setPlaybackDuration(0);
              setIsPlaying(false);
            }
          }
        );

        soundRef.current = sound;
        playingForRef.current = { type: type ?? null, verse: verseNo };
        setIsPlaying(true);

        const st = await sound.getStatusAsync();
        if ((st as any)?.isLoaded) {
          setPlaybackPosition((st as any).positionMillis ?? 0);
          setPlaybackDuration((st as any).durationMillis ?? 0);
          setIsPlaying(Boolean((st as any).isPlaying));
        }
      } catch (e) {
        console.warn("[gitaVerses] audio load failed", e);
      }
    },
    [unloadSound]
  );

  const renderVerse = useCallback(
    ({ item, index: renderIndex }: { item: Verse; index: number }) => {
      const t =
        item.translations?.find((x) => (x.lang ?? "").toUpperCase() === lang) ??
        item.translations?.[0];

      const isCurrentLearn =
        isPlaying && playingForRef.current?.type === "learn" && playingForRef.current?.verse === item.verse;
      const isCurrentRecite =
        isPlaying && playingForRef.current?.type === "recite" && playingForRef.current?.verse === item.verse;

      return (
        <View style={[styles.pageContainer, { height: SCREEN_HEIGHT }]}>
          <Text style={styles.sanskritText}>{item.sanskrit}</Text>

          <Text style={styles.metaText}>
            Chapter {chapterParam}, {item.verse ?? renderIndex} of {totalCount ?? "—"}
          </Text>

          <Text style={styles.sectionTitle}>Learn2Recite</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => loadAndToggleAudio(item.learn2Recite ?? null, "learn", item.verse)}
            >
              <Text style={styles.iconText}>{isCurrentLearn ? "⏸" : "▶"}</Text>
            </TouchableOpacity>
            <Text style={styles.timerText}>
              {isCurrentLearn ? `${formatTime(playbackPosition)} / ${formatTime(playbackDuration)}` : `0:00 / 0:00`}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Narration</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => loadAndToggleAudio(t?.audioUrl ?? null, "recite", item.verse)}
            >
              <Text style={styles.iconText}>{isCurrentRecite ? "⏸" : "▶"}</Text>
            </TouchableOpacity>
            <Text style={styles.timerText}>
              {isCurrentRecite ? `${formatTime(playbackPosition)} / ${formatTime(playbackDuration)}` : `0:00 / 0:00`}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Translation</Text>
          <View style={styles.translationBox}>
            <Text>{t?.text ?? "No translation available."}</Text>
          </View>
        </View>
      );
    },
    [lang, totalCount, chapterParam, isPlaying, playbackPosition, playbackDuration, loadAndToggleAudio]
  );

  const keyExtractor = useCallback((item: Verse, idx: number) => String(item.id ?? item.verse ?? idx), []);

  const getItemLayout = useCallback((data: any, idx: number) => {
    return { length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * idx, index: idx };
  }, []);

  const goToNext = useCallback(() => {
    const nextIndex = index + 1;
    if (nextIndex < verses.length) {
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setIndex(nextIndex);
    } else if (totalCount !== null && verses.length < totalCount) {
      fetchMore(skip, false).then(() => {
        setTimeout(() => listRef.current?.scrollToIndex({ index: nextIndex, animated: true }), 200);
      });
    }
  }, [index, verses.length, totalCount, fetchMore, skip]);

  const goToPrev = useCallback(() => {
    if (index <= 0) return;
    const prev = index - 1;
    listRef.current?.scrollToIndex({ index: prev, animated: true });
    setIndex(prev);
  }, [index]);

  useEffect(() => {
    return () => {
      unloadSound();
    };
  }, [unloadSound]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* AppHeader is intentionally commented out if you are using a global header in _layout.tsx */}
      {/* <AppHeader title={`Verses - ${chapterParam ?? ""}`} /> */}

      {/* Back button (visible when the header is not present here) */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          router.back();
        }}
      >
        <Text style={styles.backText}>◀</Text>
      </TouchableOpacity>

      {loading && verses.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error && verses.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: "#c00", marginBottom: 12 }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchMore(0, true)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            ref={(r) => (listRef.current = r as any)}
            data={verses}
            keyExtractor={keyExtractor}
            renderItem={renderVerse}
            pagingEnabled
            snapToInterval={SCREEN_HEIGHT}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            getItemLayout={getItemLayout}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchMore(0, true)} />}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
          />

          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={goToPrev} disabled={index === 0} style={[styles.navBtn, index === 0 && styles.disabled]}>
              <Text style={styles.navText}>Previous</Text>
            </TouchableOpacity>

            <Text style={styles.positionText}>
              {index + 1} of {totalCount ?? verses.length}
            </Text>

            <TouchableOpacity
              onPress={goToNext}
              disabled={totalCount !== null && index + 1 >= (totalCount ?? verses.length)}
              style={[styles.navBtn, totalCount !== null && index + 1 >= (totalCount ?? verses.length) && styles.disabled]}
            >
              <Text style={styles.navText}>Next</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 12,
    left: 8,
    zIndex: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    elevation: 3,
  },
  backText: { fontSize: 16, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  pageContainer: { padding: 18, backgroundColor: "#fff" },
  sanskritText: { fontSize: 22, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  metaText: { color: "#666", marginBottom: 12 },
  sectionTitle: { fontWeight: "700", marginTop: 10, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center" },
  iconButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#eee", alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 18, fontWeight: "700" },
  timerText: { marginLeft: 12, color: "#444", fontSize: 13 },
  translationBox: { backgroundColor: "#fff", padding: 12, borderRadius: 10, marginTop: 6, borderWidth: 1, borderColor: "#eee" },
  controlsRow: { position: "absolute", left: 0, right: 0, bottom: 16, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, alignItems: "center" },
  navBtn: { backgroundColor: "#000", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  disabled: { backgroundColor: "#ccc" },
  navText: { color: "#fff" },
  positionText: { fontWeight: "700" },
  retryBtn: { backgroundColor: "#0a84ff", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff" },
});
