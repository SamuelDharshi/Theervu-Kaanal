import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AuthShell from '../components/AuthShell';

const ROLES = [
  { to: '/register/petitioner', name: 'Petitioner', desc: 'For citizens. File petitions and follow them to resolution.' },
  { to: '/register/official', name: 'Department official', desc: 'For officers in Water, RTO and Electricity. Needs your employee ID.' },
  { to: '/register/admin', name: 'Grievance cell', desc: 'For administrators who handle escalations.', accent: true },
];

const Register = () => (
  <AuthShell
    role="Join the record"
    title="Create an account"
    lede="Choose the kind of account. You can track any petition without one."
    back="/"
    backLabel="Home"
    accentThread={4}
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
      Already registered? <Link to="/login">Sign in</Link>
    </p>
  </AuthShell>
);

export default Register;
