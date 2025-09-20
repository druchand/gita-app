// components/DropdownPicker.tsx
import { useLanguage } from '@/context/LanguageContext';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type LangItem = { id?: string; name?: string; code?: string };

const DropdownPicker: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LangItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLangs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('https://eq21.co.in/_functions/langs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // expected format: array of { id: 'EN', name: 'English' } or similar
      if (Array.isArray(json)) {
        setItems(json as LangItem[]);
      } else {
        // if wrapped object, try to extract
        const arr = Array.isArray((json as any).data) ? (json as any).data : [];
        setItems(arr);
      }
    } catch (e) {
      console.warn('fetch langs failed', e);
      setError('Failed to load languages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLangs();
  }, [fetchLangs]);

  const onSelect = (item: LangItem) => {
    const id = item.id ?? item.code ?? item.name;
    if (id) setLang(id);
    setOpen(false);
  };

  return (
    <View style={{ alignItems: 'flex-end' }}>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.toggle}>
        <Text style={styles.toggleText}>{(lang ?? 'EN').toString().toUpperCase()}</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setOpen(false)} style={{ padding: 12 }}>
              <Text style={{ color: '#007AFF' }}>Close</Text>
            </TouchableOpacity>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>Select Language</Text>
            <View style={{ width: 64 }} />
          </View>

          {loading ? (
            <View style={styles.center}><ActivityIndicator /></View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={{ color: '#c00' }}>{error}</Text>
              <TouchableOpacity onPress={fetchLangs} style={styles.retryBtn}><Text style={{ color: '#fff' }}>Retry</Text></TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(it, i) => String(it.id ?? it.code ?? it.name ?? i)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.row} onPress={() => onSelect(item)}>
                  <Text style={styles.rowText}>{item.name ?? item.code ?? item.id}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default DropdownPicker;

const styles = StyleSheet.create({
  toggle: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  toggleText: { fontWeight: '700' },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { padding: 14, borderBottomColor: '#eee', borderBottomWidth: 1 },
  rowText: { fontSize: 16 },
  retryBtn: { marginTop: 8, backgroundColor: '#007AFF', padding: 8, borderRadius: 6 },
});
