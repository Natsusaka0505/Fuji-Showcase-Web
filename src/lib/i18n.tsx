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
import { JA } from "./i18n-ja";

export type Locale = "zh" | "en" | "ja";

const DICT: Record<Locale, Record<string, string> | null> = { zh: null, en: EN, ja: JA };
const HTML_LANG: Record<Locale, string> = { zh: "zh-Hant", en: "en", ja: "ja" };
// Browser-tab title per locale (server-rendered as zh, the default locale).
const TITLE: Record<Locale, string> = {
  zh: "Q-Logistics — 風險感知全球供應鏈路徑優化",
  en: "Q-Logistics — Risk-aware global supply-chain routing",
  ja: "Q-Logistics — リスク認識型グローバルサプライチェーン経路最適化",
};

const I18nContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void } | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");
  // localStorage can throw (privacy mode, previews); the default then stands.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("q9-locale");
      if (saved === "en" || saved === "zh" || saved === "ja") setLocaleState(saved);
    } catch {}
  }, []);
  // Keep <html lang> and the tab title in step with the locale, including the
  // localStorage restore above (which previously left lang at zh-Hant).
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);
  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("q9-locale", l);
    } catch {}
  };
  // React 19 hoists <title> into <head>; rendering it here lets the browser tab follow the
  // locale (layout.tsx no longer sets a metadata title, so there is exactly one <title>).
  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <title>{TITLE[locale]}</title>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  const { locale, setLocale } = ctx;
  const t = (zh: string, vars?: Record<string, string | number>): string => {
    let s = DICT[locale]?.[zh] ?? zh;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    }
    return s;
  };
  return { locale, setLocale, t };
}
