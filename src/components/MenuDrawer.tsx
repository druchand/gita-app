// src/components/MenuDrawer.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MenuDrawerContextValue = {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};

const MenuDrawerContext = createContext<MenuDrawerContextValue | undefined>(undefined);

export function useMenuDrawer(): MenuDrawerContextValue {
  const ctx = useContext(MenuDrawerContext);
  if (!ctx) {
    // Keep it forgiving in production, but we do throw here to catch mis-mounts.
    throw new Error("useMenuDrawer must be used within MenuDrawerProvider");
  }
  return ctx;
}

export function MenuDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const value = useMemo(
    () => ({
      isOpen,
      openMenu: () => setOpen(true),
      closeMenu: () => setOpen(false),
    }),
    [isOpen]
  );

  return (
    <MenuDrawerContext.Provider value={value}>
      {children}

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.sheet,
              {
                marginTop: Math.max(insets.top, 8) + 48, // appear just under header
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Menu</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>

            {[
              { key: "home", label: "Home" },
              { key: "profile", label: "Profile" },
              { key: "settings", label: "Settings" },
              { key: "help", label: "Help" },
            ].map((it) => (
              <Pressable
                key={it.key}
                style={styles.item}
                onPress={() => {
                  // wire navigation later; for now just close
                  setOpen(false);
                  console.debug("[MenuDrawer] item pressed:", it.key);
                }}
              >
                <Text style={styles.itemText}>{it.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </MenuDrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "flex-start",
  },
  sheet: {
    width: "86%",
    maxWidth: 360,
    marginLeft: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: "600" },
  close: { fontSize: 18 },
  item: {
    paddingVertical: 12,
  },
  itemText: {
    fontSize: 16,
  },
});