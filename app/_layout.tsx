// app/_layout.tsx
import { Slot } from "expo-router"; // if using expo-router
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppHeader from "../src/components/AppHeader";
import AuthModal from "../src/components/AuthModal"; // implement modal component
import LanguageModal from "../src/components/LanguageModal"; // implement language modal
import { MenuDrawerProvider } from "../src/components/MenuDrawer";
import { AuthModalProvider } from "../src/context/AuthModalContext";
import { HomeProvider } from "../src/context/HomeContext";
import { LanguageProvider } from "../src/context/LanguageContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthModalProvider>
        <LanguageProvider>
          <MenuDrawerProvider>
            <AppHeader />
            <HomeProvider>
              <Slot />
            </HomeProvider>
            
            {/* Modals rendered as siblings so they float above screens */}
            <AuthModal />
            <LanguageModal />
          </MenuDrawerProvider>
        </LanguageProvider>
      </AuthModalProvider>
    </SafeAreaProvider>
  );
}