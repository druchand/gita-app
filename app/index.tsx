// app/index.tsx
import { Link } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index(): React.ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 16) },
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Home route OK</Text>
        <Text style={styles.note}>
          This is a lightweight home screen. Use the buttons below to open the
          media demo (expo-video + expo-audio) and the Gita flows.
        </Text>

        <View style={styles.row}>
          <Link href="/mediaDemo" asChild>
            <TouchableOpacity style={styles.btn} accessibilityRole="button" accessibilityLabel="Open Media Demo">
              <Text style={styles.btnText}>Open Media Demo</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/gitaHome" asChild>
            <TouchableOpacity style={styles.btn} accessibilityRole="button" accessibilityLabel="Open Gita Home">
              <Text style={styles.btnText}>Open Gita Home</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.row}>
          <Link href="/gitaVerses" asChild>
            <TouchableOpacity style={styles.btn} accessibilityRole="button" accessibilityLabel="Open Verses List">
              <Text style={styles.btnText}>Open Verses</Text>
            </TouchableOpacity>
          </Link>

          {/* sample chapter route; change id if your data differs */}
          <Link href="/chapter/1" asChild>
            <TouchableOpacity style={styles.btn} accessibilityRole="button" accessibilityLabel="Open Chapter 1">
              <Text style={styles.btnText}>Open Chapter 1</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5ea",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#e8f0ff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#a7c2ff",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2546bd",
  },
});