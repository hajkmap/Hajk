import { PaletteMode } from "@mui/material";
import { create } from "zustand";
import i18n, { Language } from "../i18n/i18n";

interface AppState {
  language: string;
  themeMode: PaletteMode;
  apiBaseUrl: string;
  loading: boolean;
  setLanguage: (lang: Language) => void;
  setThemeMode: (theme: PaletteMode) => void;
  loadConfig: () => Promise<void>;
}

const getDefaultThemeMode = () => {
  const themeModeFromLs = window.localStorage.getItem("userPreferredTheme")
    ? window.localStorage.getItem("userPreferredTheme") ?? ""
    : "";
  const defaultThemeMode = (
    ["light", "dark"].includes(themeModeFromLs) ? themeModeFromLs : "light"
  ) as PaletteMode;

  return defaultThemeMode;
};

const useAppStateStore = create<AppState>((set) => ({
  language: localStorage.getItem("language") ?? "en",
  themeMode: getDefaultThemeMode(),
  apiBaseUrl: "",
  loading: true,

  setLanguage: (lang: string) => {
    localStorage.setItem("language", lang);
    void i18n.changeLanguage(lang);
    set({ language: lang });
  },

  setThemeMode: (mode: PaletteMode) => {
    localStorage.setItem("userPreferredTheme", mode);
    set({ themeMode: mode });
  },

  loadConfig: async () => {
    try {
      const response = await fetch("/config.json");
      const config = (await response.json()) as Record<string, unknown>;
      set({
        apiBaseUrl:
          typeof config.apiBaseUrl === "string" ? config.apiBaseUrl : "",
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load config:", error);
      set({ loading: false });
    }
  },
}));

export default useAppStateStore;
