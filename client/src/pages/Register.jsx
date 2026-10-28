import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { useT } from '../i18n/LanguageContext';

const ROLES = [
  { to: '/register/petitioner', key: 'petitioner' },
  { to: '/register/official', key: 'official' },
  { to: '/register/admin', key: 'admin', accent: true },
];

const Register = () => {
  const { t } = useT();
  return (
    <AuthShell
      role={t('register.role')}
      title={t('register.title')}
      lede={t('register.lede')}
      back="/"
      backLabel={t('common.home')}
      accentThread={4}
    >
      <ul className="tk-choices">
        {ROLES.map((r, i) => (
          <li key={r.to}>
            <Link to={r.to} className={`tk-choice ${r.accent ? 'tk-choice--accent' : ''}`} style={{ '--i': i }}>
              <span className="tk-choice__name">{t(`roles.${r.key}`)}</span>
              <span className="tk-choice__desc">{t(`register.desc.${r.key}`)}</span>
              <ArrowRight className="tk-choice__go" size={26} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="tk-auth__alt">
        {t('register.already')} <Link to="/login">{t('nav.signIn')}</Link>
      </p>
    </AuthShell>
  );
};

export default Register;
