import { createContext, useContext, useState } from "react";

const LANGUAGES = ["az", "ru", "en"];
const STORAGE_KEY = "rateup_dashboard_language";

const DashboardLanguageContext = createContext(null);

export function DashboardLanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(savedLanguage) ? savedLanguage : "az";
  });

  const setLanguage = (nextLanguage) => {
    if (!LANGUAGES.includes(nextLanguage)) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, nextLanguage);
    setLanguageState(nextLanguage);
  };

  return (
    <DashboardLanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </DashboardLanguageContext.Provider>
  );
}

export function useDashboardLanguage() {
  const context = useContext(DashboardLanguageContext);
  if (!context) {
    throw new Error(
      "useDashboardLanguage must be used within DashboardLanguageProvider",
    );
  }
  return context;
}
