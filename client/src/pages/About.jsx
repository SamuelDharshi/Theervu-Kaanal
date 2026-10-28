import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import NavBar from '../components/NavBar';
import Footer from '../shared/Footer';
import { useT } from '../i18n/LanguageContext';
import '../styles/Doc.css';

const ROW_KEYS = ['desk', 'visibility', 'stall', 'repeat', 'planning', 'reports'];

const About = () => {
  const { t } = useT();
  return (
    <div className="tk-doc">
      <NavBar />
      <header className="tk-doc__hero">
        <p className="tk-doc__tamil tk-tamil" lang="ta">தீர்வு காணல்</p>
        <h1 className="tk-doc__title">{t('about.title')}</h1>
        <p className="tk-doc__lede">{t('about.lede')}</p>
      </header>

      <section className="tk-doc__table" aria-labelledby="about-problems">
        <h2 id="about-problems">{t('about.fixesTitle')}</h2>
        <ul>
          {ROW_KEYS.map((k, i) => (
            <li key={k} data-reveal style={{ '--reveal-delay': `${(i % 2) * 70}ms` }}>
              <h3>{t(`about.rows.${k}.problem`)}</h3>
              <p>{t(`about.rows.${k}.fix`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="tk-doc__band" aria-labelledby="about-local">
        <h2 id="about-local" data-reveal>{t('about.localTitle')}</h2>
        <p data-reveal style={{ '--reveal-delay': '80ms' }}>{t('about.localBody')}</p>
        <Link to="/#journey" className="btn btn-light btn-lg" data-reveal>
          {t('landing.follow')} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
      <Footer />
    </div>
  );
};

export default About;
