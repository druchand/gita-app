// src/context/LanguageContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type LangItem = {
  code: string;
  name: string;
  nativeName?: string;
};

type LanguageContextValue = {
  lang: string;
  availableLangs: LangItem[];
  isOpen: boolean;
  openLanguage: () => void;
  closeLanguage: () => void;
  setLangCode: (code: string) => Promise<void>;
  refreshLanguages: () => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const LANG_STORAGE_KEY = "gita:selectedLang";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<string>("EN");
  const [availableLangs, setAvailableLangs] = useState<LangItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // ---- Fetch available languages from backend ----
  const fetchLanguages = useCallback(async () => {
    try {
      const res = await fetch("https://eq21.co.in/_functions/AppLanguages");
      const text = await res.text();
      if (!text) throw new Error("Empty response");
      const json = JSON.parse(text);
      if (Array.isArray(json)) setAvailableLangs(json);
      else throw new Error("Unexpected response");
    } catch (err) {
      console.warn("Failed to load languages:", err);
      // fallback to English/Hindi
      setAvailableLangs([
        { code: "EN", name: "English" },
        { code: "HI", name: "हिन्दी" },
      ]);
    }
  }, []);

  // ---- Load saved language from AsyncStorage ----
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_STORAGE_KEY);
        if (saved) setLang(saved);
      } catch (err) {
        console.warn("Failed to load stored language", err);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // ---- Fetch languages once on mount ----
  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  const openLanguage = () => setIsOpen(true);
  const closeLanguage = () => setIsOpen(false);

  const setLangCode = async (code: string) => {
    setLang(code);
    setIsOpen(false);
    try {
      await AsyncStorage.setItem(LANG_STORAGE_KEY, code);
    } catch (err) {
      console.warn("Failed to persist language", err);
    }
  };

  const value: LanguageContextValue = {
    lang,
    availableLangs,
    isOpen,
    openLanguage,
    closeLanguage,
    setLangCode,
    refreshLanguages: fetchLanguages,
  };

  // Avoid flicker before hydration
  if (!hydrated) return null;

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};