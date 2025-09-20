// components/LanguageModal.tsx
import { useLanguage } from '@/context/LanguageContext';
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function LanguageModal({ visible, onClose }: Props) {
  const { languages, loadingLanguages, lang, setLang } = useLanguage();

  const select = (id: string) => {
    setLang(id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose} // Android back
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.card}>
          <Text style={styles.title}>Select language</Text>

          {loadingLanguages ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={{ marginLeft: 8 }}>Loading languages…</Text>
            </View>
          ) : (
            <FlatList
              data={languages}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => select(item.id)}
                  style={[styles.row, item.id === lang ? styles.active : undefined]}
                >
                  <Text style={styles.rowText}>{item.name}</Text>
                </Pressable>
              )}
              style={{ width: "100%" }}
            />
          )}

          <Pressable onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center" },
  card: { width: "92%", maxHeight: "76%", backgroundColor: "#fff", borderRadius: 12, padding: 14 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  row: { paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: "#eee" },
  active: { backgroundColor: "#f0f8ff" },
  rowText: { fontSize: 16 },
  close: { marginTop: 12, alignSelf: "flex-end" },
  closeText: { color: "#007AFF", fontWeight: "600" },
  loadingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
});
