// app/human-dilemma.tsx
import CollapsibleText from "@/components/CollapsibleText";
import { useLanguage } from '@/context/LanguageContext';
import { Audio, ResizeMode, Video } from "expo-av";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type DilemmaItem = { label: string; id: string };

type Verse = {
  chapter?: number;
  shloka?: number;
  sanskrit?: string;
  verse?: string | number;
  recite?: string;
  learn2recite?: string;
  hindiNarration?: string;
  narration?: string;
};

type DilemmaDetail = {
  text?: string;
  textEN?: string;
  audioUrl?: string;
  video?: string;
  videoUrl?: string;
  dilema?: string;
  titleEN?: string;
  verses?: Verse[];
};

export default function HumanDilemmaScreen(): React.ReactElement {
  // const { lang } = useLanguage();
  // const langCode = (lang ?? "EN").toString().toUpperCase();
  const { lang, langName } = useLanguage();
  const langCode = (lang ?? "EN").toString().toUpperCase();


  const [list, setList] = useState<DilemmaItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DilemmaDetail | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedVerseIdx, setExpandedVerseIdx] = useState<number | null>(null);

  // audio
  const soundRef = useRef<Audio.Sound | null>(null);
  const playingForRef = useRef<
    { id?: string; type?: "main" | "recite" | "learn" | "hindi" | "narration"; verseIndex?: number } | null
  >(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(0);

  // fetch list
  const fetchList = useCallback(async () => {
    try {
      const url = `https://eq21.co.in/_functions/dilemmaList?lang=${encodeURIComponent(langCode)}`;
      console.log("[dilemma] fetch list", url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const normalized: DilemmaItem[] = Array.isArray(json)
        ? json.map((it: any) => ({ id: String(it.id ?? ""), label: String(it.label ?? it.name ?? "") }))
        : [];
      setList(normalized);
      setSelectedId((prev) => {
        if (prev && normalized.some((n) => n.id === prev)) return prev;
        return normalized.length > 0 ? normalized[Math.floor(Math.random() * normalized.length)].id : null;
      });
    } catch (err) {
      console.warn("[dilemma] list error", err);
    }
  }, [langCode]);

  // fetch detail
  const fetchDetail = useCallback(
    async (id: string | null) => {
      if (!id) {
        setDetail(null);
        return;
      }
      try {
        const url = `https://eq21.co.in/_functions/mydil?id=${encodeURIComponent(id)}&lang=${encodeURIComponent(langCode)}`;
        console.log("[dilemma] fetch detail", url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setDetail(json as DilemmaDetail);
        setExpandedVerseIdx(null); // reset expanded verses on new fetch
      } catch (err) {
        console.warn("[dilemma] detail error", err);
      }
    },
    [langCode]
  );

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  // cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const formatTime = (ms?: number) => {
    if (!ms || ms <= 0) return "0:00";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  };

  const loadAndToggle = useCallback(
    async (
      url?: string | null,
      type: "main" | "recite" | "learn" | "hindi" | "narration" = "main",
      verseIndex?: number
    ) => {
      if (!url) return;

      const cur = playingForRef.current ?? null;
      const sameClip = cur && cur.type === type && cur.verseIndex === verseIndex && cur.id === selectedId;

      if (soundRef.current && sameClip) {
        try {
          const st = await soundRef.current.getStatusAsync();
          if ((st as any)?.isLoaded && (st as any).isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else if ((st as any)?.isLoaded) {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
          return;
        } catch {
          console.warn("[dilemma] toggle failed, reloading");
        }
      }

      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch {}
        soundRef.current = null;
        playingForRef.current = null;
        setIsPlaying(false);
        setPositionMillis(0);
        setDurationMillis(0);
      }

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
          (status) => {
            if ((status as any)?.isLoaded) {
              setPositionMillis((status as any).positionMillis ?? 0);
              setDurationMillis((status as any).durationMillis ?? 0);
              setIsPlaying(Boolean((status as any).isPlaying));
            }
          }
        );
        soundRef.current = sound;
        playingForRef.current = { id: selectedId ?? undefined, type, verseIndex };
      } catch (e) {
        console.warn("[dilemma] audio load error", e);
      }
    },
    [selectedId]
  );

  const SelectedPill = () => {
    const current = list.find((l) => l.id === selectedId);
    if (!current) return null;
    return (
      <View style={styles.selectedRow}>
        <View style={styles.selectedPill}>
          <Text style={styles.selectedPillText}>{current.label}</Text>
        </View>
        <TouchableOpacity onPress={() => setPanelOpen((s) => !s)} style={styles.changeBtn}>
          <Text style={styles.changeBtnText}>{panelOpen ? "▲" : "▼"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const ExpandedGrid = () => {
    if (!panelOpen) return null;
    return (
      <View style={styles.grid}>
        {list.map((item) => {
          const active = item.id === selectedId;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                setSelectedId(item.id);
                setPanelOpen(false);
              }}
              style={[styles.gridItem, active && styles.itemActive]}
            >
              <Text style={[styles.itemText, active && styles.itemTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Human Dilemmas</Text>
      <SelectedPill />
      <ExpandedGrid />

      {detail?.video ? (
        <View style={{ marginTop: 12 }}>
          <Video
            source={{ uri: detail.video }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            isMuted={true}
          />
        </View>
      ) : null}

      {/* Collapsible main text (6 lines collapsed) */}
{detail?.text ? (
  <CollapsibleText
    key={langCode + (selectedId ?? "") + "-local"}
    text={detail.text}
    numberOfLines={6}
    readMoreText="...more"
    showLessText="...less"
    threshold={120}
    textStyle={styles.text}
  />
) : null}

{detail?.textEN ? (
  <CollapsibleText
    key={langCode + (selectedId ?? "") + "-en"}
    text={detail.textEN}
    numberOfLines={6}
    readMoreText="...more"
    showLessText="...less"
    threshold={120}
    textStyle={[styles.text, { marginTop: 12, color: "#555" }]}
  />
) : null}
      
      {detail?.audioUrl ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: "700", marginBottom: 8 }}>Audio</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => loadAndToggle(detail.audioUrl ?? null, "main")}
              style={styles.playBtn}
              accessibilityLabel="Main audio"
            >
              <Text style={styles.playBtnText}>
                {playingForRef.current?.type === "main" && isPlaying ? "⏸" : "▶"}
              </Text>
            </TouchableOpacity>
            <Text style={{ marginLeft: 12 }}>
              {playingForRef.current?.type === "main"
                ? `${formatTime(positionMillis)} / ${formatTime(durationMillis)}`
                : "0:00 / 0:00"}
            </Text>
          </View>
        </View>
      ) : null}

      {Array.isArray(detail?.verses) && detail!.verses!.length > 0 ? (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: "700", marginBottom: 8 }}>Verses</Text>
          {detail!.verses!.map((vv, idx) => {
            const expanded = expandedVerseIdx === idx;
            return (
              <TouchableOpacity
                key={String(vv.verse ?? idx)}
                activeOpacity={0.9}
                onPress={() => {
                  if (expanded) return; // keep expanded until another is tapped
                  setExpandedVerseIdx(idx);
                }}
                style={styles.verseCard}
              >
                <Text style={styles.sanskrit}>{vv.sanskrit}</Text>
                {expanded ? (
                  <View style={{ marginTop: 8 }}>
                    <View style={styles.verseControlsRow}>
                      {/* recite */}
                      <View style={styles.playerBlock}>
                        <TouchableOpacity
                          onPress={() => loadAndToggle(vv.recite ?? null, "recite", idx)}
                          style={styles.smallIconBtn}
                          accessibilityLabel="Recite audio"
                        >
                          <Text style={styles.smallIconText}>
                            {playingForRef.current?.type === "recite" &&
                            playingForRef.current?.verseIndex === idx &&
                            isPlaying
                              ? "⏸"
                              : "▶"}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.label}>Recite</Text>
                      </View>

                      {/* learn2recite */}
                      <View style={styles.playerBlock}>
                        <TouchableOpacity
                          onPress={() => loadAndToggle(vv.learn2recite ?? null, "learn", idx)}
                          style={styles.smallIconBtn}
                          accessibilityLabel="Learn audio"
                        >
                          <Text style={styles.smallIconText}>
                            {playingForRef.current?.type === "learn" &&
                            playingForRef.current?.verseIndex === idx &&
                            isPlaying
                              ? "⏸"
                              : "▶"}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.label}>Learn</Text>
                      </View>

                      {/* hindi */}
                      <View style={styles.playerBlock}>
                        <TouchableOpacity
                          onPress={() => loadAndToggle(vv.hindiNarration ?? null, "hindi", idx)}
                          style={styles.smallIconBtn}
                          accessibilityLabel="Hindi narration"
                        >
                          <Text style={styles.smallIconText}>
                            {playingForRef.current?.type === "hindi" &&
                            playingForRef.current?.verseIndex === idx &&
                            isPlaying
                              ? "⏸"
                              : "▶"}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.label}>हिंदी</Text>
                      </View>

                      {/* narration */}
                      <View style={styles.playerBlock}>
                        <TouchableOpacity
                          onPress={() => loadAndToggle(vv.narration ?? null, "narration", idx)}
                          style={styles.smallIconBtn}
                          accessibilityLabel="Narration audio in ${langName}"
                        >
                          <Text style={styles.smallIconText}>
                            {playingForRef.current?.type === "narration" &&
                            playingForRef.current?.verseIndex === idx &&
                            isPlaying
                              ? "⏸"
                              : "▶"}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.label}>{langName}</Text>
                      </View>
                    </View>

                    <Text style={styles.verseTimer}>
                      {playingForRef.current?.verseIndex === idx
                        ? `${formatTime(positionMillis)} / ${formatTime(durationMillis)}`
                        : "0:00 / 0:00"}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: "800", marginBottom: 12 },

  selectedRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  selectedPill: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, backgroundColor: "#fff", marginRight: 8 },
  selectedPillText: { fontWeight: "800", fontSize: 16 },
  changeBtn: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  changeBtnText: { fontSize: 18, fontWeight: "700" },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 12 },
  gridItem: { width: "48%", padding: 14, borderRadius: 10, backgroundColor: "#f5f5f5", marginBottom: 12, alignItems: "center" },
  itemActive: { backgroundColor: "#d0e8ff" },
  itemText: { fontSize: 14, textAlign: "center" },
  itemTextActive: { fontWeight: "bold", color: "#0057b7" },

  video: { width: "100%", height: 200, borderRadius: 8, backgroundColor: "#000", marginTop: 12 },

  text: { fontSize: 15, lineHeight: 22, color: "#333", marginTop: 12 },

  playBtn: { width: 48, height: 48, borderRadius: 10, backgroundColor: "#eee", alignItems: "center", justifyContent: "center" },
  playBtnText: { fontSize: 20, fontWeight: "700" },

  verseCard: { padding: 12, borderRadius: 8, backgroundColor: "#fafafa", marginBottom: 10 },
  sanskrit: { fontWeight: "700", marginBottom: 4 },

  verseControlsRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  playerBlock: { alignItems: "center", marginRight: 14 },
  smallIconBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  smallIconText: { fontSize: 16, fontWeight: "700" },
  label: { fontSize: 12, marginTop: 2, color: "#333" },

  verseTimer: { marginTop: 6, color: "#444" },
});