// app/components/AuthModal.tsx
import { useAuthModal } from "@/context/AuthModalContext";
import React, { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function AuthModal(): React.ReactElement | null {
  const { open, setOpen, login, loading } = useAuthModal();

  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const onSubmit = async () => {
    setError(null);
    if (!identifier) {
      setError("Please enter email or phone");
      return;
    }
    if (!password) {
      setError("Please enter password");
      return;
    }
    setSubmitting(true);
    try {
      await login({identifier, password});
      // provider will close modal (setOpen(false)) on success
    } catch (err: any) {
      console.warn("login error", err);
      const msg = err?.body?.message ?? err?.message ?? "Login failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Login</Text>

          <Text style={styles.label}>Email or phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Email or phone"
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#ccc"
          />

          <Text style={[styles.label, { marginTop: 10 }]}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#ccc"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.cta} onPress={onSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Login</Text>}
          </TouchableOpacity>

          <View style={styles.row}>
            <TouchableOpacity onPress={() => { /* TODO: switch to signup UI */ }}>
              <Text style={styles.link}>No account? Sign up</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { /* TODO: Forgot password flow */ }}>
              <Text style={[styles.link, { marginLeft: 12 }]}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.close} onPress={() => setOpen(false)}>
            <Text style={{ fontSize: 20 }}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 24,
    justifyContent: "center",
  },
  dialog: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    position: "relative",
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  label: { fontSize: 13, color: "#333", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111",
    backgroundColor: "#fafafa",
  },
  cta: {
    marginTop: 16,
    backgroundColor: "#2f6fff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  link: { color: "#2f6fff", fontWeight: "600" },
  error: { color: "#c0392b", marginTop: 10 },
  close: { position: "absolute", right: 8, top: 8 },
});