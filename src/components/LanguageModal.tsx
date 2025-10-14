// src/components/LanguageModal.tsx
import { useLanguage } from "@/context/LanguageContext";
import React, { useCallback, useMemo } from "react";
import { FlatList, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type LangItem =
  | string
  | {
      code?: string;
      name?: string;
      flag?: string;
      id?: string;
      [k: string]: any;
    };

type Props = {
  visible: boolean;
  onClose: () => void;
  /** top anchor (header height) so sheet sits below header */
  anchorTop?: number;
};

export default function LanguageModal({ visible, onClose, anchorTop = 0 }: Props): React.ReactElement | null {
  // language context may be undefined if provider not mounted — be defensive.
  const langCtx = (typeof useLanguage === "function" ? useLanguage() : null) as any | null;

  // Accept languages from several fields the app/backends have used.
  const langsAny: LangItem[] | null =
    (langCtx && (langCtx.availableLangs ?? langCtx.langs ?? langCtx.languages ?? null)) ?? null;

  const langs: LangItem[] = Array.isArray(langsAny) && langsAny.length
    ? langsAny
    : [
        { code: "EN", name: "English", flag: "🇬🇧" },
        { code: "HI", name: "हिन्दी", flag: "🇮🇳" },
      ];

  // Compute current code string (defensive)
  const currentCode = useMemo(() => {
    if (!langCtx) return "EN";
    const l = langCtx.lang;
    if (!l) return "EN";
    if (typeof l === "string") return l;
    return l.code ?? l.lang ?? l.name ?? "EN";
  }, [langCtx]);

  const handleSelect = useCallback(
    (code: string) => {
      if (!langCtx) {
        onClose();
        return;
      }
      // call any setter name the app might expose
      if (typeof langCtx.setLangCode === "function") {
        langCtx.setLangCode(code);
      } else if (typeof langCtx.setLang === "function") {
        langCtx.setLang(code);
      } else if (typeof langCtx.setLanguage === "function") {
        langCtx.setLanguage(code);
      } else {
        // last resort attempt to set a field directly (not ideal but safe)
        try {
          if (typeof langCtx.setState === "function") langCtx.setState({ lang: code });
          // else assign (only if object is modifiable)
          else langCtx.lang = code;
        } catch {
          // ignore
        }
      }
      onClose();
    },
    [langCtx, onClose]
  );

  // keyExtractor: ensure unique key for every item
  const keyExtractor = useCallback((item: LangItem, idx: number) => {
    if (typeof item === "string") return `lang-${item}-${idx}`;
    const k = item.code ?? item.lang ?? item.id ?? item.name ?? JSON.stringify(item);
    return `${String(k)}-${idx}`;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: LangItem }) => {
      const code = typeof item === "string" ? item : item.code ?? item.lang ?? item.id ?? "UNK";
      const label = typeof item === "string" ? item : item.name ?? code;
      const flag = typeof item === "object" ? (item.flag ?? "") : "";
      const selected = String(code).toUpperCase() === String(currentCode).toUpperCase();

      return (
        <TouchableOpacity style={styles.row} onPress={() => handleSelect(String(code))}>
          <Text style={[styles.lang, selected ? styles.selected : undefined]}>
            {flag ? `${flag} ` : ""}
            {label}
          </Text>
        </TouchableOpacity>
      );
    },
    [currentCode, handleSelect]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      // Avoid unsupported combo warnings: iOS default presentation will be fine for slide + transparent.
    >
      <SafeAreaView style={styles.overlay}>
        <View style={[styles.sheet, { marginTop: (anchorTop ?? 0) + 8 }]}>
          <Text style={styles.title}>Choose language</Text>

          <FlatList
            data={langs}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContainer}
            // extraData currentCode ensures re-render when selection changes
            extraData={currentCode}
          />

          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "transparent", justifyContent: "flex-start" },
  sheet: {
    alignSelf: "center",
    width: "86%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  listContainer: { paddingBottom: 6 },
  row: { paddingVertical: 10 },
  lang: { fontSize: 16 },
  selected: { color: "#007AFF", fontWeight: "700" },
  close: { marginTop: 6, alignSelf: "flex-end" },
  closeText: { color: "#007AFF", fontWeight: "600" },
});