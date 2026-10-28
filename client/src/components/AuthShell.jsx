import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NavBar from './NavBar';
import '../styles/Auth.css';

/*
 * Shared frame for sign-in, registration and role-choice pages: a dark panel
 * that says who this desk is for, beside the form on paper. The panel's
 * threads repeat the landing page's field in miniature, a few drawn in red.
 */
const THREADS = Array.from({ length: 22 }, (_, i) => i);

export default function AuthShell({ role, title, lede, back = '/', backLabel = 'Back', accentThread = 1, wide = false, children }) {
  return (
    <div className="tk-auth">
      <NavBar />
      <div className={`tk-auth__grid ${wide ? 'tk-auth__grid--wide' : ''}`}>
        <aside className="tk-auth__panel">
          <div className="tk-auth__threads" aria-hidden="true">
            {THREADS.map((i) => (
              <span
                key={i}
                className={i % 7 === accentThread ? 'is-accent' : ''}
                style={{ '--i': i, '--w': `${1 + (i % 3)}px`, '--x': `${(i * 37) % 100}%` }}
              />
            ))}
          </div>
          <div className="tk-auth__panel-text">
            <p className="tk-auth__tamil tk-tamil" lang="ta">தீர்வு காணல்</p>
            {role && <p className="tk-auth__role">{role}</p>}
          </div>
        </aside>

        <main className="tk-auth__main">
          <Link to={back} className="tk-auth__back">
            <ArrowLeft size={16} aria-hidden="true" /> {backLabel}
          </Link>
          <h1 className="tk-auth__title">{title}</h1>
          {lede && <p className="tk-auth__lede">{lede}</p>}
          <div className="tk-auth__body">{children}</div>
        </main>
      </div>
    </div>
  );
}
