import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import NavBar from '../components/NavBar';
import Footer from '../shared/Footer';
import '../styles/Doc.css';

const ROWS = [
  {
    problem: 'Complaints go to the wrong desk.',
    fix: 'Each grievance is assigned by department and taluk to the official for that jurisdiction, with its priority read by Gemini or, offline, by keyword rules.',
  },
  {
    problem: 'Nobody can see what happened after filing.',
    fix: 'Anyone can track a petition by its ID, stage by stage: filed, under review, investigation, resolution. Petitioners also get notifications.',
  },
  {
    problem: 'Cases sit for weeks.',
    fix: 'Every official action is logged. Petitioners can escalate with a reason, and a check every day at noon flags overdue cases for the grievance cell.',
  },
  {
    problem: 'The same fault is reported again and again.',
    fix: 'Similar complaints from the same area are detected and linked, so the cause is fixed once.',
  },
  {
    problem: 'Heads of department plan blind.',
    fix: 'Funds, manpower, materials and dates are captured per case and rolled up on the admin dashboard.',
  },
  {
    problem: 'Every question needs a manual report.',
    fix: 'Smart Query turns plain English into a safe, read-only database query on allow-listed fields.',
  },
];

const About = () => (
  <div className="tk-doc">
    <NavBar />
    <header className="tk-doc__hero">
      <p className="tk-doc__tamil tk-tamil" lang="ta">தீர்வு காணல்</p>
      <h1 className="tk-doc__title">“See the solution.”</h1>
      <p className="tk-doc__lede">
        Theervu-Kaanal is a citizen grievance portal for Tamil Nadu’s Water, Electricity and RTO
        departments. Every complaint is routed to the right local official, tracked on a public
        timeline, and escalated automatically if it stalls.
      </p>
    </header>

    <section className="tk-doc__table" aria-labelledby="about-problems">
      <h2 id="about-problems">What it fixes</h2>
      <ul>
        {ROWS.map((r, i) => (
          <li key={r.problem} data-reveal style={{ '--reveal-delay': `${(i % 2) * 70}ms` }}>
            <h3>{r.problem}</h3>
            <p>{r.fix}</p>
          </li>
        ))}
      </ul>
    </section>

    <section className="tk-doc__band" aria-labelledby="about-local">
      <h2 id="about-local" data-reveal>Runs without cloud accounts.</h2>
      <p data-reveal style={{ '--reveal-delay': '80ms' }}>
        Without a database URL it starts an embedded MongoDB. Without Supabase it signs people in with its own
        tokens. Without a Gemini key, priority and Smart Query fall back to offline rules.
      </p>
      <Link to="/#journey" className="btn btn-light btn-lg" data-reveal>
        Follow a petition <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
    <Footer />
  </div>
);

export default About;
