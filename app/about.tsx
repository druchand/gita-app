// app/about.tsx
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function About() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* <AppHeader title="About" /> */}
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.h1}>About</Text>
          <Text style={styles.p}>
            This is the About page. Put project info, credits, version, links, or privacy notes here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 10 },
  h1: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  p: { fontSize: 15, color: "#333" },
});
