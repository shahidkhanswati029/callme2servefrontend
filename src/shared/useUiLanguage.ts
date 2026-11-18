"use client";

import { useAppSelector } from "@/store/hooks";
import { isUiLanguage, type UiLanguage } from "@/shared/i18n";

/** Active UI language from Redux (language changer source of truth). */
export function useUiLanguage(): UiLanguage {
  const language = useAppSelector((s) => s.uiPrefs.language);
  return isUiLanguage(language) ? language : "en";
}
