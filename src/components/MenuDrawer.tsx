// src/components/MenuDrawer.tsx
import React, { createContext, useContext, useState } from "react";
import { Animated, Dimensions, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HEADER_HEIGHT = 56; // ✅ define locally instead of importing

// Context type
type MenuDrawerContextValue = {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};

const MenuDrawerContext = createContext<MenuDrawerContextValue | undefined>(undefined);

export const MenuDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = () => setIsOpen(true);
  const closeMenu = () => setIsOpen(false);

  return (
    <MenuDrawerContext.Provider value={{ isOpen, openMenu, closeMenu }}>
      {children}
      {isOpen && <MenuDrawer closeMenu={closeMenu} />}
    </MenuDrawerContext.Provider>
  );
};

export const useMenuDrawer = () => {
  const ctx = useContext(MenuDrawerContext);
  if (!ctx) throw new Error("useMenuDrawer must be used within MenuDrawerProvider");
  return ctx;
};

// Drawer component
const MenuDrawer: React.FC<{ closeMenu: () => void }> = ({ closeMenu }) => {
  const insets = useSafeAreaInsets();
  const drawerWidth = Math.min(SCREEN_WIDTH * 0.78, 320);

  return (
    <View style={styles.overlay}>
      {/* Drawer */}
      <Animated.View style={[styles.drawer, { top: insets.top + HEADER_HEIGHT, width: drawerWidth }]}>
        <Text style={styles.title}>Menu</Text>
        <TouchableOpacity onPress={() => { console.debug("[MenuDrawer] item pressed: home"); closeMenu(); }}>
          <Text style={styles.item}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { console.debug("[MenuDrawer] item pressed: profile"); closeMenu(); }}>
          <Text style={styles.item}>My Profile</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={closeMenu} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
  },
  drawer: {
    backgroundColor: "#fff",
    height: "100%",
    paddingHorizontal: 16,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  item: {
    fontSize: 16,
    paddingVertical: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});