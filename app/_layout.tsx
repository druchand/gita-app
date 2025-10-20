// app/_layout.tsx
import { Slot } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Keep these imports exactly as in your workspace
import AppHeader from "@/components/AppHeader";
import { MenuDrawerProvider } from "@/components/MenuDrawer";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { LanguageProvider } from "@/context/LanguageContext";

/**
 * Simple error boundary so we see errors instead of a black screen.
 */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: unknown | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  componentDidCatch(error: unknown, info: any) {
    // Log to metro so we can see what blew up
    // eslint-disable-next-line no-console
    console.error("[RootErrorBoundary] Caught error:", error, info);
  }
  render() {
    if (this.state.error) {
      const msg =
        (this.state.error as any)?.message ??
        (typeof this.state.error === "string" ? this.state.error : String(this.state.error));
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>Something went wrong</Text>
          <Text style={styles.fallbackMsg}>{msg}</Text>
          <Text style={styles.fallbackHint}>
            Check metro logs above for a stack trace. Once fixed, reload the app.
          </Text>
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

export default function RootLayout(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthModalProvider>
          <MenuDrawerProvider>
            <RootErrorBoundary>
              {/* Header should remain above content; drawers manage their own z-index */}
              <AppHeader />
              <Slot />
            </RootErrorBoundary>
          </MenuDrawerProvider>
        </AuthModalProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 64,
    backgroundColor: "#fff",
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },
  fallbackMsg: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
  },
  fallbackHint: {
    fontSize: 12,
    color: "#6b7280",
  },
});