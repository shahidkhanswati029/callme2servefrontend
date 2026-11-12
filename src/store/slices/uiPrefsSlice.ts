import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { isUiLanguage, type UiLanguage } from "@/shared/i18n";
import { currencyForCountry } from "@/shared/countries";

export type ThemeMode = "light" | "dark";

export type UiPrefsState = {
  theme: ThemeMode;
  language: UiLanguage;
  countryCode: string;
  currency: string;
  sidebarOpen: boolean;
  hydrated: boolean;
};

const STORAGE_KEY = "cmts_ui_prefs";

function readStored(): Partial<UiPrefsState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<UiPrefsState>;
  } catch {
    return {};
  }
}

function persist(state: UiPrefsState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme: state.theme,
        language: state.language,
        countryCode: state.countryCode,
        currency: state.currency,
        sidebarOpen: state.sidebarOpen,
      }),
    );
  } catch {
    // ignore quota
  }
}

const stored = typeof window !== "undefined" ? readStored() : {};

const initialState: UiPrefsState = {
  theme: stored.theme === "dark" ? "dark" : "light",
  language: stored.language && isUiLanguage(stored.language) ? stored.language : "en",
  countryCode:
    typeof stored.countryCode === "string" && stored.countryCode ? stored.countryCode : "PK",
  currency:
    typeof stored.currency === "string" && stored.currency
      ? stored.currency
      : currencyForCountry(typeof stored.countryCode === "string" ? stored.countryCode : "PK"),
  sidebarOpen: stored.sidebarOpen !== false,
  hydrated: false,
};

const uiPrefsSlice = createSlice({
  name: "uiPrefs",
  initialState,
  reducers: {
    hydrateUiPrefs(state) {
      const next = readStored();
      if (next.theme === "light" || next.theme === "dark") state.theme = next.theme;
      if (next.language && isUiLanguage(next.language)) {
        state.language = next.language;
      }
      if (typeof next.countryCode === "string" && next.countryCode) {
        state.countryCode = next.countryCode;
      }
      if (typeof next.currency === "string" && next.currency) {
        state.currency = next.currency;
      } else if (state.countryCode) {
        state.currency = currencyForCountry(state.countryCode);
      }
      if (typeof next.sidebarOpen === "boolean") state.sidebarOpen = next.sidebarOpen;
      state.hydrated = true;
      persist(state);
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
      persist(state);
    },
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
      persist(state);
    },
    setUiLanguage(state, action: PayloadAction<UiLanguage>) {
      state.language = action.payload;
      persist(state);
    },
    setCountry(state, action: PayloadAction<string>) {
      state.countryCode = action.payload;
      state.currency = currencyForCountry(action.payload);
      persist(state);
    },
    setCurrency(state, action: PayloadAction<string>) {
      state.currency = action.payload;
      persist(state);
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
      persist(state);
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
      persist(state);
    },
  },
});

export const {
  hydrateUiPrefs,
  setTheme,
  toggleTheme,
  setUiLanguage,
  setCountry,
  setCurrency,
  setSidebarOpen,
  toggleSidebar,
} = uiPrefsSlice.actions;
export default uiPrefsSlice.reducer;
