import { useAuth } from "@/context/AuthModalContext";
import { useLanguage } from "@/context/LanguageContext";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text
} from "react-native";

const { width, height } = Dimensions.get("window");

type MenuContextValue = {
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  isOpen: boolean;
};

const MenuDrawerContext = createContext<MenuContextValue | null>(null);

export const useMenuDrawer = (): MenuContextValue => {
  const ctx = useContext(MenuDrawerContext);
  if (!ctx) throw new Error("useMenuDrawer must be used within MenuDrawerProvider");
  return ctx;
};

export const MenuDrawerProvider: React.FC<{
  children: ReactNode;
  anchorTop?: number;
}> = ({ children, anchorTop = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-width)).current;
  const auth = useAuth();
  const langCtx = useLanguage();

  const openMenu = () => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setIsOpen(true));
  };

  const closeMenu = () => {
    Animated.timing(translateX, {
      toValue: -width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  const toggleMenu = () => {
    if (isOpen) closeMenu();
    else openMenu();
  };

  // Expose globally (so AppHeader can trigger it)
  useEffect(() => {
    (globalThis as any).MenuController = { open: openMenu, close: closeMenu, toggle: toggleMenu };
    console.debug("[MenuDrawer] mounted; provider:", true);
    return () => {
      // cleanup without returning a boolean (delete returns boolean), so wrap in block
      delete (globalThis as any).MenuController;
    };
  }, []);

  const value: MenuContextValue = { openMenu, closeMenu, toggleMenu, isOpen };

  return (
    <MenuDrawerContext.Provider value={value}>
      {children}
      <MenuDrawerUI
        translateX={translateX}
        isOpen={isOpen}
        onClose={closeMenu}
        anchorTop={anchorTop}
        auth={auth}
        langCtx={langCtx}
      />
    </MenuDrawerContext.Provider>
  );
};

type DrawerProps = {
  translateX: Animated.Value;
  isOpen: boolean;
  onClose: () => void;
  anchorTop: number;
  auth: any;
  langCtx: any;
};

function MenuDrawerUI({
  translateX,
  isOpen,
  onClose,
  anchorTop,
  auth,
  langCtx,
}: DrawerProps) {
  const items = [
    { key: "home", label: "Home" },
    { key: "about", label: "About" },
    { key: "logout", label: "Logout" },
  ];

  const currentLang = (() => {
    const l = langCtx?.lang;
    if (!l) return "EN";
    if (typeof l === "string") return l;
    // l is likely an object with `code` property
    return (l as any).code ?? (l as any).lang ?? "EN";
  })();

  return (
    <>
      {isOpen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      )}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX }],
            top: anchorTop,
          },
        ]}
      >
        <Text style={styles.title}>Menu ({currentLang})</Text>
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => {
              console.debug(`[MenuDrawer] item pressed: ${item.key}`);
              if (item.key === "logout" && auth?.logout) auth.logout();
              onClose();
            }}
          >
            <Text style={styles.item}>{item.label}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    left: 0,
    width: width * 0.7,
    height: height,
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    paddingTop: 40,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  item: {
    fontSize: 16,
    paddingVertical: 10,
  },
});

// Export default provider for convenience. Named exports for useMenuDrawer and
// MenuDrawerProvider are already declared above.
export default MenuDrawerProvider;