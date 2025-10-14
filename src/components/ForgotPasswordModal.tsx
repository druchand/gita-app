// src/components/ForgotPasswordModal.tsx
import { useAuth } from "@/context/AuthModalContext";
import React, { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ForgotPasswordModal(): React.ReactElement | null {
  const auth = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const onClose = () => {
    setVisible(false);
    setIdentifier("");
    setMsg(null);
  };

  const handleForgotPassword = async () => {
    setMsg(null);
    setLoading(true);
    try {
      await auth.forgotPassword(identifier.trim());
      setMsg("If that account exists, a reset link has been sent.");
    } catch (err: any) {
      setMsg(err?.message ?? "Unable to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Forgot Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
            editable={!loading}
          />

          {msg ? <Text style={styles.message}>{msg}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.primary]} onPress={handleForgotPassword} disabled={loading}>
              {loading ? <ActivityIndicator /> : <Text style={styles.btnText}>Send</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  dialog: { backgroundColor: "#fff", padding: 16, borderRadius: 8, width: "85%" },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12, gap: 8 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  primary: { backgroundColor: "#007AFF" },
  cancel: { backgroundColor: "#eee" },
  btnText: { color: "#fff", fontWeight: "600" },
  message: { marginTop: 8, color: "green" },
});