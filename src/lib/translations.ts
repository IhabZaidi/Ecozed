import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import ar from "../locales/ar.json";
import en from "../locales/en.json";

export type Language = "ar" | "en";

export const translations = { ar, en };

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof ar;
}

const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "ar";
  
  // Try to get from cookie first
  const cookieMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
  if (cookieMatch && (cookieMatch[1] === "ar" || cookieMatch[1] === "en")) {
    return cookieMatch[1] as Language;
  }
  
  return "ar";
};

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: getInitialLanguage(),
      setLanguage: (lang) => {
        set({ language: lang });
        if (typeof window !== "undefined") {
          document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
          document.documentElement.lang = lang;
          // Set cookie for persistence (1 year)
          document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`;
        }
      },
      get t() {
        return translations[get().language] || translations.ar;
      },
    }),
    {
      name: "language-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure DOM is updated after hydration
          document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";
          document.documentElement.lang = state.language;
        }
      },
    }
  )
);
