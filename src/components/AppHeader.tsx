// src/components/AppHeader.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import LanguageModal from "@/components/LanguageModal";
import { useAuthModal } from "@/context/AuthModalContext";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  title?: string;
};

export default function AppHeader({ title = "Gita App" }: Props): React.ReactElement {
  const router = useRouter();

  // Hooks must be inside component
  const auth = useAuthModal();
  const { langName } = useLanguage();

  const [menuVisible, setMenuVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const openAuth = () => {
    // prefer helper if available
    if (auth.openLogin) {
      auth.openLogin();
    } else {
      auth.setOpen(true);
    }
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.left}
        >
          <Text style={styles.icon}>☰</Text>
        </TouchableOpacity>

        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>

        <View style={styles.right}>
          <TouchableOpacity onPress={() => setLangModalVisible(true)} style={styles.langBtn}>
            <Text style={styles.langText}>{langName}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={openAuth} style={styles.loginBtn}>
            <Text style={styles.loginText}>{auth.user ? "Logout" : "Login"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu as Modal so it sits above everything and is tappable even under notches */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/");
            }}
          >
            <Text>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/human-dilemma");
            }}
          >
            <Text>Human Dilemma</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/about");
            }}
          >
            <Text>About</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Language modal controlled by header */}
      <LanguageModal visible={langModalVisible} onClose={() => setLangModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingTop: Platform.OS === "ios" ? 12 : 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
  },
  left: { width: 44, justifyContent: "center", alignItems: "center" },
  icon: { fontSize: 22 },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },
  right: { flexDirection: "row", alignItems: "center" },
  langBtn: { marginRight: 12, padding: 6 },
  langText: { fontSize: 14 },
  loginBtn: { padding: 6 },
  loginText: { color: "#007AFF", fontSize: 14 },

  /* Modal overlay/menu */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  menuContainer: {
    position: "absolute",
    top: 80,
    right: 12,
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    paddingVertical: 6,
    zIndex: 9999,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
});