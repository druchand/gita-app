import { useLanguage } from "@/context/LanguageContext";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function LanguageModal(): React.ReactElement | null {
  const { availableLangs, closeLanguage, selectLanguage, loading, isLanguageOpen } =
    useLanguage();

  return (
    <Modal
      visible={isLanguageOpen}
      animationType="fade"
      transparent
      onRequestClose={closeLanguage}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Select Language</Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator />
            </View>
          ) : (
            <FlatList
              data={availableLangs}
              keyExtractor={(item) => item._id ?? item.code}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.langRow}
                  onPress={() => {
                    selectLanguage(item.code);
                    closeLanguage();
                  }}
                >
                  <Text style={styles.langName}>
                    {item.name} ({item.code})
                  </Text>
                </Pressable>
              )}
            />
          )}

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.secondary]} onPress={closeLanguage}>
              <Text style={styles.btnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 520,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "700" },
  center: { paddingVertical: 16, alignItems: "center" },
  langRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#f6f6f6",
  },
  langName: { fontSize: 16 },
  actions: { flexDirection: "row", justifyContent: "flex-end" },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  secondary: { backgroundColor: "#eee" },
  btnText: { fontWeight: "600" },
});