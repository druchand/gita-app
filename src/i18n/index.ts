// src/i18n/index.ts
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import hi from "./hi.json";

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

const fallbackLng = "en";

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: fallbackLng,
    fallbackLng,
    compatibilityJSON: "v4",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

// SAFELY detect device language with fallbacks. We cast to `any` because
// expo-localization's TS types in some setups don't expose `locale` directly.
try {
  const locAny = Localization as any;
  // Possible shapes: locAny.locale (string), locAny.locales (array), or localeName
  let deviceLang = "";

  if (typeof locAny.locale === "string" && locAny.locale.length > 0) {
    deviceLang = String(locAny.locale).split("-")[0];
  } else if (Array.isArray(locAny.locales) && locAny.locales.length > 0) {
    // expo-localization may expose locales array similar to react-native-localize
    const first = locAny.locales[0];
    deviceLang = (first?.languageCode || first?.language || "").split("-")[0];
  } else if (typeof locAny.localeName === "string" && locAny.localeName.length > 0) {
    deviceLang = String(locAny.localeName).split("-")[0];
  }

  if ((deviceLang === "en" || deviceLang === "hi") && (resources as any)[deviceLang]) {
    i18n.changeLanguage(deviceLang as "en" | "hi");
  }
} catch (e) {
  console.warn("[i18n] locale detection failed (non-fatal)", e);
}

export default i18n;