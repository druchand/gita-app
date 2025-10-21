// app/human-dilemma/[id].tsx
import CollapsibleText from "@/components/CollapsibleText";
import { useLanguage } from "@/context/LanguageContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Verse = {
  chapter?: number;
  verse?: number;
  sanskrit?: string;
  recite?: string;
  learn2recite?: string;
  narration?: string;
  hindiNarration?: string;
};

type Detail = {
  id: string;
  title: string;
  summary?: string;
  image?: string;
  body?: string;   // requested-language text
  bodyEN?: string; // English text if provided
  audioUrl?: string;
  videoUrl?: string;
  verses?: Verse[];
};

function pickString(...vals: unknown[]): string | undefined {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

export default function HumanDilemmaDetail(): React.ReactElement {
  const { id, title, summary, image } = useLocalSearchParams() as Record<string, string | undefined>;
  const { lang } = useLanguage();
  const router = useRouter();

  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; data: Detail }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const url = useMemo(() => {
    const u = new URL("https://eq21.co.in/_functions/mydil");
    if (id) u.searchParams.set("id", String(id));
    if (lang) u.searchParams.set("lang", lang);
    return u.toString();
  }, [id, lang]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        setState({ status: "loading" });
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const mapped: Detail = {
          id: String(json.id ?? id),
          title: String(title ?? json.title ?? "Untitled"),
          summary: pickString(json.summary, summary),
          image: pickString(json.image, image),
          body: pickString(json.text, json.body, json.text_local),
          bodyEN: pickString(json.textEn, json.text_en),
          audioUrl: pickString(json.audioUrl),
          videoUrl: pickString(json.videoUrl, json.video),
          verses: Array.isArray(json.verses)
            ? json.verses.map((v: any, i: number) => ({
                chapter: typeof v.chapter === "number" ? v.chapter : undefined,
                verse: typeof v.verse === "number" ? v.verse : undefined,
                sanskrit: pickString(v.sanskrit),
                recite: pickString(v.recite),
                learn2recite: pickString(v.learn2recite),
                narration: pickString(v.narration),
                hindiNarration: pickString(v.hindiNarration),
              }))
            : [],
        };

        if (!alive) return;
        setState({ status: "ready", data: mapped });
      } catch (e: any) {
        if (!alive) return;
        if (title || summary || image) {
          setState({
            status: "ready",
            data: {
              id: String(id),
              title: String(title ?? "Untitled"),
              summary,
              image,
              body: "",
              bodyEN: undefined,
              verses: [],
            },
          });
        } else {
          setState({ status: "error", message: e?.message ?? "Fetch failed" });
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, title, summary, image, url]);

  // ---------- MEDIA (expo-video only) ----------
  // Derive safe media inputs from state (so effects can run before data is 'ready')
  const audioUrl = state.status === "ready" ? state.data.audioUrl : undefined;
  const videoUrl = state.status === "ready" ? state.data.videoUrl : undefined;
  const versesArr = state.status === "ready" ? state.data.verses ?? [] : [];

  // Title-row AUDIO (hidden host)
  const articlePlayer: any = useVideoPlayer({ uri: "" }, (p) => {
    p.loop = false;
    p.muted = false;
  });
  const [aLoaded, setALoaded] = useState(false);
  const [aPlaying, setAPlaying] = useState(false);
  const [aPos, setAPos] = useState(0);
  const [aDur, setADur] = useState(0);

  useEffect(() => {
    if (!audioUrl) return;
    (async () => {
      try {
        await articlePlayer?.replaceAsync?.({ uri: audioUrl });
      } catch {}
    })();
  }, [audioUrl, articlePlayer]);

  useEffect(() => {
    const s1 = articlePlayer?.addListener?.("statusChange", (s: any) => {
      if (!s) return;
      setALoaded(!!s.isLoaded);
      if (s.isLoaded) {
        setAPos(s.positionMillis ?? 0);
        setADur(s.durationMillis ?? 0);
        setAPlaying(!!s.isPlaying);
      }
    });
    const s2 = articlePlayer?.addListener?.("timeUpdate", (s: any) => {
      if (!s) return;
      setAPos(s.positionMillis ?? 0);
      setADur(s.durationMillis ?? 0);
    });
    return () => {
      s1?.remove?.();
      s2?.remove?.();
    };
  }, [articlePlayer]);

  const toggleArticleAudio = async () => {
    try {
      if (!aLoaded) return;
      if (aPlaying) await articlePlayer?.pause?.();
      else await articlePlayer?.play?.();
    } catch {}
  };

  // VIDEO (autoplay, loop, no controls/labels)
  const videoPlayer: any = useVideoPlayer({ uri: "" }, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (!videoUrl) return;
    (async () => {
      try {
        await videoPlayer?.replaceAsync?.({ uri: videoUrl });
        await videoPlayer?.play?.(); // autoplay
      } catch {}
    })();
  }, [videoUrl, videoPlayer]);

  // VERSES: shared player + collapsible
  const versesPlayer: any = useVideoPlayer({ uri: "" }, (p) => {
    p.loop = false;
    p.muted = false;
  });
  const [vLoaded, setVLoaded] = useState(false);
  const [vPlaying, setVPlaying] = useState(false);
  const [vPos, setVPos] = useState(0);
  const [vDur, setVDur] = useState(0);
  const [currentVerseKey, setCurrentVerseKey] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    const s1 = versesPlayer?.addListener?.("statusChange", (s: any) => {
      if (!s) return;
      setVLoaded(!!s.isLoaded);
      if (s.isLoaded) {
        setVPos(s.positionMillis ?? 0);
        setVDur(s.durationMillis ?? 0);
        setVPlaying(!!s.isPlaying);
      }
    });
    const s2 = versesPlayer?.addListener?.("timeUpdate", (s: any) => {
      if (!s) return;
      setVPos(s.positionMillis ?? 0);
      setVDur(s.durationMillis ?? 0);
    });
    return () => {
      s1?.remove?.();
      s2?.remove?.();
    };
  }, [versesPlayer]);

  const collapseAllVerses = async () => {
    setExpandedKey(null);
    setCurrentVerseKey(null);
    try {
      await versesPlayer?.pause?.();
    } catch {}
  };

  const onToggleVerseBlock = async (key: string) => {
    if (expandedKey === key) {
      await collapseAllVerses();
    } else {
      await collapseAllVerses();
      setExpandedKey(key);
    }
  };

  const playVerseUrl = async (url?: string, keyForBlock?: string) => {
    if (!url) return;
    try {
      if (keyForBlock && expandedKey !== keyForBlock) {
        await collapseAllVerses();
        setExpandedKey(keyForBlock);
      }
      setCurrentVerseKey(url);
      await versesPlayer?.replaceAsync?.({ uri: url });
      await versesPlayer?.play?.();
    } catch {}
  };

  const toggleVersesAudio = async () => {
    try {
      if (!vLoaded) return;
      if (vPlaying) await versesPlayer?.pause?.();
      else await versesPlayer?.play?.();
    } catch {}
  };

  // Guards
  if (!id)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Missing dilemma id.</Text>
        <Pressable style={styles.cta} onPress={() => router.back()}>
          <Text style={styles.ctaText}>Back</Text>
        </Pressable>
      </View>
    );
  if (state.status === "idle" || state.status === "loading")
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Loading…</Text>
      </View>
    );
  if (state.status === "error")
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Failed to load: {state.message}</Text>
        <Pressable style={styles.cta} onPress={() => router.back()}>
          <Text style={styles.ctaText}>Back</Text>
        </Pressable>
      </View>
    );

  const { data } = state as { status: "ready"; data: Detail };


  // UI helpers
  const toMMSS = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const ProgressBar = ({ pos, dur }: { pos: number; dur: number }) => {
    const pct = dur > 0 ? Math.min(1, pos / dur) : 0;
    return (
      <View style={styles.progressWrap}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>
    );
  };

  // Render
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={[styles.cta, { alignSelf: "flex-start" }]} onPress={() => router.back()}>
        <Text style={styles.ctaText}>Back</Text>
      </Pressable>

      {/* Title row + inline audio control (progress below) */}
      <View style={[styles.row, { justifyContent: "space-between", alignItems: "center" }]}>
        <Text style={styles.title}>{data.title}</Text>

        {data.audioUrl ? (
          <>
            <VideoView
              style={{ width: 0, height: 0 }}
              player={articlePlayer}
              nativeControls={false}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
            />
            <Pressable
              style={[styles.cta, !aLoaded && styles.ctaDisabled]}
              onPress={toggleArticleAudio}
              disabled={!aLoaded}
            >
              <Text style={styles.ctaText}>{aPlaying ? "⏸ Pause" : "▶︎ Play"}</Text>
            </Pressable>
          </>
        ) : null}
      </View>
      {data.audioUrl ? (
        <View style={{ marginTop: 8 }}>
          <ProgressBar pos={aPos} dur={aDur} />
          <Text style={styles.timeLabel}>
            {toMMSS(aPos)} / {toMMSS(aDur)}
          </Text>
        </View>
      ) : null}

      {!!data.image && (
        <Image
          source={{ uri: data.image }}
          style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 12, marginVertical: 12 }}
          resizeMode="cover"
        />
      )}

      {/* Video – autoplay + loop, no title/controls/progress */}
      {data.videoUrl ? (
        <View style={{ marginBottom: 12 }}>
          <VideoView
            style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 8, backgroundColor: "#000" }}
            player={videoPlayer}
            nativeControls={false}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            contentFit="contain"
          />
        </View>
      ) : null}

      {/* Overview (requested lang) */}
      {!!data.body && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <CollapsibleText numberOfLines={4} textStyle={styles.body} text={data.body} />
        </View>
      )}

      {/* English (only if provided) */}
      {!!data.bodyEN && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>English</Text>
          <CollapsibleText numberOfLines={4} textStyle={styles.body} text={data.bodyEN} />
        </View>
      )}

      {/* Relevant verses */}
      {data.verses && data.verses.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Relevant Gita verses</Text>

          {/* shared hidden host */}
          <VideoView
            style={{ width: 0, height: 0 }}
            player={versesPlayer}
            nativeControls={false}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />

          {/* shared progress bar (only when a verse is active) */}
          {currentVerseKey ? (
            <View style={{ marginBottom: 8 }}>
              <ProgressBar pos={vPos} dur={vDur} />
              <View style={[styles.row, { marginTop: 6 }]}>
                <Pressable
                  style={[styles.cta, !vLoaded && styles.ctaDisabled]}
                  onPress={toggleVersesAudio}
                  disabled={!vLoaded}
                >
                  <Text style={styles.ctaText}>{vPlaying ? "⏸ Pause" : "▶︎ Play"}</Text>
                </Pressable>
                <Text style={styles.timeLabel}>
                  {toMMSS(vPos)} / {toMMSS(vDur)}
                </Text>
              </View>
            </View>
          ) : null}

          {data.verses.map((v, idx) => {
            const header = v.chapter && v.verse ? `Chapter ${v.chapter}, Verse ${v.verse}` : `Verse ${idx + 1}`;
            const blockKey = `${v.chapter ?? "x"}-${v.verse ?? idx}`;

            const items: { key: string; url?: string; title: string }[] = [
              { key: "recite", url: v.recite, title: "Recite" },
              { key: "learn2recite", url: v.learn2recite, title: "Learn" },
              { key: "narration", url: v.narration, title: "Narration" },
              { key: "hindiNarration", url: v.hindiNarration, title: "Hindi" },
            ];

            const expanded = expandedKey === blockKey;

            return (
              <View key={blockKey} style={styles.verseBlock}>
                <Pressable onPress={() => onToggleVerseBlock(blockKey)} style={{ paddingVertical: 4 }}>
                  <Text style={styles.verseHeader}>{header}</Text>
                  {!!v.sanskrit && <Text style={styles.sanskrit}>{v.sanskrit}</Text>}
                </Pressable>

                {expanded ? (
                  <View style={{ gap: 8 }}>
                    {/* One wrap row: icon + label for each option */}
                    <View style={[styles.row, { flexWrap: "wrap", gap: 10 }]}>
                      {items.map((it) =>
                        it.url ? (
                          <Pressable
                            key={it.key}
                            style={[
                              styles.pillRow,
                              currentVerseKey === it.url ? styles.pillActive : null,
                            ]}
                            onPress={() => playVerseUrl(it.url, blockKey)}
                          >
                            <Text
                              style={[
                                styles.pillIcon,
                                currentVerseKey === it.url ? styles.pillTextActive : null,
                              ]}
                            >
                              {currentVerseKey === it.url ? "⏸" : "▶︎"}
                            </Text>
                            <Text
                              style={[
                                styles.pillLabel,
                                currentVerseKey === it.url ? styles.pillTextActive : null,
                              ]}
                            >
                              {it.title}
                            </Text>
                          </Pressable>
                        ) : null
                      )}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  error: { color: "#b00020" },

  title: { fontSize: 22, fontWeight: "700" },
  summary: { fontSize: 16, color: "#444" },
  body: { fontSize: 16, lineHeight: 22 },

  card: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    gap: 10,
  },

  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },

  row: { flexDirection: "row", alignItems: "center", gap: 12 },

  cta: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#0a84ff",
    alignSelf: "flex-start",
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: "#fff", fontWeight: "600" },

  progressWrap: {
    height: 6,
    backgroundColor: "#e6e6e6",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#0a84ff" },
  timeLabel: { color: "#444" },

  verseBlock: { gap: 6, marginTop: 8 },
  verseHeader: { fontWeight: "700" },
  sanskrit: { fontSize: 15, lineHeight: 22 },

  // Icon + label pill
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pillIcon: { fontSize: 14, marginRight: 6, color: "#333", fontWeight: "700" },
  pillLabel: { color: "#333", fontWeight: "600" },
  pillActive: { backgroundColor: "#0a84ff", borderColor: "#0a84ff" },
  pillTextActive: { color: "#fff" },
});