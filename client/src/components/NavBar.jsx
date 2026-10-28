import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, User, Settings, LogOut, LayoutGrid } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { Dropdown } from 'react-bootstrap';
import '../styles/NavBar.css';
import { useT } from '../i18n/LanguageContext';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

const NavBar = ({ overlay = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useT();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // Slide away while reading down, come back on any scroll up.
      setHidden(y > 160 && y > lastY.current + 4);
      if (y < lastY.current - 4 || y < 160) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setIsMenuOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/';

    switch (user.role?.toLowerCase()) {
      case 'admin':
        return '/admin/dashboard';
      case 'official':
        switch (user.department?.toLowerCase()) {
          case 'rto':
            return '/official-dashboard/rto';
          case 'water':
            return '/official-dashboard/water';
          case 'electricity':
            return '/official-dashboard/electricity';
          default:
            return '/official-dashboard';
        }
      case 'petitioner':
        return '/petitioner/dashboard';
      default:
        return '/';
    }
  };

  const getSettingsPath = () => {
    if (!user) return '/settings';
    switch (user.role?.toLowerCase()) {
      case 'admin':
        return '/admin/settings';
      case 'official':
        switch (user.department?.toLowerCase()) {
          case 'rto':
            return '/official-dashboard/rto/settings';
          case 'water':
            return '/official-dashboard/water/settings';
          case 'electricity':
            return '/official-dashboard/electricity/settings';
          default:
            return '/official/settings';
        }
      case 'petitioner':
        return '/petitioner/settings';
      default:
        return '/settings';
    }
  };

  const links = [
    { to: '/#engine', label: t('nav.engine') },
    { to: '/#journey', label: t('nav.howItWorks') },
    { to: '/#track', label: t('nav.track') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const classes = [
    'tk-nav',
    overlay ? 'tk-nav--overlay' : '',
    scrolled ? 'is-scrolled' : '',
    hidden && !isMenuOpen ? 'is-hidden' : '',
    isMenuOpen ? 'is-open' : '',
  ].join(' ');

  return (
    <>
      <nav className={classes} aria-label={t('nav.main')}>
        <div className="tk-nav__inner">
          <Link to="/" className="tk-nav__brand" aria-label={t('nav.home')}>
            <span className="tk-nav__mark" aria-hidden="true">
              <i /><i /><i />
            </span>
            <span className="tk-nav__word">Theervu-Kaanal</span>
          </Link>

          <div className="tk-nav__links">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className="tk-nav__link">
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="tk-nav__actions">
            <LanguageSwitcher className="tk-nav__lang" />
            {user ? (
              <>
                <div className="tk-nav__bell">
                  <NotificationBell userId={user.id} userRole={user.role} />
                </div>
                <Dropdown align="end">
                  <Dropdown.Toggle variant="transparent" className="tk-nav__user" id="tk-user-menu">
                    <span className="tk-nav__avatar" aria-hidden="true">
                      {(user.firstName || user.email || '?').charAt(0).toUpperCase()}
                    </span>
                    <span className="d-none d-sm-inline">{user.firstName}</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to={getDashboardPath()}>
                      <LayoutGrid size={16} className="me-2" />
                      {t('nav.dashboard')}
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to={getSettingsPath()}>
                      <Settings size={16} className="me-2" />
                      {t('nav.settings')}
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <LogOut size={16} className="me-2" />
                      {t('nav.logout')}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <Link to="/login" className="tk-nav__link tk-nav__signin">
                  <User size={16} aria-hidden="true" /> {t('nav.signIn')}
                </Link>
                <Link to="/register" className="btn btn-primary tk-nav__cta">{t('nav.register')}</Link>
              </>
            )}

            <button
              className="tk-nav__toggle"
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls="tk-mobile-menu"
              aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      <div id="tk-mobile-menu" className={`tk-sheet ${isMenuOpen ? 'is-open' : ''}`} aria-hidden={!isMenuOpen}>
        <div className="tk-sheet__links">
          {links.map((l, i) => (
            <Link key={l.to} to={l.to} style={{ '--i': i }} tabIndex={isMenuOpen ? 0 : -1}>
              {l.label}
            </Link>
          ))}
          {user ? (
            <Link to={getDashboardPath()} style={{ '--i': links.length }} tabIndex={isMenuOpen ? 0 : -1}>
              {t('nav.dashboard')}
            </Link>
          ) : (
            <Link to="/login" style={{ '--i': links.length }} tabIndex={isMenuOpen ? 0 : -1}>
              {t('nav.signIn')}
            </Link>
          )}
        </div>
        <LanguageSwitcher className="tk-sheet__lang" />
        <p className="tk-sheet__foot tk-tamil">தீர்வு காணல்</p>
      </div>
    </>
  );
};

export default NavBar;
