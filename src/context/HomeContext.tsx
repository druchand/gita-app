import { useLanguage } from "@/context/LanguageContext";
import React, { createContext, useContext, useEffect, useState } from "react";

export type HomeData = {
  intro?: string;
  quote?: string;
  sections?: { title: string; content: string }[];
};

type HomeContextValue = {
  homeData?: HomeData;
  isLoading: boolean;
  refreshHome: () => Promise<void>;
};

const HomeContext = createContext<HomeContextValue | undefined>(undefined);

export const HomeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useLanguage();
  const [homeData, setHomeData] = useState<HomeData | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const fetchHome = async () => {
    if (!lang) return;
    setIsLoading(true);
    try {
      const url = `https://eq21.co.in/_functions/AppHome?lang=${lang}`;
      console.debug("[home] fetchHome ->", url);
      const res = await fetch(url);
      const json = await res.json();
      setHomeData(json);
    } catch (err) {
      console.warn("[home] fetchHome error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHome();
  }, [lang]);

  return (
    <HomeContext.Provider value={{ homeData, isLoading, refreshHome: fetchHome }}>
      {children}
    </HomeContext.Provider>
  );
};

export const useHome = () => {
  const ctx = useContext(HomeContext);
  if (!ctx) throw new Error("useHome must be used within HomeProvider");
  return ctx;
};