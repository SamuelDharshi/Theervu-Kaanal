import React from 'react';
import NavBar from '../components/NavBar';
import Footer from '../shared/Footer';
import { useT } from '../i18n/LanguageContext';

const ITEMS = ['minimal', 'secure', 'rights', 'cookies', 'contact'];

const PrivacyPolicy = () => {
    const { t } = useT();
    return (
        <>
            <NavBar />
            <div className="container py-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-10 col-lg-8">
                        <div className="card shadow-sm border-0">
                            <div className="card-body">
                                <h2 className="mb-4 text-center">{t('footer.privacy')}</h2>
                                <p>{t('legal.privacy.intro')}</p>
                                <ul className="mb-4">
                                    {ITEMS.map((k) => <li key={k}>{t(`legal.privacy.items.${k}`)}</li>)}
                                </ul>
                                <p>{t('legal.privacy.outro')}</p>
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

export default PrivacyPolicy;
