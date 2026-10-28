import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AuthShell from '../components/AuthShell';

const ROLES = [
  { to: '/login/petitioner', name: 'Petitioner', desc: 'File a grievance, track it, chat with the official, rate the fix.' },
  { to: '/login/official', name: 'Department official', desc: 'Work the queue routed to your jurisdiction in Water, RTO or Electricity.' },
  { to: '/login/admin', name: 'Grievance cell', desc: 'Answer escalations, read analytics, ask Smart Query.', accent: true },
];

const Login = () => (
  <AuthShell
    role="Three desks, one record"
    title="Who is signing in?"
    lede="Every petition passes through the same timeline. Pick the desk you work from."
    back="/"
    backLabel="Home"
  >
    <ul className="tk-choices">
      {ROLES.map((r, i) => (
        <li key={r.to}>
          <Link to={r.to} className={`tk-choice ${r.accent ? 'tk-choice--accent' : ''}`} style={{ '--i': i }}>
            <span className="tk-choice__name">{r.name}</span>
            <span className="tk-choice__desc">{r.desc}</span>
            <ArrowRight className="tk-choice__go" size={26} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
    <p className="tk-auth__alt">
      No account yet? <Link to="/register">Register</Link>. Only want to check a petition?{' '}
      <Link to="/#track">Track it without signing in</Link>.
    </p>
  </AuthShell>
);

export default Login;
