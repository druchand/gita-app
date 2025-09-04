import { Audio, ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import CollapsibleText from "../components/CollapsibleText";
import { useLanguage } from "../context/LanguageContext";
import { chapterVideoRemote } from "../data/chapterBackgrounds";
const { id } = useLocalSearchParams();
console.log("✅ ChapterScreen mounted, id:", id);


export default function ChapterScreen() {
  const { id } = useLocalSearchParams();
  const { selectedLang } = useLanguage();
  const router = useRouter();

  const [chapterData, setChapterData] = useState<any>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // 🔊 play audio
  const playAudio = async (uri: string) => {
    if (!uri) {
  console.warn("⚠️ No audio URI provided");
  
  return;
}

    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      await newSound.playAsync();
    } catch (err) {
      console.error("Error playing audio:", err);
    }
  };

  // cleanup
  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  // fetch chapter data
  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const res = await fetch(
          `https://www.eq21.co.in/_functions/shlokas/${id}/0/${selectedLang}`
        );
        const data = await res.json();
        setChapterData(data);
      } catch (err) {
        console.error("Error fetching chapter:", err);
      }
    };
    fetchChapter();
  }, [id, selectedLang]);

  const background = chapterVideoRemote[id as string];

  return (
    <View style={styles.container}>
      {background ? (
  <Video
    source={{ uri: background }}
    style={StyleSheet.absoluteFill}
    resizeMode={ResizeMode.COVER}
    isLooping
    shouldPlay
    isMuted
  />
) : (
  <View style={[StyleSheet.absoluteFill, { backgroundColor: "black" }]} />
)}



      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>
          अध्याय {id} | {chapterData?.title || ""}
        </Text>

        <TouchableOpacity
          style={styles.audioButton}
          onPress={() => playAudio(chapterData?.audioUrl)}
        >
          <Text style={styles.audioButtonText}>▶ Play Summary</Text>
        </TouchableOpacity>

        <CollapsibleText text={chapterData?.summary || ""} />

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push(`/chapter/gitaVerses?id=${id}`)}
        >
          <Text style={styles.linkText}>Go to Verses</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  scrollContainer: { padding: 16, paddingTop: 80 },
  title: { fontSize: 22, fontWeight: "bold", color: "white", marginBottom: 16, textAlign: "center" },
  audioButton: { backgroundColor: "rgba(0,0,0,0.6)", padding: 12, borderRadius: 8, marginBottom: 16 },
  audioButtonText: { color: "white", fontWeight: "600", textAlign: "center" },
  linkButton: { marginTop: 16, padding: 12, backgroundColor: "rgba(0,0,255,0.6)", borderRadius: 8 },
  linkText: { color: "white", fontWeight: "bold", textAlign: "center" },
});
