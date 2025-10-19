// src/components/AppHeader.tsx  (debug version)
import { useMenuDrawer } from "@/components/MenuDrawer";
import { useLanguage } from "@/context/LanguageContext";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AppHeader(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 8);

  useEffect(() => {
    console.debug("[AppHeader] mounted - safeTop:", insets.top);
    return () => console.debug("[AppHeader] unmounted");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const menuDrawer = (typeof useMenuDrawer === "function" ? useMenuDrawer() : null) as any | null;
  const openDrawer = menuDrawer && typeof menuDrawer.openDrawer === "function"
    ? () => menuDrawer.openDrawer()
    : () => console.debug("[AppHeader] openDrawer not available");

  const langCtx = (typeof useLanguage === "function" ? useLanguage() : null) as any | null;
  const openLanguage = langCtx && typeof langCtx.openLanguage === "function"
    ? () => langCtx.openLanguage()
    : () => console.debug("[AppHeader] openLanguage not available");

  return (
    <View
      testID="debug-app-header"
      style={[styles.container, { paddingTop: topPadding }]}
      pointerEvents="box-none"
    >
      {/* visible debugging header */}
      <View style={styles.inner}>
        <TouchableOpacity onPress={openDrawer} style={styles.iconBtn}>
          <Text style={styles.icon}>☰</Text>
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Gita App (HEADER)</Text>
        </View>

        <View style={styles.right}>
          <TouchableOpacity onPress={openLanguage} style={styles.iconBtn}>
            <Text style={styles.icon}>🌐</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => console.debug("[AppHeader] login pressed")} style={styles.loginBtn}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#ffefef", // light red background so it's obvious
    borderBottomWidth: 2,
    borderBottomColor: "#ff4d4d",
    zIndex: 9999,
  },
  inner: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  iconBtn: { padding: 8 },
  icon: { fontSize: 20 },
  titleWrap: { flex: 1, alignItems: "center" },
  title: { fontWeight: "700", fontSize: 18 },
  right: { flexDirection: "row", alignItems: "center" },
  loginBtn: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  loginText: { fontSize: 14 },
});