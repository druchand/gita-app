// src/components/MenuDrawer.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type MenuDrawerContextValue = {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};

const MenuDrawerContext = createContext<MenuDrawerContextValue | undefined>(undefined);

export const MenuDrawerController: { open?: () => void; close?: () => void } = {};
export function openMenu() { try { MenuDrawerController.open?.(); } catch (e) { console.warn(e); } }
export function closeMenu() { try { MenuDrawerController.close?.(); } catch (e) { console.warn(e); } }

export const MenuDrawerProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    MenuDrawerController.open = open;
    MenuDrawerController.close = close;
    return () => {
      if (MenuDrawerController.open === open) MenuDrawerController.open = undefined;
      if (MenuDrawerController.close === close) MenuDrawerController.close = undefined;
    };
  }, [open, close]);

  return (
    <MenuDrawerContext.Provider value={{ isOpen, openMenu: open, closeMenu: close }}>
      {children}
      {isOpen ? (
        <View style={styles.backdrop} pointerEvents="box-none">
          <View style={[styles.panel, { marginTop: insets.top + 8 }]}>
            <Text style={styles.title}>Menu</Text>
            <TouchableOpacity onPress={() => { console.debug("[MenuDrawer] item pressed: home"); close(); }} style={styles.item}><Text>Home</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { console.debug("[MenuDrawer] item pressed: profile"); close(); }} style={styles.item}><Text>Profile</Text></TouchableOpacity>
          </View>
        </View>
      ) : null}
    </MenuDrawerContext.Provider>
  );
};

export const useMenuDrawer = (): MenuDrawerContextValue => {
  const ctx = useContext(MenuDrawerContext);
  if (!ctx) return { isOpen: false, openMenu: () => {}, closeMenu: () => {} };
  return ctx;
};

const styles = StyleSheet.create({
  backdrop: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-start" },
  panel: { width: "80%", backgroundColor: "#fff", marginLeft: 8, borderRadius: 12, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  item: { fontSize: 18, paddingVertical: 10 },
});