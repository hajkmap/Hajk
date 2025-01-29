import { PaletteMode } from "@mui/material";
import { create } from "zustand";
import i18n, { Language } from "../i18n/i18n";

interface AppState {
  language: string;
  themeMode: PaletteMode;
  sidebarLocked: boolean;
  apiBaseUrl: string;
  axiosConfigOverrides: Record<string, unknown>;
  servicesDefault: Record<string, unknown>;
  loading: boolean;
  setLanguage: (lang: Language) => void;
  setThemeMode: (theme: PaletteMode) => void;
  setSidebarLocked: (locked: boolean) => void;
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

const getDefaultSidebarLocked = () => {
  const value = localStorage.getItem("sidebarLocked");

  if (!value) {
    // Locked as default
    return true;
  }
  return value === "true" ? true : false;
};

const useAppStateStore = create<AppState>((set) => ({
  language: localStorage.getItem("language") ?? "sv",
  themeMode: getDefaultThemeMode(),
  sidebarLocked: getDefaultSidebarLocked(),
  apiBaseUrl: "",
  axiosConfigOverrides: {},
  servicesDefault: {},
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

  setSidebarLocked: (locked: boolean) => {
    localStorage.setItem("sidebarLocked", locked.toString());
    set({ sidebarLocked: locked });
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

      set({
        axiosConfigOverrides: config.axiosConfigOverrides as
          | Record<string, unknown>
          | undefined,
      });

      set({
        servicesDefault: config.servicesDefault as Record<string, unknown>,
      });
    } catch (error) {
      console.error("Failed to load config:", error);
      set({ loading: false });
    }
  },
}));

export default useAppStateStore;
