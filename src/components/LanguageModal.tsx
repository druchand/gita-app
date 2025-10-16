// src/components/LanguageModal.tsx
import { useLanguage } from "@/context/LanguageContext";
import React from "react";
import { FlatList, ListRenderItem, Modal, Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Defensive type for language items: supports { code }, { id }, or { _id }.
 * This prevents FlatList/typing mismatch if different parts of app use different keys.
 */
type AnyLangItem = { _id?: string; code?: string; id?: string; name?: string };

const LanguageModal: React.FC = () => {
  const { availableLangs, isOpen, closeLanguage, setLangCode } = useLanguage();

  const renderItem: ListRenderItem<AnyLangItem> = ({ item }) => {
    const code = item.code ?? item.id ?? item._id ?? "";
    return (
      <Pressable
        onPress={() => {
          setLangCode(code);
        }}
        style={styles.item}
        accessibilityRole="button"
      >
        <Text style={styles.itemText}>{item.name ?? code}</Text>
      </Pressable>
    );
  };

  return (
    <Modal visible={!!isOpen} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>Choose language</Text>

          <FlatList<AnyLangItem>
            data={(availableLangs ?? []) as AnyLangItem[]}
            keyExtractor={(i) => i._id ?? i.code ?? i.id ?? "unknown"}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
          />

          <Pressable onPress={closeLanguage} style={styles.closeButton} accessibilityLabel="Close language selector" accessibilityRole="button">
            <Text>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default LanguageModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  item: { paddingVertical: 12 },
  itemText: { fontSize: 16 },
  closeButton: { marginTop: 12, alignSelf: "flex-end" },
});