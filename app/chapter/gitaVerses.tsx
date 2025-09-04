import { Audio, ResizeMode, Video } from "expo-av";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import CollapsibleText from "../components/CollapsibleText";
import { useLanguage } from "../context/LanguageContext";
import { chapterVideoRemote } from "../data/chapterBackgrounds";
const { id } = useLocalSearchParams();
console.log("✅ GitaVersesScreen mounted, id:", id);


export default function GitaVersesScreen() {
  const { id } = useLocalSearchParams();
  const { selectedLang } = useLanguage();

  const [verses, setVerses] = useState<any[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // play audio
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
      console.error("Error playing verse audio:", err);
    }
  };

  // cleanup
  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  // fetch verses
  useEffect(() => {
    const fetchVerses = async () => {
      try {
        const res = await fetch(
          `https://www.eq21.co.in/_functions/shlokas/${id}/all/${selectedLang}`
        );
        const data = await res.json();
        setVerses(data.verses || []);
      } catch (err) {
        console.error("Error fetching verses:", err);
      }
    };
    fetchVerses();
  }, [id, selectedLang]);

  const currentVerse = verses[currentVerseIndex];
  const background = chapterVideoRemote[id as string];

  const nextVerse = () => {
    if (currentVerseIndex < verses.length - 1) {
      setCurrentVerseIndex(currentVerseIndex + 1);
    }
  };

  const prevVerse = () => {
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(currentVerseIndex - 1);
    }
  };

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
        <Text style={styles.header}>
          अध्याय {id} | श्लोक {currentVerse?.verse}
        </Text>

        <TouchableOpacity
          style={styles.audioButton}
          onPress={() => playAudio(currentVerse?.audioUrl)}
        >
          <Text style={styles.audioButtonText}>▶ Play Narration</Text>
        </TouchableOpacity>

        <CollapsibleText text={currentVerse?.translation || ""} />

        <View style={styles.navButtons}>
          <TouchableOpacity onPress={prevVerse} disabled={currentVerseIndex === 0}>
            <Text style={[styles.navText, currentVerseIndex === 0 && styles.disabled]}>
              ◀ Previous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextVerse} disabled={currentVerseIndex === verses.length - 1}>
            <Text
              style={[
                styles.navText,
                currentVerseIndex === verses.length - 1 && styles.disabled,
              ]}
            >
              Next ▶
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  scrollContainer: { padding: 16, paddingTop: 80 },
  header: { fontSize: 20, fontWeight: "bold", color: "white", marginBottom: 16, textAlign: "center" },
  audioButton: { backgroundColor: "rgba(0,0,0,0.6)", padding: 12, borderRadius: 8, marginBottom: 16 },
  audioButtonText: { color: "white", fontWeight: "600", textAlign: "center" },
  navButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  navText: { fontSize: 16, fontWeight: "bold", color: "white" },
  disabled: { color: "gray" },
});
