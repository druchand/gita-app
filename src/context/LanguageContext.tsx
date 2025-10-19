// src/context/LanguageContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type LangItem = {
  _id?: string;
  code: string;
  name: string;
};

type LanguageContextValue = {
  lang: string; // content language code (e.g., 'EN', 'HI')
  langName?: string;
  availableLangs: LangItem[];
  isOpen: boolean; // whether language modal is visible
  openLanguage: () => void;
  closeLanguage: () => void;
  setLangCode: (code: string) => Promise<void>;
  setAvailableLangs: (langs: LangItem[]) => void;
};

const LANG_STORAGE_KEY = "app:lang";

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<string>("EN");
  const [langName, setLangName] = useState<string | undefined>(undefined);
  const [availableLangs, setAvailableLangs] = useState<LangItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    // load persisted lang
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANG_STORAGE_KEY);
        if (stored) {
          console.debug("[LanguageContext] loaded persisted lang:", stored);
          setLang(stored);
        }
      } catch (err) {
        console.warn("[LanguageContext] error reading persisted lang", err);
      }
    })();
  }, []);

  const openLanguage = () => {
    console.debug("[LanguageContext] openLanguage() - prev isOpen:", isOpen);
    try {
      setIsOpen(true);
      console.debug("[LanguageContext] openLanguage() - requested visible: true");
    } catch (err) {
      console.warn("[LanguageContext] openLanguage() error", err);
    }
  };

  const closeLanguage = () => {
    console.debug("[LanguageContext] closeLanguage() - prev isOpen:", isOpen);
    try {
      setIsOpen(false);
      console.debug("[LanguageContext] closeLanguage() - requested visible: false");
    } catch (err) {
      console.warn("[LanguageContext] closeLanguage() error", err);
    }
  };

  const setLangCode = async (code: string) => {
    console.debug("[LanguageContext] setLangCode() requested code:", code);
    try {
      setLang(code);
      await AsyncStorage.setItem(LANG_STORAGE_KEY, code);
      console.debug("[LanguageContext] setLangCode() persisted code:", code);
    } catch (err) {
      console.warn("[LanguageContext] setLangCode() error", err);
    }
  };

  const setLangs = (langs: LangItem[]) => {
    setAvailableLangs(langs);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      langName,
      availableLangs,
      isOpen,
      openLanguage,
      closeLanguage,
      setLangCode,
      setAvailableLangs: setLangs,
    }),
    [lang, langName, availableLangs, isOpen]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}