import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Lightweight local types so this file remains self-contained and TypeScript-safe
interface AuthModalProps {
  visible?: boolean;
  onClose?: () => void;
}

export default function AuthModal(props: AuthModalProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();

  // Defensive dynamic require: some dev setups export useAuth differently.
  // We attempt to load the hook at runtime. If not present, `auth` stays null
  // and the component falls back to props-driven visibility.
  let runtimeAuth: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const authModule = require("../context/AuthModalContext");
    if (authModule && typeof authModule.useAuth === "function") {
      // NOTE: calling a hook conditionally is usually discouraged, but this
      // pattern is being used project-wide as a defensive fallback. If your
      // codebase consistently exports useAuth, consider replacing this with
      // a static `import { useAuth } from "@/context/AuthModalContext";`.
      runtimeAuth = authModule.useAuth();
    }
  } catch (e) {
    runtimeAuth = null;
  }

  // Computed visibility: prefer explicit prop, otherwise fall back to auth state
  const computedVisible = Boolean(
    props.visible ?? (runtimeAuth && (runtimeAuth.openLoginVisible ?? runtimeAuth.visible ?? runtimeAuth.isOpen)) ?? false
  );

  // debug information
  // eslint-disable-next-line no-console
  console.debug("[AuthModal] component render - props.visible:", props.visible, "computedVisible:", computedVisible);
  // eslint-disable-next-line no-console
  console.debug("[AuthModal] detected auth object:", runtimeAuth);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (typeof props.onClose === "function") return props.onClose();
    if (runtimeAuth && typeof runtimeAuth.closeLogin === "function") return runtimeAuth.closeLogin();
    if (runtimeAuth && typeof runtimeAuth.close === "function") return runtimeAuth.close();
  }, [props, runtimeAuth]);

  const handleSubmit = useCallback(async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      if (runtimeAuth && typeof runtimeAuth.login === "function") {
        // many implementations accept an object; others accept (identifier, password)
        let result: any = null;
        try {
          result = await runtimeAuth.login({ identifier: identifier.trim(), password });
        } catch (err) {
          // fallback to positional parameters if the implementation expects that
          // (some older helpers do this)
          try {
            result = await runtimeAuth.login(identifier.trim(), password);
          } catch (err2) {
            // swallow; we'll show error below
            throw err2 || err;
          }
        }

        if (result && result.success) {
          handleClose();
        } else if (result && result.success === false) {
          setErrorMsg(result.message ?? "Login failed");
        }
      } else {
        setErrorMsg("Login not available in this build");
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? String(err) ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }, [identifier, password, runtimeAuth, handleClose]);

  useEffect(() => {
    if (computedVisible) setErrorMsg(null);
  }, [computedVisible]);

  if (!computedVisible) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      presentationStyle="overFullScreen"
    >
      <View style={[styles.overlay, { paddingTop: insets.top || 16 }]}> 
        <View style={styles.dialog}>
          <Text style={styles.title}>Sign in</Text>

          <TextInput
            style={styles.input}
            placeholder="Email or username"
            keyboardType="email-address"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={handleClose} disabled={loading}>
              <Text style={[styles.btnText, { color: "#000" }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.primary]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator /> : <Text style={styles.btnText}>Sign in</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  dialog: { width: "90%", maxWidth: 520, backgroundColor: "#fff", padding: 16, borderRadius: 8 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 },
  btn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6 },
  primary: { backgroundColor: "#007AFF" },
  cancel: { backgroundColor: "#eee" },
  btnText: { color: "#fff", fontWeight: "600" },
  error: { marginTop: 8, color: "#b00020" },
});