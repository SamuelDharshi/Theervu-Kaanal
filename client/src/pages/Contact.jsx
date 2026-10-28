import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import NavBar from '../components/NavBar';
import Footer from '../shared/Footer';
import '../styles/Doc.css';
import { useT } from '../i18n/LanguageContext';

const Contact = () => {
  const [message, setMessage] = useState('');
  const { t } = useT();

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(t('contact.sent'));
    setMessage('');
  };

  return (
    <div className="tk-doc">
      <NavBar />
      <div className="tk-doc__split">
        <header>
          <h1 className="tk-doc__title">{t('contact.title')}</h1>
          <p className="tk-doc__lede">
            {t('contact.ledeBefore')} <Link to="/submit-grievance">{t('contact.ledeLink')}</Link> {t('contact.ledeAfter')}
          </p>
        </header>
        <form onSubmit={handleSubmit} className="tk-doc__form">
          <label htmlFor="message" className="form-label">{t('contact.message')}</label>
          <textarea
            id="message"
            className="form-control"
            rows="7"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary btn-lg">{t('contact.send')}</button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
