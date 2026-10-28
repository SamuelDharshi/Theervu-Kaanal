import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { useT } from '../i18n/LanguageContext';

const ROLES = [
  { to: '/login/petitioner', key: 'petitioner' },
  { to: '/login/official', key: 'official' },
  { to: '/login/admin', key: 'admin', accent: true },
];

const Login = () => {
  const { t } = useT();
  return (
    <AuthShell
      role={t('login.role')}
      title={t('login.title')}
      lede={t('login.lede')}
      back="/"
      backLabel={t('common.home')}
    >
      <ul className="tk-choices">
        {ROLES.map((r, i) => (
          <li key={r.to}>
            <Link to={r.to} className={`tk-choice ${r.accent ? 'tk-choice--accent' : ''}`} style={{ '--i': i }}>
              <span className="tk-choice__name">{t(`roles.${r.key}`)}</span>
              <span className="tk-choice__desc">{t(`login.desc.${r.key}`)}</span>
              <ArrowRight className="tk-choice__go" size={26} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="tk-auth__alt">
        {t('login.noAccount')} <Link to="/register">{t('nav.register')}</Link>. {t('login.onlyCheck')}{' '}
        <Link to="/#track">{t('login.trackWithout')}</Link>.
      </p>
    </AuthShell>
  );
};

export default Login;
