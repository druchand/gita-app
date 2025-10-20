// src/context/AuthModalContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type User = { id?: string; name?: string; email?: string } | null;

type AuthContextValue = {
  user: User;
  isOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  login: (payload?: { name?: string; email?: string }) => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openLogin = () => setIsOpen(true);
  const closeLogin = () => setIsOpen(false);

  const login = async (payload?: { name?: string; email?: string }) => {
    setUser({ id: "local-1", name: payload?.name ?? "Guest", email: payload?.email });
    setIsOpen(false);
  };

  const logout = () => setUser(null);

  const value = useMemo<AuthContextValue>(() => ({ user, isOpen, openLogin, closeLogin, login, logout, setUser }), [user, isOpen]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Modal visible={isOpen} animationType="slide" transparent onRequestClose={closeLogin}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sign in</Text>
            <Text style={styles.modalText}>This is a placeholder login modal. Use `login()` to sign in.</Text>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtn} onPress={() => login({ name: "Demo User" })}>
                <Text style={styles.modalBtnText}>Sign in as Demo</Text>
              </Pressable>

              <Pressable style={[styles.modalBtn, styles.modalBtnAlt]} onPress={closeLogin}>
                <Text style={styles.modalBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthModalProvider");
  return ctx;
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 420,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  modalText: { fontSize: 14, color: "#444", marginBottom: 16, textAlign: "center" },
  modalActions: { flexDirection: "row" },
  modalBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: "#3b82f6", margin: 6 },
  modalBtnAlt: { backgroundColor: "#666" },
  modalBtnText: { color: "#fff", fontWeight: "600" },
});