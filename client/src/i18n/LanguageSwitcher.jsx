import React from 'react';
import { LANGUAGES, useT } from './LanguageContext';

// Three plain buttons, each labelled in its own script.
export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, t } = useT();
  return (
    <div className={`tk-lang ${className}`} role="group" aria-label={t('common.language')}>
      {Object.entries(LANGUAGES).map(([code, l]) => (
        <button
          key={code}
          type="button"
          lang={code}
          className={code === lang ? 'is-on' : ''}
          aria-pressed={code === lang}
          onClick={() => setLang(code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
