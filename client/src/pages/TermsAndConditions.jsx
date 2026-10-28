import React from 'react';
import NavBar from '../components/NavBar';
import Footer from '../shared/Footer';
import { useT } from '../i18n/LanguageContext';

const ITEMS = ['use', 'accuracy', 'abuse'];

const TermsAndConditions = () => {
    const { t } = useT();
    return (
        <>
            <NavBar />
            <div className="container py-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-10 col-lg-8">
                        <div className="card shadow-sm border-0">
                            <div className="card-body">
                                <h2 className="mb-4 text-center">{t('legal.terms.title')}</h2>
                                <p>{t('legal.terms.intro')}</p>
                                <ul className="mb-4">
                                    {ITEMS.map((k) => <li key={k}>{t(`legal.terms.items.${k}`)}</li>)}
                                    <li>
                                        {t('legal.terms.privacyBefore')}{' '}
                                        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">{t('footer.privacy')}</a>.
                                    </li>
                                </ul>
                                <p>{t('legal.terms.outro')}</p>
                                <p className="text-muted small">{t('legal.englishPrevails')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default TermsAndConditions;
