import { PaletteMode } from "@mui/material";
import { create } from "zustand";
import i18n, { Language } from "../i18n/i18n";
import { checkBackendReachable } from "../lib/backend-health";

interface AppState {
  language: string;
  themeMode: PaletteMode;
  sidebarLocked: boolean;
  defaultMap: string | null;
  editorSpellcheckEnabled: boolean;
  apiBaseUrl: string;
  axiosConfigOverrides: Record<string, unknown>;
  servicesDefault: Record<string, unknown>;
  layersDefault: Record<string, unknown>;
  mapsDefault: Record<string, unknown>;
  defaultCoordinates: string[];
  loading: boolean;
  backendStatus: "checking" | "online" | "offline";
  setLanguage: (lang: Language) => void;
  setThemeMode: (theme: PaletteMode) => void;
  setSidebarLocked: (locked: boolean) => void;
  setDefaultMap: (mapName: string) => void;
  setEditorSpellcheckEnabled: (enabled: boolean) => void;
  loadConfig: () => Promise<void>;
  checkBackend: () => Promise<void>;
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

const getDefaultEditorSpellcheckEnabled = () => {
  const stored = localStorage.getItem("editorSpellcheckEnabled");
  if (stored !== null) return stored === "true";

  // Migrate legacy key from early rich-text editor implementation
  const legacy = localStorage.getItem("dh-rich-text-editor-spellcheck");
  if (legacy !== null) {
    localStorage.setItem("editorSpellcheckEnabled", legacy);
    localStorage.removeItem("dh-rich-text-editor-spellcheck");
    return legacy === "true";
  }

  return true;
};

const useAppStateStore = create<AppState>((set) => ({
  language: localStorage.getItem("language") ?? "sv",
  themeMode: getDefaultThemeMode(),
  sidebarLocked: getDefaultSidebarLocked(),
  defaultMap: localStorage.getItem("defaultMap"),
  editorSpellcheckEnabled: getDefaultEditorSpellcheckEnabled(),
  apiBaseUrl: "",
  axiosConfigOverrides: {},
  servicesDefault: {},
  layersDefault: {},
  mapsDefault: {},
  defaultCoordinates: [],
  loading: true,
  backendStatus: "checking",

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

  setDefaultMap: (mapName: string) => {
    localStorage.setItem("defaultMap", mapName);
    set({ defaultMap: mapName });
  },

  setEditorSpellcheckEnabled: (enabled: boolean) => {
    localStorage.setItem("editorSpellcheckEnabled", String(enabled));
    set({ editorSpellcheckEnabled: enabled });
  },

  loadConfig: async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const response = await fetch(`${baseUrl}/config.json`);
      const config = (await response.json()) as Record<string, unknown>;

      set({
        apiBaseUrl:
          typeof config.apiBaseUrl === "string" ? config.apiBaseUrl : "",
        axiosConfigOverrides: (config.axiosConfigOverrides ?? {}) as Record<
          string,
          unknown
        >,
        servicesDefault: (config.servicesDefault ?? {}) as Record<
          string,
          unknown
        >,
        layersDefault: (config.layersDefault ?? {}) as Record<string, unknown>,
        mapsDefault: (config.mapsDefault ?? {}) as Record<string, unknown>,
        defaultCoordinates: (config.defaultCoordinates ?? []) as string[],
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load config:", error);
      set({ loading: false });
    }
  },

  checkBackend: async () => {
    const { apiBaseUrl } = useAppStateStore.getState();
    set({ backendStatus: "checking" });
    const reachable = await checkBackendReachable(apiBaseUrl);
    set({ backendStatus: reachable ? "online" : "offline" });
  },
}));

export default useAppStateStore;
