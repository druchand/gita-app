import LanguageModal from "@/components/LanguageModal";
import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Lang shape used across the app.
 */
type LangShape = string | { code?: string; name?: string } | null;

export type LanguageContextValue = {
  lang?: LangShape;
  langName?: string | null;
  availableLangs?: { code: string; name: string }[];
  openLanguage: () => void;
  closeLanguage: () => void;
  setLangCode?: (code: string) => Promise<void>;
  isOpen: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode; anchorTop?: number }> = ({
  children,
  anchorTop = 0,
}) => {
  const [lang, setLang] = useState<LangShape>("EN");
  const [availableLangs, setAvailableLangs] = useState<{ code: string; name: string }[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // set human-friendly name derived from `lang`
  const langName = (() => {
    if (!lang) return null;
    if (typeof lang === "string") return lang;
    return (lang as any).name ?? (lang as any).code ?? null;
  })();

  async function setLangCode(code: string) {
    // keep simple: set local state; caller can also call backend if needed
    setLang(code);
    // optionally persist to localStorage / backend here
    return Promise.resolve();
  }

  const openLanguage = () => {
    setIsOpen(true);
  };
  const closeLanguage = () => {
    setIsOpen(false);
  };

  // global controller so AppHeader can call (similar to MenuController)
  useEffect(() => {
    (globalThis as any).LanguageController = {
      open: openLanguage,
      close: closeLanguage,
    };
    console.debug("[LanguageProvider] mounted");
    // fetch languages from backend if needed
    (async () => {
      try {
        // example endpoint — replace with your real one (or remove)
        const res = await fetch("https://eq21.co.in/_functions/langs");
        const data = await res.json();
        if (Array.isArray(data?.langs)) setAvailableLangs(data.langs);
      } catch (e) {
        // fallback defaults
        setAvailableLangs([
          { code: "EN", name: "English" },
          { code: "HI", name: "Hindi" },
        ]);
      }
    })();

    return () => {
      delete (globalThis as any).LanguageController;
      console.debug("[LanguageProvider] unmounted");
    };
  }, []);

  const value: LanguageContextValue = {
    lang,
    langName,
    availableLangs: availableLangs ?? undefined,
    openLanguage,
    closeLanguage,
    setLangCode,
    isOpen,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
      {/* Render modal UI from here so it's mounted at top-level and can overlay content */}
      <LanguageModal visible={isOpen} onClose={closeLanguage} anchorTop={anchorTop} />
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;