// src/context/LanguageContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type LangItem = { code: string; name: string; _id?: string };

export interface LanguageContextValue {
  lang: string;                       // current language code, e.g. "EN"
  availableLangs: LangItem[];         // list shown in LanguageModal
  loading: boolean;                   // backend fetch in progress
  openLanguage: () => void;           // open modal
  closeLanguage: () => void;          // close modal
  selectLanguage: (code: string) => void; // set language and close modal
  isLanguageOpen: boolean;            // <-- used by LanguageModal
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

const FALLBACK_LANGS: LangItem[] = [
  { code: "EN", name: "English" },
  { code: "HI", name: "Hindi" },
];

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [lang, setLang] = useState<string>("EN");
  const [availableLangs, setAvailable] = useState<LangItem[]>(
    FALLBACK_LANGS
  );
  const [loading, setLoading] = useState<boolean>(false);

  // Modal visibility managed here so LanguageModal can read it
  const [isLanguageOpen, setIsLanguageOpen] = useState<boolean>(false);

  const openLanguage = () => setIsLanguageOpen(true);
  const closeLanguage = () => setIsLanguageOpen(false);

  // Select + close; external screens can refetch on lang change
  const selectLanguage = (code: string) => {
    setLang(code);
    setIsLanguageOpen(false);
  };

  // Load available languages from backend (defensive; fallback kept)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("https://eq21.co.in/_functions/AppLanguages");
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        // Expect either array of { code, name } or normalize common shapes
        if (!cancelled && Array.isArray(data) && data.length) {
          const norm: LangItem[] = data
            .map((x: any) => ({
              _id: x._id ?? x.id,
              code: x.code ?? x.id ?? "",
              name: x.name ?? x.title ?? "",
            }))
            .filter((x) => x.code && x.name);
          if (norm.length) setAvailable(norm);
        }
      } catch (e) {
        // swallow; fallback already in state
        console.warn("[LanguageProvider] Failed to load languages:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      availableLangs,
      loading,
      openLanguage,
      closeLanguage,
      selectLanguage,
      isLanguageOpen,
    }),
    [lang, availableLangs, loading, isLanguageOpen]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}