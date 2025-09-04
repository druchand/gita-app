import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useLanguage } from "./context/LanguageContext";

export default function HomeScreen() {
  const router = useRouter();
  const { selectedLang } = useLanguage();
  const [languages, setLanguages] = useState<any[]>([]);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await fetch("https://www.eq21.co.in/_functions/langs");
        const data = await res.json();
        setLanguages(data);
      } catch (err) {
        console.error("Error fetching languages:", err);
      }
    };
    fetchLanguages();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📖 Bhagavad Gita</Text>

      <Image
        source={{ uri: "https://via.placeholder.com/300x150.png?text=Bhagavad+Gita" }}
        style={styles.image}
      />

      <Text style={styles.about}>
        The Bhagavad Gita is one of the greatest spiritual scriptures of the world.{"\n"}
        (This is placeholder text – will be replaced with backend content)
      </Text>

      <View style={styles.grid}>
        {Array.from({ length: 18 }, (_, i) => i + 1).map((chapter) => (
          <TouchableOpacity
            key={chapter}
            style={styles.chapterButton}
            onPress={() => router.push(`/chapter/${chapter}`)}
          >
            <Text style={styles.chapterText}>Chapter {chapter}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  image: { width: 300, height: 150, marginBottom: 16 },
  about: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  chapterButton: {
    width: "40%",
    padding: 12,
    margin: 8,
    backgroundColor: "#1E90FF",
    borderRadius: 8,
    alignItems: "center",
  },
  chapterText: { color: "white", fontWeight: "bold" },
});
