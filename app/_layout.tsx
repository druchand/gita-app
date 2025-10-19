// app/_layout.tsx
import { Slot } from "expo-router";
import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { MenuDrawerProvider } from "@/components/MenuDrawer";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { LanguageProvider } from "@/context/LanguageContext";
import "@/i18n";

import AppHeader from "@/components/AppHeader";

export default function RootLayout(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthModalProvider>
          <MenuDrawerProvider>
            {/* Header sits above Slot and uses SafeAreaView padding */}
            <SafeAreaView mode="padding" edges={["top"]} style={{ zIndex: 9999 }}>
              <AppHeader />
            </SafeAreaView>

            {/* App content */}
            <Slot />
          </MenuDrawerProvider>
        </AuthModalProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}