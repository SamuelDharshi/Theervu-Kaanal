import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="tk-footer">
      <div className="tk-footer__sdg" data-reveal>
        <p className="tk-footer__sdg-lead">UN Sustainable Development Goals</p>
        <div className="tk-footer__goal">
          <span className="tk-footer__badge" style={{ background: 'var(--sdg16)' }}>16<small>SDG</small></span>
          <span>
            <strong>Peace, Justice and Strong Institutions</strong>
            <em>Target 16.6 accountable, transparent institutions</em>
          </span>
        </div>
        <div className="tk-footer__goal">
          <span className="tk-footer__badge" style={{ background: 'var(--sdg10)' }}>10<small>SDG</small></span>
          <span>
            <strong>Reduced Inequalities</strong>
            <em>Target 10.2 public services open to every citizen</em>
          </span>
        </div>
      </div>

      <div className="tk-footer__cols">
        <div>
          <h2 className="tk-footer__h">Citizens</h2>
          <Link to="/submit-grievance">File a grievance</Link>
          <Link to="/#track">Track a petition</Link>
          <Link to="/register/petitioner">Create an account</Link>
        </div>
        <div>
          <h2 className="tk-footer__h">Staff</h2>
          <Link to="/login/official">Department officials</Link>
          <Link to="/login/admin">Grievance cell</Link>
          <Link to="/register/official">Official registration</Link>
        </div>
        <div>
          <h2 className="tk-footer__h">About</h2>
          <Link to="/about">How it works</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy-policy">Privacy policy</Link>
          <Link to="/terms-and-conditions">Terms and conditions</Link>
        </div>
        <div>
          <h2 className="tk-footer__h">Built with</h2>
          <span>React, Material UI</span>
          <span>Express, MongoDB, Socket.io</span>
          <span>Gemini, Stream Chat, Supabase</span>
        </div>
      </div>

      <div className="tk-footer__mark" aria-hidden="true">
        <span className="tk-tamil">தீர்வு காணல்</span>
      </div>

      <div className="tk-footer__base">
        <span>&copy; {new Date().getFullYear()} Theervu-Kaanal · Grievance redressal for Tamil Nadu</span>
        <a href="#top" onClick={(e) => { e.preventDefault(); (window.__lenis ? window.__lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' })); }}>
          Back to top ↑
        </a>
      </div>
    </footer>
  );
};

export default Footer;
