// app/_layout.tsx
import { Slot } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "@/components/AppHeader"; // resolves to src/components/AppHeader
import AuthModal from "@/components/AuthModal"; // resolves to src/components/AuthModal

import { AuthModalProvider } from "@/context/AuthModalContext"; // resolves to src/context/AuthModalContext
import { LanguageProvider } from "@/context/LanguageContext"; // resolves to src/context/LanguageContext"

export default function RootLayout(): React.ReactElement {
  return (
    <AuthModalProvider>
      <LanguageProvider>
        <SafeAreaView style={styles.safe}>
          <AppHeader title="Gita App" />
          <View style={styles.container}>
            <Slot />
          </View>
          <AuthModal />
        </SafeAreaView>
      </LanguageProvider>
    </AuthModalProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
});