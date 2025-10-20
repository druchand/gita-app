// src/context/LanguageContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type LangItem = { _id?: string; code: string; name: string };

export type LanguageContextValue = {
  isOpen: boolean;
  langCode: string;
  lang: string;
  availableLangs: LangItem[];
  openLanguage: () => void;
  closeLanguage: () => void;
  setLangCode: (code: string) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [langCode, setLangCodeState] = useState("EN");
  const [availableLangs, setAvailableLangs] = useState<LangItem[]>([]);

  useEffect(() => {
    setAvailableLangs((prev) => prev.length ? prev : [{ code: "EN", name: "English" }, { code: "HI", name: "Hindi" }]);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const setLang = useCallback((code: string) => setLangCodeState(code), []);

  const value = useMemo(() => ({ isOpen, langCode, lang: langCode, availableLangs, openLanguage: open, closeLanguage: close, setLangCode: setLang }), [isOpen, langCode, availableLangs, open, close, setLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <Modal visible={isOpen} animationType="slide" transparent onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>Choose language</Text>
            <FlatList
              data={availableLangs}
              keyExtractor={(it) => it.code}
              renderItem={({ item }) => (
                <Pressable style={styles.langItem} onPress={() => { setLang(item.code); close(); }}>
                  <Text style={styles.langText}>{item.name} ({item.code})</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666' }}>No languages</Text>}
            />
            <View style={styles.actions}>
              <Pressable style={styles.btn} onPress={close}><Text style={styles.btnText}>Close</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  langItem: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  langText: { fontSize: 16 },
  actions: { marginTop: 12, alignItems: 'center' },
  btn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#3b82f6', borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
});