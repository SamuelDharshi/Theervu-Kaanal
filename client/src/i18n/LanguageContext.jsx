import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en';
import ta from './ta';
import hi from './hi';

// English, Tamil and Hindi. `locale` formats dates and numbers; `speech` is the
// Web Speech API language used for voice input on the grievance form.
export const LANGUAGES = {
  en: { label: 'English', short: 'EN', locale: 'en-IN', speech: 'en-IN', dict: en },
  ta: { label: 'தமிழ்', short: 'த', locale: 'ta-IN', speech: 'ta-IN', dict: ta },
  hi: { label: 'हिन्दी', short: 'हि', locale: 'hi-IN', speech: 'hi-IN', dict: hi },
};

const STORAGE_KEY = 'tk-lang';

const initialLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES[saved]) return saved;
  } catch (e) {
    // Storage blocked: fall through to the browser's language.
  }
  const nav = (typeof navigator !== 'undefined' && navigator.language) || 'en';
  const code = nav.slice(0, 2).toLowerCase();
  return LANGUAGES[code] ? code : 'en';
};

const lookup = (dict, key) => key.split('.').reduce((node, part) => (node == null ? node : node[part]), dict);

const interpolate = (value, vars) =>
  typeof value === 'string' && vars
    ? value.replace(/\{(\w+)\}/g, (m, name) => (vars[name] !== undefined ? vars[name] : m))
    : value;

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLanguage);

  const setLang = useCallback((next) => {
    if (!LANGUAGES[next]) return;
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* not persisted */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    const { dict, locale, speech } = LANGUAGES[lang];
    // A missing translation falls back to English, then to the key itself.
    const t = (key, vars) => {
      let v = lookup(dict, key);
      if (v === undefined) v = lookup(en, key);
      if (v === undefined) {
        if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] missing key: ${key}`);
        return key;
      }
      return interpolate(v, vars);
    };
    const formatDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
      d ? new Date(d).toLocaleDateString(locale, opts) : '—';
    return { lang, setLang, t, locale, speech, formatDate };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useT = () => useContext(LanguageContext);
