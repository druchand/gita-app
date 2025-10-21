// src/components/MenuDrawer.tsx
import { useRouter } from "expo-router";
import React, { createContext, useContext, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** ---------- Context types & exports ---------- */
export type MenuDrawerContextValue = {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};

const MenuDrawerContext = createContext<MenuDrawerContextValue | undefined>(undefined);

export function useMenuDrawer(): MenuDrawerContextValue {
  const ctx = useContext(MenuDrawerContext);
  if (!ctx) {
    // fail-safe: avoid hard crash, but warn loudly in dev
    if (__DEV__) {
      console.warn("[MenuDrawer] useMenuDrawer called outside provider");
    }
    // return inert fallback to keep app usable
    return { isOpen: false, openMenu: () => {}, closeMenu: () => {} };
  }
  return ctx;
}

export function MenuDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<MenuDrawerContextValue>(
    () => ({
      isOpen,
      openMenu: () => setIsOpen(true),
      closeMenu: () => setIsOpen(false),
    }),
    [isOpen]
  );

  return (
    <MenuDrawerContext.Provider value={value}>
      {/* Render the menu UI once at root so it overlays screens */}
      <MenuDrawer />
      {children}
    </MenuDrawerContext.Provider>
  );
}

/** ---------- Drawer UI component (default export) ---------- */

type MenuItem = {
  label: string;
  route: string;
  // For dynamic routes like /chapter/[id]
  buildHref?: () => string;
  testID?: string;
};

const DEFAULT_CHAPTER_ID = 1;

export default function MenuDrawer(): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const menu = useMenuDrawer();
  const isOpen = !!menu?.isOpen;

  const items: MenuItem[] = useMemo(
    () => [
      { label: "Home", route: "/" },
      { label: "Gita Home", route: "/gitaHome" },
      {
        label: `Chapter ${DEFAULT_CHAPTER_ID}`,
        route: "/chapter/[id]",
        buildHref: () => `/chapter/${DEFAULT_CHAPTER_ID}`,
      },
      { label: "Human Dilemma", route: "/human-dilemma" },
      { label: "About", route: "/about" },
      { label: "Profile", route: "/profile" },
      { label: "Settings", route: "/settings" }, // placeholder ok
      { label: "Help", route: "/help" }, // placeholder ok
      { label: "Media Demo", route: "/mediaDemo" },
    ],
    []
  );

  // Drawer sits below the header; give it a top margin that roughly matches your header height.
  // If you later expose header height via context, replace the constant below.
  const topOffset = Math.max(insets.top, 16) + 56; // safeTop + header bar height

  const close = () => menu.closeMenu();

  const navigate = (item: MenuItem) => {
    try {
      const href = item.buildHref ? item.buildHref() : item.route;
      console.debug("[MenuDrawer] item pressed:", item.label.toLowerCase());
      router.push(href as any);
    } finally {
      close();
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent
      onRequestClose={close}
      statusBarTranslucent
    >
      {/* Dimmed backdrop */}
      <Pressable style={styles.backdrop} onPress={close} testID="menu-backdrop" />

      {/* Panel */}
      <View style={[styles.panelWrap, { paddingTop: topOffset }]}>
        <View style={styles.panel} accessibilityRole="menu">
          {/* Panel header row with close "×" */}
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Menu</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              onPress={close}
              hitSlop={8}
              style={styles.closeBtn}
              testID="menu-close"
            >
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Items */}
          <View style={styles.list}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => navigate(item)}
                style={styles.item}
                accessibilityRole="menuitem"
                testID={item.testID ?? `menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Text style={styles.itemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  panelWrap: {
    flex: 1,
    paddingHorizontal: 16,
  },
  panel: {
    alignSelf: "flex-start",
    width: "82%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderColor: "#e5e5ea",
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomColor: "#eee",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeIcon: {
    fontSize: 24,
    lineHeight: 24,
  },
  list: {
    paddingVertical: 8,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemText: {
    fontSize: 16,
  },
});