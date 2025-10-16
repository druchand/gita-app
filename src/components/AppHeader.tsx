// src/components/AppHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useMenuDrawer } from "@/components/MenuDrawer"; // ✅ Correct import
import { useAuth } from "@/context/AuthModalContext";
import { useLanguage } from "@/context/LanguageContext";

export default function AppHeader() {
  const insets = useSafeAreaInsets();
  const { openMenu } = useMenuDrawer(); // ✅ renamed to openMenu
  const { openLogin, user } = useAuth();
  const { openLanguage } = useLanguage();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      {/* Left: Menu */}
      <TouchableOpacity onPress={openMenu} style={styles.iconButton}>
        <Ionicons name="menu" size={24} color="#333" />
      </TouchableOpacity>

      {/* Center: Title */}
      <Text style={styles.title}>Gita App</Text>

      {/* Right: Language + Auth */}
      <View style={styles.rightGroup}>
        <TouchableOpacity onPress={openLanguage} style={styles.iconButton}>
          <Ionicons name="globe-outline" size={20} color="#333" />
        </TouchableOpacity>

        {user ? (
          <TouchableOpacity style={styles.profileButton}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <Text style={styles.userInitial}>{user.name?.[0] ?? "U"}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={openLogin} style={styles.loginButton}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconButton: {
    padding: 6,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  loginButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#f5f5f5",
    borderRadius: 6,
  },
  loginText: {
    fontSize: 14,
    color: "#333",
  },
  profileButton: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddd",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  userInitial: {
    fontWeight: "600",
    color: "#333",
  },
});