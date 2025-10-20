// src/components/AppHeader.tsx
import { useMenuDrawer } from "@/components/MenuDrawer";
import { useAuth } from "@/context/AuthModalContext";
import { useLanguage } from "@/context/LanguageContext";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_MIN_HEIGHT = 90;

export default function AppHeader(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 8);
  const headerHeight = Math.max(HEADER_MIN_HEIGHT, topPad + 48);

  // contexts (providers are mounted by RootLayout)
  const menu = useMenuDrawer();
  const auth = useAuth();
  const lang = useLanguage();

  return (
    <View style={[styles.container, { paddingTop: topPad, height: headerHeight }]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        onPress={() => menu.openMenu()}
        style={styles.iconButton}
      >
        <Text style={styles.icon}>≡</Text>
      </TouchableOpacity>

      <View style={styles.titleWrap}>
        <Text style={styles.appTitle}>Gita App</Text>
        <Text style={styles.subTitle}>Home</Text>
      </View>

      <View style={styles.right}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Select language"
          onPress={() => lang.openLanguage()}
          style={styles.iconButton}
        >
          <Text style={styles.icon}>🌐</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Login"
          onPress={() => auth.openLogin()}
          style={styles.iconButton}
        >
          <Text style={styles.icon}>🔒</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  icon: {
    fontSize: 18,
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  subTitle: {
    fontSize: 12,
    color: "#666",
  },
  right: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
});