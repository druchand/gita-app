// src/components/AppHeader.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Import provider modules (we access exports via `any` so TS stays happy)
import * as MenuDrawerModule from "@/components/MenuDrawer";
import * as AuthModule from "@/context/AuthModalContext";
import * as LanguageModule from "@/context/LanguageContext";

/** Ensure a function is returned so it can be called in the component body. */
function ensureHook<T extends (...args: any[]) => any>(maybeHook: any): T {
  if (typeof maybeHook === "function") return maybeHook as T;
  return (() => null) as unknown as T;
}

const HEADER_HEIGHT = 56;

export default function AppHeader(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 8);
  const { t } = useTranslation();

  // Probe for exported hook candidates (use any to avoid TS compile errors)
  const menuHookCandidate = (MenuDrawerModule as any).useMenuDrawer ?? (MenuDrawerModule as any).default;
  const langHookCandidate = (LanguageModule as any).useLanguage ?? (LanguageModule as any).default;
  const authHookCandidate =
    (AuthModule as any).useAuth ?? (AuthModule as any).useAuthModal ?? (AuthModule as any).default;

  // Ensure hook functions (or noops)
  const useMenuDrawerHook = ensureHook(menuHookCandidate);
  const useLanguageHook = ensureHook(langHookCandidate);
  const useAuthHook = ensureHook(authHookCandidate);

  // Call hooks inside component body
  const menuDrawerCtx = useMenuDrawerHook();
  const languageCtx = useLanguageHook();
  const authCtx = useAuthHook();

  // Resolve plausible function names — *include* the names you actually have
  const openDrawerCandidate =
    menuDrawerCtx &&
    (menuDrawerCtx.openMenu ||
      menuDrawerCtx.openDrawer ||
      menuDrawerCtx.toggle ||
      menuDrawerCtx.open ||
      menuDrawerCtx.setOpen ||
      null);

  const openLanguageCandidate =
    languageCtx &&
    (languageCtx.openLanguage ||
      languageCtx.openLangModal ||
      languageCtx.open ||
      languageCtx.toggleLanguageModal ||
      null);

  const openLoginCandidate =
    authCtx &&
    (authCtx.openLogin || authCtx.open || authCtx.login || authCtx.showLogin || null);

  // Handlers that try to call the candidate and log success/failure
  const handleOpenDrawer = () => {
    if (!openDrawerCandidate) {
      console.debug("[AppHeader] openDrawer candidate NOT found; menu context:", menuDrawerCtx);
      return;
    }
    try {
      if (typeof openDrawerCandidate === "function") {
        // call it; if it expects a boolean, try true; otherwise call with no args
        if (openDrawerCandidate.length === 1) {
          openDrawerCandidate(true);
        } else {
          openDrawerCandidate();
        }
        console.debug("[AppHeader] called menu function successfully:", openDrawerCandidate.name || "anonymous");
        return;
      }
      console.debug("[AppHeader] openDrawerCandidate exists but is not callable:", openDrawerCandidate);
    } catch (err) {
      console.debug("[AppHeader] error calling menu function:", err);
    }
  };

  const handleOpenLanguage = () => {
    if (!openLanguageCandidate) {
      console.debug("[AppHeader] openLanguage candidate NOT found; language context:", languageCtx);
      return;
    }
    try {
      if (typeof openLanguageCandidate === "function") {
        if (openLanguageCandidate.length === 1) openLanguageCandidate(true);
        else openLanguageCandidate();
        console.debug("[AppHeader] called language function successfully:", openLanguageCandidate.name || "anonymous");
      }
    } catch (err) {
      console.debug("[AppHeader] error calling language function:", err);
    }
  };

  const handleOpenLogin = () => {
    if (!openLoginCandidate) {
      console.debug("[AppHeader] openLogin candidate NOT found; auth context:", authCtx);
      return;
    }
    try {
      if (typeof openLoginCandidate === "function") {
        if (openLoginCandidate.length === 1) openLoginCandidate(true);
        else openLoginCandidate();
        console.debug("[AppHeader] called auth function successfully:", openLoginCandidate.name || "anonymous");
      }
    } catch (err) {
      console.debug("[AppHeader] error calling auth function:", err);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]} accessibilityRole="header">
      <View style={styles.inner}>
        <TouchableOpacity onPress={handleOpenDrawer} style={styles.iconBtn} accessibilityLabel={t("app.menu")}>
          <Text style={styles.icon}>☰</Text>
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>{t("app.title")}</Text>
        </View>

        <View style={styles.right}>
          <TouchableOpacity onPress={handleOpenLanguage} style={styles.iconBtn} accessibilityLabel={t("app.language")}>
            <Text style={styles.icon}>🌐</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleOpenLogin} style={styles.loginBtn} accessibilityLabel={t("app.login")}>
            <Text style={styles.loginText}>{t("app.login")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    zIndex: 50,
  },
  inner: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  iconBtn: {
    padding: 8,
  },
  icon: {
    fontSize: 20,
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontWeight: "700",
    fontSize: 18,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginBtn: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  loginText: {
    fontSize: 14,
  },
});