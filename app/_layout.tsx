// app/_layout.tsx
import { Slot } from "expo-router";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AppHeader from "@/components/AppHeader";
import LanguageModal from "@/components/LanguageModal";

import { MenuDrawerProvider } from "@/components/MenuDrawer";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthModalProvider>
          <MenuDrawerProvider>
            <AppHeader />
            {/* Mount the modal so openLanguage()/closeLanguage() can show/hide it */}
            <LanguageModal />
            <Slot />
          </MenuDrawerProvider>
        </AuthModalProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}