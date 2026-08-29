/**
 * Tiny gettext-style i18n.
 *
 * The Traditional-Chinese source strings ARE the keys: `t("原文")` returns the
 * text verbatim in zh and looks it up in the flat zh→en dictionary for en,
 * falling back to the Chinese when a translation is missing — the site never
 * breaks on a gap. `{var}` placeholders interpolate after lookup, so one key
 * covers both languages. verify_i18n asserts every key used in the components
 * exists in the dictionary and that placeholders survive translation.
 */
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { EN } from "./i18n-en";

export type Locale = "zh" | "en";

const I18nContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void } | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");
  // localStorage can throw (privacy mode, previews); the default then stands.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("q9-locale");
      if (saved === "en" || saved === "zh") setLocaleState(saved);
    } catch {}
  }, []);
  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("q9-locale", l);
    } catch {}
    document.documentElement.lang = l === "zh" ? "zh-Hant" : "en";
  };
  return <I18nContext.Provider value={{ locale, setLocale }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  const { locale, setLocale } = ctx;
  const t = (zh: string, vars?: Record<string, string | number>): string => {
    let s = locale === "en" ? (EN[zh] ?? zh) : zh;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    }
    return s;
  };
  return { locale, setLocale, t };
}
