// context/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type LanguageItem = {
  id: string;      // e.g. "EN", "HI", "FR"
  name: string;    // human label/display (what the backend provides)
  // any other fields returned by backend are allowed but not required
};

type LanguageContextType = {
  languages: LanguageItem[];
  loadingLanguages: boolean;
  lang: string;         // selected language code
  langName: string;     // selected language human label
  setLang: (l: string) => void;
};

const DEFAULT_LANGUAGES: LanguageItem[] = [
  { id: "EN", name: "English" },
  { id: "HI", name: "हिन्दी" },
];

const LANGS_URL = "https://eq21.co.in/_functions/langs"; // <- change if your endpoint differs

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  console.log("[LanguageProvider] mounted");
  const [languages, setLanguages] = useState<LanguageItem[]>(DEFAULT_LANGUAGES);
  const [loadingLanguages, setLoadingLanguages] = useState<boolean>(false);
  const [lang, setLangState] = useState<string>(DEFAULT_LANGUAGES[0].id);

  // get human name for current lang (falls back to code)
  const langName = useMemo(() => {
    const found = languages.find((l) => l.id === lang);
    return found ? found.name : lang;
  }, [languages, lang]);
  
  // Fetch languages list from backend once
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchLanguages() {
      setLoadingLanguages(true);
      try {
        const res = await fetch(LANGS_URL, { signal: controller.signal });
        if (!res.ok) {
          console.warn("[LanguageContext] languages fetch failed", res.status);
          setLoadingLanguages(false);
          return;
        }
        const json = await res.json();
        // backend might return { languages: [...] } or an array directly
        const list: any[] = Array.isArray(json) ? json : json.languages ?? [];
        if (!list || list.length === 0) {
          setLoadingLanguages(false);
          return;
        }
        // Normalize items to { id, name }
        const normalized = list.map((it: any) => ({
          id: String(it.id ?? it.code ?? it.lang ?? it.key),
          name: String(it.name ?? it.label ?? it.langName ?? it.display ?? it.id),
        }));
        if (mounted) {
          setLanguages(normalized);
          // if current lang is not in list, pick first from server
          const hasSelected = normalized.some((i: any) => i.id === lang);
          if (!hasSelected) {
            setLangState(normalized[0].id);
          }
        }
      } catch (e) {
        if ((e as any).name === "AbortError") {
          /* ignore */
        } else {
          console.warn("[LanguageContext] fetch error", e);
        }
      } finally {
        if (mounted) setLoadingLanguages(false);
      }
    }

    fetchLanguages();

    return () => {
      mounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // runs once

  const setLang = (l: string) => {
    // allow setting even if not in list (server may add later)
    setLangState(l);
  };

  const value = useMemo(
    () => ({
      languages,
      loadingLanguages,
      lang,
      langName,
      setLang,
    }),
    [languages, loadingLanguages, lang, langName]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

export default LanguageContext;
