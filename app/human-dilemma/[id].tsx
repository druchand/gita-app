// app/human-dilemma/[id].tsx
import CollapsibleText from "@/components/CollapsibleText";
import { useLanguage } from "@/context/LanguageContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

// --- simple i18n for static UI strings (fallback to EN) ---
const STRINGS: Record<string, Record<string, string>> = {
  Back: {
    EN: "Back",
    HI: "वापस",
    BN: "পিছনে",
    TA: "பின் செல்ல",
    TE: "వెనుకకు"
  },
  Loading: {
    EN: "Loading…",
    HI: "लोड हो रहा है…",
    BN: "লোড হচ্ছে…",
    TA: "ஏற்றப்படுகிறது…",
    TE: "లోడ్ అవుతోంది…"
  },
  MissingId: {
    EN: "Missing dilemma id.",
    HI: "दुविधा आईडी नहीं मिली।",
    BN: "দ্বিধার আইডি অনুপস্থিত।",
    TA: "இருமனம் ID இல்லை.",
    TE: "సందిగ్ధం ID లేదు."
  },
  FailedToLoad: {
    EN: "Failed to load",
    HI: "लोड करने में विफल",
    BN: "লোড করতে ব্যর্থ",
    TA: "ஏற்ற முடியவில்லை",
    TE: "లోడ్ చేయడం విఫలమైంది"
  },
  Overview: {
    EN: "Overview",
    HI: "संक्षेप",
    BN: "সংক্ষিপ্তসার",
    TA: "சுருக்கம்",
    TE: "సారాంశం"
  },
  English: {
    EN: "English",
    HI: "अंग्रेज़ी",
    BN: "ইংরেজি",
    TA: "ஆங்கிலம்",
    TE: "ఇంగ్లీష్"
  },
  RelevantVerses: {
    EN: "Relevant Gita Verses",
    HI: "प्रासंगिक गीता श्लोक",
    BN: "প্রাসঙ্গিক গীতা শ্লোক",
    TA: "தொடர்புடைய கீதா ச்லோகங்கள்",
    TE: "సంబంధిత గీతా శ్లోకాలు"
  },
  Play: {
    EN: "▶︎ Play",
    HI: "▶︎ चलाएँ",
    BN: "▶︎ চালান",
    TA: "▶︎ இயக்கவும்",
    TE: "▶︎ ప్లే"
  },
  Pause: {
    EN: "⏸ Pause",
    HI: "⏸ रोकें",
    BN: "⏸ বিরতি",
    TA: "⏸ இடைநிறுத்தம்",
    TE: "⏸ విరామం"
  },
  Recite: {
    EN: "Recite",
    HI: "पाठ",
    BN: "পাঠ",
    TA: "பாராயணம்",
    TE: "పఠనం"
  },
  Learn: {
    EN: "Learn",
    HI: "सीखें",
    BN: "শিখুন",
    TA: "கற்பது",
    TE: "నేర్చుకోండి"
  },
  Narration: {
    EN: "Narration",
    HI: "वाचन",
    BN: "বর্ণনা",
    TA: "வாசிப்பு",
    TE: "వివరణ"
  },
  Hindi: {
    EN: "Hindi",
    HI: "हिंदी",
    BN: "হিন্দি",
    TA: "இந்தி",
    TE: "హిందీ"
  },
  Chapter: {
    EN: "Chapter",
    HI: "अध्याय",
    BN: "অধ্যায়",
    TA: "அத்தியாயம்",
    TE: "అధ్యాయం"
  },
  Verse: {
    EN: "Verse",
    HI: "श्लोक",
    BN: "শ্লোক",
    TA: "ச்லோகம்",
    TE: "శ్లోకం"
  },
};
const tt = (k: keyof typeof STRINGS, lang: string | undefined) =>
  STRINGS[k][(lang || "EN").toUpperCase()] || STRINGS[k].EN;

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
          title: String(json.title ?? title ?? "Untitled"),
          summary: pickString(json.summary, summary),
          image: pickString(json.image, image),
          body: pickString(json.text_local, json.body, json.text),
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
  const lastArticleUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!audioUrl) return;
    (async () => {
      try {
        console.debug("[article] replaceAsync with:", audioUrl);
        await articlePlayer?.replaceAsync?.({ uri: audioUrl });
        lastArticleUrlRef.current = audioUrl;
        setALoaded(true);
      } catch (e) { console.debug("[article] replaceAsync error:", e); }
    })();
  }, [audioUrl, articlePlayer]);

  useEffect(() => {
    const s1 = articlePlayer?.addListener?.("statusChange", (s: any) => {
      if (!s) return;
      console.debug(
        "[article] statusChange:",
        JSON.stringify({
          isLoaded: s.isLoaded,
          isPlaying: s.isPlaying,
          pos: s.positionMillis,
          dur: s.durationMillis,
        })
      );
      setALoaded(!!s.isLoaded);
      if (s.isLoaded) {
        setAPos(s.positionMillis ?? 0);
        setADur(s.durationMillis ?? 0);
        setAPlaying(!!s.isPlaying);
      }
    });
    const s2 = articlePlayer?.addListener?.("timeUpdate", (s: any) => {
      console.debug("[article] timeUpdate:", s?.positionMillis, "/", s?.durationMillis);
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
    console.debug("[article] toggle pressed; playing:", aPlaying, "url:", audioUrl);
    try {
      if (audioUrl && lastArticleUrlRef.current !== audioUrl) {
        console.debug("[article] replacing to current url:", audioUrl);
        await articlePlayer?.replaceAsync?.({ uri: audioUrl });
        lastArticleUrlRef.current = audioUrl;
      }
      if (aPlaying) {
        await articlePlayer?.pause?.();
        setAPlaying(false);
      } else {
        await articlePlayer?.play?.();
        setAPlaying(true);
      }
    } catch (e) {
      console.debug("[article] toggle error:", e);
    }
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
  const lastVerseUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const s1 = versesPlayer?.addListener?.("statusChange", (s: any) => {
      if (!s) return;
      console.debug(
        "[verses] statusChange:",
        JSON.stringify({
          isLoaded: s.isLoaded,
          isPlaying: s.isPlaying,
          pos: s.positionMillis,
          dur: s.durationMillis,
        })
      );
      setVLoaded(!!s.isLoaded);
      if (s.isLoaded) {
        setVPos(s.positionMillis ?? 0);
        setVDur(s.durationMillis ?? 0);
        setVPlaying(!!s.isPlaying);
      }
    });
    const s2 = versesPlayer?.addListener?.("timeUpdate", (s: any) => {
      console.debug("[verses] timeUpdate:", s?.positionMillis, "/", s?.durationMillis);
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
      console.debug("[verses] replaceAsync with:", url, " block:", keyForBlock);
      if (keyForBlock && expandedKey !== keyForBlock) {
        await collapseAllVerses();
        setExpandedKey(keyForBlock);
      }
      setCurrentVerseKey(url);
      if (lastVerseUrlRef.current !== url) {
        console.debug("[verses] will replace to new url");
        await versesPlayer?.replaceAsync?.({ uri: url });
        lastVerseUrlRef.current = url;
      } else {
        console.debug("[verses] same url; skipping replace");
      }
      await versesPlayer?.play?.();
    } catch (e) { console.debug("[verses] replace/play error:", e); }
  };

  const toggleVersesAudio = async () => {
    try {
      console.debug("[verses] toggle pressed; playing:", vPlaying, "current:", currentVerseKey);
      if (currentVerseKey && lastVerseUrlRef.current !== currentVerseKey) {
        console.debug("[verses] replacing to current url:", currentVerseKey);
        await versesPlayer?.replaceAsync?.({ uri: currentVerseKey });
        lastVerseUrlRef.current = currentVerseKey;
      }
      if (vPlaying) {
        await versesPlayer?.pause?.();
        setVPlaying(false);
      } else {
        await versesPlayer?.play?.();
        setVPlaying(true);
      }
    } catch (e) {
      console.debug("[verses] toggle error:", e);
    }
  };

  // Guards
  if (!id)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{tt("MissingId", lang)}</Text>
        <Pressable style={styles.cta} onPress={() => router.back()}>
          <Text style={styles.ctaText}>{tt("Back", lang)}</Text>
        </Pressable>
      </View>
    );
  if (state.status === "idle" || state.status === "loading")
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>{tt("Loading", lang)}</Text>
      </View>
    );
  if (state.status === "error")
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{tt("FailedToLoad", lang)}: {state.message}</Text>
        <Pressable style={styles.cta} onPress={() => router.back()}>
          <Text style={styles.ctaText}>{tt("Back", lang)}</Text>
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
        <Text style={styles.ctaText}>{tt("Back", lang)}</Text>
      </Pressable>

      {/* Title row + inline audio control (progress below) */}
      <View style={[styles.row, { justifyContent: "space-between", alignItems: "center" }]}>
        <Text style={styles.title}>{data.title}</Text>

        {data.audioUrl ? (
          <>
            <VideoView
              style={{ position: "absolute", width: 1, height: 1, opacity: 0.01 }}
              player={articlePlayer}
              nativeControls={false}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
            />
            <Pressable
              style={styles.cta}
              onPress={toggleArticleAudio}
            >
              <Text style={styles.ctaText}>{aPlaying ? tt("Pause", lang) : tt("Play", lang)}</Text>
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
          <Text style={styles.sectionTitle}>{tt("Overview", lang)}</Text>
          <CollapsibleText numberOfLines={4} textStyle={styles.body} text={data.body} />
        </View>
      )}

      {/* English (only if provided) */}
      {!!data.bodyEN && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{tt("English", lang)}</Text>
          <CollapsibleText numberOfLines={4} textStyle={styles.body} text={data.bodyEN} />
        </View>
      )}

      {/* Relevant verses */}
      {data.verses && data.verses.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{tt("RelevantVerses", lang)}</Text>

          {/* shared hidden host */}
          <VideoView
            style={{ position: "absolute", width: 1, height: 1, opacity: 0.01 }}
            player={versesPlayer}
            nativeControls={false}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />

          {/* shared progress bar (shows when a verse is selected OR loading) */}
          {currentVerseKey || vLoaded ? (
            <View style={{ marginBottom: 8 }}>
              <ProgressBar pos={vPos} dur={vDur} />
              <View style={[styles.row, { marginTop: 6 }]}>
                <Pressable
                  style={styles.cta}
                  onPress={toggleVersesAudio}
                >
                  <Text style={styles.ctaText}>{vPlaying ? tt("Pause", lang) : tt("Play", lang)}</Text>
                </Pressable>
                <Text style={styles.timeLabel}>
                  {toMMSS(vPos)} / {toMMSS(vDur)}
                </Text>
              </View>
            </View>
          ) : null}

          {data.verses.map((v, idx) => {
            const header = v.chapter && v.verse
              ? `${tt("Chapter", lang)} ${v.chapter}, ${tt("Verse", lang)} ${v.verse}`
              : `${tt("Verse", lang)} ${idx + 1}`;
            const blockKey = `${v.chapter ?? "x"}-${v.verse ?? idx}`;

            const items: { key: string; url?: string; title: string }[] = [
              { key: "recite", url: v.recite, title: tt("Recite", lang) },
              { key: "learn2recite", url: v.learn2recite, title: tt("Learn", lang) },
              { key: "narration", url: v.narration, title: tt("Narration", lang) },
              { key: "hindiNarration", url: v.hindiNarration, title: tt("Hindi", lang) },
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
                            onPress={async () => {
                              if (currentVerseKey === it.url) {
                                await toggleVersesAudio();
                              } else {
                                await playVerseUrl(it.url, blockKey);
                              }
                            }}
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