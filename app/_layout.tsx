// app/_layout.tsx
import { Slot } from "expo-router";
import React from "react";
import { StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Providers & components - adjust paths if your project places them differently
import { MenuDrawerProvider } from "@/components/MenuDrawer";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { LanguageProvider } from "@/context/LanguageContext";

import AppHeader, { HEADER_HEIGHT } from "@/components/AppHeader";
import AuthModal from "@/components/AuthModal";
import LanguageModal from "@/components/LanguageModal";

/**
 * Layout responsibilities:
 * - Provide global context providers (Auth, Language, Menu)
 * - Render AppHeader above routed screens (Slot)
 * - Keep header height constant via HEADER_HEIGHT exported from AppHeader
 *
 * We intentionally render AuthModal and LanguageModal here (outside Slot)
 * so they visually sit above routed pages (and below header if needed).
 */

export default function RootLayout(): React.ReactElement {
  // Keep STATUSBAR handling minimal — apps often customize this.
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthModalProvider>
        <LanguageProvider>
          {/* MenuDrawerProvider accepts anchorTop so drawer sits below header */}
          <MenuDrawerProvider anchorTop={HEADER_HEIGHT}>
            {/* Header - stays above routed pages */}
            <AppHeader />

            {/* Routed pages */}
            <View style={{ flex: 1 }}>
              <Slot />
            </View>

            {/* Modals/drawers — many implementations read visibility from context.
                We render them here so they sit above Slot content. Cast to any
                to avoid very strict prop expectations (some versions expect props,
                others read context internally). */}
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <AuthModal />
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <LanguageModal />
          </MenuDrawerProvider>
        </LanguageProvider>
      </AuthModalProvider>
    </SafeAreaProvider>
  );
}