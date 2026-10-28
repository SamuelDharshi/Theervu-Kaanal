import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';
import { useT } from '../i18n/LanguageContext';

const Footer = () => {
  const { t } = useT();
  return (
    <footer className="tk-footer">
      <div className="tk-footer__sdg" data-reveal>
        <p className="tk-footer__sdg-lead">{t('footer.sdgLead')}</p>
        <div className="tk-footer__goal">
          <span className="tk-footer__badge" style={{ background: 'var(--sdg16)' }}>16<small>SDG</small></span>
          <span>
            <strong>{t('footer.sdg16')}</strong>
            <em>{t('footer.sdg16Target')}</em>
          </span>
        </div>
        <div className="tk-footer__goal">
          <span className="tk-footer__badge" style={{ background: 'var(--sdg10)' }}>10<small>SDG</small></span>
          <span>
            <strong>{t('footer.sdg10')}</strong>
            <em>{t('footer.sdg10Target')}</em>
          </span>
        </div>
      </div>

      <div className="tk-footer__cols">
        <div>
          <h2 className="tk-footer__h">{t('footer.citizens')}</h2>
          <Link to="/submit-grievance">{t('common.fileGrievance')}</Link>
          <Link to="/#track">{t('nav.track')}</Link>
          <Link to="/register/petitioner">{t('footer.createAccount')}</Link>
        </div>
        <div>
          <h2 className="tk-footer__h">{t('footer.staff')}</h2>
          <Link to="/login/official">{t('footer.officials')}</Link>
          <Link to="/login/admin">{t('common.grievanceCell')}</Link>
          <Link to="/register/official">{t('footer.officialRegistration')}</Link>
        </div>
        <div>
          <h2 className="tk-footer__h">{t('nav.about')}</h2>
          <Link to="/about">{t('nav.howItWorks')}</Link>
          <Link to="/contact">{t('nav.contact')}</Link>
          <Link to="/privacy-policy">{t('footer.privacy')}</Link>
          <Link to="/terms-and-conditions">{t('footer.terms')}</Link>
        </div>
        <div>
          <h2 className="tk-footer__h">{t('footer.builtWith')}</h2>
          <span>React, Material UI</span>
          <span>Express, MongoDB, Socket.io</span>
          <span>Gemini, Stream Chat, Supabase</span>
        </div>
      </div>

      <div className="tk-footer__mark" aria-hidden="true">
        <span className="tk-tamil">தீர்வு காணல்</span>
      </div>

      <div className="tk-footer__base">
        <span>&copy; {new Date().getFullYear()} Theervu-Kaanal · {t('footer.tagline')}</span>
        <a href="#top" onClick={(e) => { e.preventDefault(); (window.__lenis ? window.__lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' })); }}>
          {t('footer.backToTop')} ↑
        </a>
      </div>
    </footer>
  );
};

export default Footer;
