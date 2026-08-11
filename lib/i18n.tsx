import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Language = "ar" | "en";
const LANGUAGE_KEY = "beauty-connect-language";

type Dictionary = {
  profile: string;
  bookingStatus: string;
  pending: string;
  approved: string;
  preferences: string;
  language: string;
  theme: string;
  light: string;
  dark: string;
  arabic: string;
  english: string;
  savePreferences: string;
};

const translations: Record<Language, Dictionary> = {
  ar: {
    profile: "حسابي",
    bookingStatus: "حالة الموعد القادم",
    pending: "قيد الانتظار",
    approved: "تمت الموافقة",
    preferences: "تفضيلات التطبيق",
    language: "اللغة",
    theme: "المظهر",
    light: "فاتح",
    dark: "داكن",
    arabic: "العربية",
    english: "English",
    savePreferences: "تُحفظ التفضيلات تلقائياً على هذا الجهاز.",
  },
  en: {
    profile: "My profile",
    bookingStatus: "Next appointment status",
    pending: "Pending",
    approved: "Approved",
    preferences: "App preferences",
    language: "Language",
    theme: "Appearance",
    light: "Light",
    dark: "Dark",
    arabic: "العربية",
    english: "English",
    savePreferences: "Preferences are saved automatically on this device.",
  },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored === "ar" || stored === "en") setLanguageState(stored);
    });
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    void AsyncStorage.setItem(LANGUAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({ language, setLanguage, t: translations[language] }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
