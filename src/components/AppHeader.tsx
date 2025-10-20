// src/components/AppHeader.tsx
import React, { useEffect, useMemo } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Use the exact paths you listed
import { useMenuDrawer } from "@/components/MenuDrawer";
import { useAuth } from "@/context/AuthModalContext";
import { useLanguage } from "@/context/LanguageContext";

const HEADER_MIN_HEIGHT = 68; // base height; final = max(min, safeTop + 48)

/**
 * Log helper (defensive on unknown error objects)
 */
function logWarn(prefix: string, err: unknown) {
  const msg = (err as any)?.message ?? String(err);
  // eslint-disable-next-line no-console
  console.warn(prefix, msg);
}

export default function AppHeader(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 8);
  const headerHeight = Math.max(HEADER_MIN_HEIGHT, topPadding + 48);

  // --- Hook acquisition (defensive: if provider missing, catch & keep no-ops)
  let menuCtx: ReturnType<typeof useMenuDrawer> | undefined;
  let langCtx: ReturnType<typeof useLanguage> | undefined;
  let authCtx: ReturnType<typeof useAuth> | undefined;

  try {
    menuCtx = useMenuDrawer();
  } catch (e) {
    logWarn("[AppHeader] useMenuDrawer unavailable:", e);
  }
  try {
    langCtx = useLanguage();
  } catch (e) {
    logWarn("[AppHeader] useLanguage unavailable:", e);
  }
  try {
    authCtx = useAuth();
  } catch (e) {
    logWarn("[AppHeader] useAuth unavailable:", e);
  }

  // Snapshot of available actions (for logging)
  const available = useMemo(
    () => ({
      menu: Object.keys(menuCtx ?? {}),
      lang: Object.keys(langCtx ?? {}),
      auth: Object.keys(authCtx ?? {}),
    }),
    [menuCtx, langCtx, authCtx]
  );

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug(
      "[AppHeader] mounted — actions",
      JSON.stringify(available)
    );
    return () => {
      // eslint-disable-next-line no-console
      console.debug("[AppHeader] unmounted");
    };
  }, [available]);

  const onPressMenu = () => {
    if (menuCtx?.openMenu) {
      // eslint-disable-next-line no-console
      console.debug("[AppHeader] openMenu()");
      menuCtx.openMenu();
    } else if ((menuCtx as any)?.openDrawer) {
      // support alternate naming
      // eslint-disable-next-line no-console
      console.debug("[AppHeader] openDrawer()");
      (menuCtx as any).openDrawer();
    } else {
      // eslint-disable-next-line no-console
      console.warn("[AppHeader] openMenu/openDrawer not available on menuCtx", menuCtx);
    }
  };

  const onPressLanguage = () => {
    if (langCtx?.openLanguage) {
      // eslint-disable-next-line no-console
      console.debug("[AppHeader] openLanguage()");
      langCtx.openLanguage();
    } else if ((langCtx as any)?.open) {
      // eslint-disable-next-line no-console
      console.debug("[AppHeader] langCtx.open()");
      (langCtx as any).open();
    } else {
      // eslint-disable-next-line no-console
      console.warn("[AppHeader] openLanguage/open not available on langCtx", langCtx);
    }
  };

  const onPressLogin = () => {
    // prefer openLogin, fallback to login
    const openLogin = (authCtx as any)?.openLogin ?? (authCtx as any)?.login;
    if (typeof openLogin === "function") {
      // eslint-disable-next-line no-console
      console.debug("[AppHeader] openLogin()");
      openLogin();
    } else {
      // eslint-disable-next-line no-console
      console.warn("[AppHeader] openLogin/login not available on authCtx", authCtx);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding,
          height: headerHeight,
          // Ensure header stays above drawer
          zIndex: 100,
          elevation: Platform.OS === "android" ? 4 : 0,
        },
      ]}
      accessibilityRole="header"
    >
      <TouchableOpacity onPress={onPressMenu} accessibilityRole="button" style={styles.iconWrap}>
        <Text style={styles.icon}>≡</Text>
      </TouchableOpacity>

      <View style={styles.center}>
        <Text style={styles.title}>Gita App</Text>
        <Text style={styles.subtitle}>Home</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onPressLanguage} accessibilityRole="button" style={styles.iconWrap}>
          <Text style={styles.icon}>🌐</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPressLogin} accessibilityRole="button" style={styles.iconWrap}>
          <Text style={styles.icon}>🔒</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderBottomColor: "#e5e5ea",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    padding: 8,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 18 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  title: { fontSize: 18, fontWeight: "600", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6b7280" },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
});