// src/context/AuthModalContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export type User = {
  id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
};

export type AuthModalContextValue = {
  isOpen: boolean;
  user: User | null;
  openLogin: () => void;
  closeLogin: () => void;
  login: (next?: Partial<User>) => void;
  logout: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export function useAuth(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuth must be used within AuthModalProvider");
  return ctx;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const value = useMemo<AuthModalContextValue>(
    () => ({
      isOpen,
      user,
      openLogin: () => setOpen(true),
      closeLogin: () => setOpen(false),
      login: (next) => {
        const u: User = {
          id: "demo",
          name: (next?.name ?? name) || "Demo User",
email: (next?.email ?? email) || "demo@example.com",
        };
        setUser(u);
        setOpen(false);
      },
      logout: () => setUser(null),
    }),
    [isOpen, user, name, email]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.desc}>
              This is a placeholder login modal. Use `login()` to sign in.
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name"
              style={styles.input}
              autoCapitalize="words"
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.actions}>
              <Pressable style={[styles.btn, styles.secondary]} onPress={() => setOpen(false)}>
                <Text style={styles.btnText}>Close</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.primary]}
                onPress={() => value.login({ name, email })}
              >
                <Text style={[styles.btnText, styles.primaryText]}>Sign in as Demo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AuthModalContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 520,
    borderRadius: 16,
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  desc: { color: "#444", marginBottom: 12 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 6 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  secondary: { backgroundColor: "#eee" },
  primary: { backgroundColor: "#2e7d32" },
  btnText: { fontWeight: "600" },
  primaryText: { color: "#fff" },
});