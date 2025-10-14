// src/components/AuthModal.tsx
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Defensive - prefer named useAuth hook; if not available, try default import
let useAuthHook: (() => any) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const authModule = require("../context/AuthModalContext");
  if (typeof authModule.useAuth === "function") useAuthHook = authModule.useAuth;
} catch (e) {
  // ignore - context might not be present in some setups
}

export type AuthModalProps = {
  visible?: boolean;
  onClose?: () => void;
};

export default function AuthModal(props: AuthModalProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const auth = (typeof useAuthHook === "function" ? useAuthHook() : null) ?? null;

  const visible = props.visible ?? Boolean(auth?.openLoginVisible ?? auth?.visible ?? auth?.isOpen ?? false);
  const onClose =
    props.onClose ??
    (() => {
      if (auth) {
        if (typeof auth.closeLogin === "function") return auth.closeLogin();
        if (typeof auth.close === "function") return auth.close();
        if (typeof auth.setOpen === "function") return auth.setOpen(false);
      }
    });

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const doLogin = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (auth && typeof auth.login === "function") {
        const r = await auth.login(identifier, password);
        // some login APIs return { success: true } others return token — we keep defensive
        if (r && (r.success === false || r.error)) {
          setErrorMsg(r.message ?? r.error ?? "Login failed");
          setLoading(false);
          return;
        }
      } else {
        // If no auth hook available we still allow consumer-provided onClose to close the modal
        console.debug("[AuthModal] no auth.login available; calling onClose");
      }
      // close on success
      onClose && onClose();
    } catch (err: any) {
      console.error("[AuthModal] login error", err);
      setErrorMsg(err?.message ?? String(err ?? "Login failed"));
    } finally {
      setLoading(false);
    }
  }, [auth, identifier, password, onClose]);

  return (
    <Modal visible={Boolean(visible)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { marginTop: insets.top + 20 }]}>
          <Text style={styles.title}>Sign in</Text>

          <TextInput
            placeholder="Email or username"
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

          <View style={styles.row}>
            <TouchableOpacity style={styles.button} onPress={doLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign in</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.ghost]}
              onPress={() => {
                setIdentifier("");
                setPassword("");
                onClose && onClose();
              }}
            >
              <Text style={[styles.btnText, { color: "#333" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center" },
  sheet: {
    width: "86%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 10, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  button: { backgroundColor: "#2B79FF", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  ghost: { backgroundColor: "#f2f2f2" },
  btnText: { color: "#fff", fontWeight: "600" },
  error: { color: "red", marginBottom: 8 },
});