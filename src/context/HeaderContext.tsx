// src/context/HeaderContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";

type HeaderContextValue = {
  headerHeight: number;
  setHeaderHeight: (h: number) => void;
};

const HeaderContext = createContext<HeaderContextValue | undefined>(undefined);

export const HeaderProvider = ({ children }: { children?: ReactNode }) => {
  const [headerHeight, setHeaderHeight] = useState<number>(64);
  return (
    <HeaderContext.Provider value={{ headerHeight, setHeaderHeight }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = (): HeaderContextValue => {
  const ctx = useContext(HeaderContext);
  if (!ctx) throw new Error("useHeader must be used within HeaderProvider");
  return ctx;
};