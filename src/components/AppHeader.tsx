// src/components/AppHeader.tsx
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Try the canonical hook names (these must exist in your repo). If not available,
// the code below gracefully degrades.
let useAuthHook: (() => any) | null = null;
let useLanguageHook: (() => any) | null = null;
let useMenuDrawerHook: (() => any) | null = null;

try {
  // prefer named / exported hook if present
  // (if your context exports default or differently, these calls will be ignored)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const authModule = require("../context/AuthModalContext");
  if (typeof authModule.useAuth === "function") useAuthHook = authModule.useAuth;
} catch (e) {
  // ignore
}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const langModule = require("../context/LanguageContext");
  if (typeof langModule.useLanguage === "function") useLanguageHook = langModule.useLanguage;
} catch (e) {
  // ignore
}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const menuModule = require("./MenuDrawer");
  if (typeof menuModule.useMenuDrawer === "function") useMenuDrawerHook = menuModule.useMenuDrawer;
} catch (e) {
  // ignore
}

export const HEADER_HEIGHT = 64; // exported so layout can align drawers beneath header

type Props = {
  title?: string;
};

export default function AppHeader({ title = "Gita App" }: Props): React.ReactElement {
  const insets = useSafeAreaInsets();

  // read context if hooks present (defensive)
  const auth = (typeof useAuthHook === "function" ? useAuthHook() : null) ?? null;
  const language = (typeof useLanguageHook === "function" ? useLanguageHook() : null) ?? null;
  const menuCtx = (typeof useMenuDrawerHook === "function" ? useMenuDrawerHook() : null) ?? null;

  // fallback to global controller (some older code used globalThis.MenuModule)
  const globalMenu = (globalThis as any)?.MenuModule ?? null;

  const onMenuPress = () => {
    // try multiple method names seen across versions
    const menu = menuCtx ?? globalMenu;
    if (!menu) {
      console.debug("[AppHeader] no menu controller found");
      return;
    }
    const openFns = ["openMenu", "open", "toggle", "show"];
    for (const fn of openFns) {
      if (typeof menu[fn] === "function") {
        try {
          menu[fn]();
          console.debug("[AppHeader] called menu.", fn);
        } catch (err) {
          console.debug("[AppHeader] error calling menu.", fn, err);
        }
        return;
      }
    }
    // last resort: if provider exposes setOpen
    if (typeof menu.setOpen === "function") menu.setOpen(true);
  };

  const onLanguagePress = () => {
    // language provider may expose openLanguage or setLanguage or open
    if (language) {
      if (typeof language.openLanguage === "function") return language.openLanguage();
      if (typeof language.open === "function") return language.open();
      if (typeof language.setLangCode === "function" && language.lang) {
        // open fallback - if setLangCode exists, we can't open a UI - just log
        return console.debug("[AppHeader] language setLangCode available but no modal opener.");
      }
    }
    // fallback: try global
    const gm = (globalThis as any)?.LanguageModule ?? null;
    if (gm && typeof gm.open === "function") gm.open();
  };

  const onLoginPress = () => {
    if (auth) {
      if (typeof auth.openLogin === "function") return auth.openLogin();
      if (typeof auth.open === "function") return auth.open();
      if (typeof auth.setOpen === "function") return auth.setOpen(true);
    }
    const ga = (globalThis as any)?.AuthModule ?? null;
    if (ga && typeof ga.open === "function") ga.open();
  };

  const avatarUri =
    auth?.user?.profile?.coverPhoto?.url ?? auth?.user?.profile?.avatar ?? auth?.user?.picture ?? null;
  const displayName = auth?.user?.profile?.firstName ?? auth?.user?.firstName ?? auth?.user?.profile?.nickname ?? null;

  const langLabel = language?.langName ?? (typeof language?.lang === "string" ? language.lang : (language?.lang as any)?.code ?? "EN");

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <TouchableOpacity style={styles.iconWrap} onPress={onMenuPress} testID="header-menu">
          <Text style={styles.iconText}>☰</Text>
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.titleText}>{title}</Text>
        </View>

        <View style={styles.rightRow}>
          <TouchableOpacity style={styles.langWrap} onPress={onLanguagePress} testID="header-lang">
            <Text style={styles.langText}>{String(langLabel ?? "EN")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginWrap} onPress={onLoginPress} testID="header-login">
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <Text style={styles.loginText}>{displayName ? displayName : "Login"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: HEADER_HEIGHT,
    backgroundColor: "#ffffff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e6e6e6",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    flex: 1,
  },
  iconWrap: {
    width: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  iconText: { fontSize: 22 },
  titleWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  titleText: { fontSize: 18, fontWeight: "700" },
  rightRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  langWrap: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, backgroundColor: "#f5f5f5" },
  langText: { fontWeight: "600" },
  loginWrap: { marginLeft: 8, paddingHorizontal: 6 },
  loginText: { fontWeight: "600" },
  avatar: { width: 34, height: 34, borderRadius: 34 },
});