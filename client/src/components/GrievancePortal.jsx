import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import NavBar from './NavBar';
import Footer from '../shared/Footer';
import { useAuth } from '../context/AuthContext';
import ThreadScene, { DEPARTMENTS, STAGES } from '../landing/ThreadScene';
import TrackPanel from '../landing/TrackPanel';
import SmartQueryDemo from '../landing/SmartQueryDemo';
import EscalationClock from '../landing/EscalationClock';
import { gsap, ScrollTrigger, prefersReducedMotion, scrollToTarget, startSmoothScroll } from '../motion/smoothScroll';
import '../styles/Landing.css';

const JOURNEY = [
  {
    key: 'filed',
    stage: 'Grievance Filed',
    title: 'The citizen says what and where.',
    body: 'Pick the department, then district, division and taluk. The system matches them to the official for that jurisdiction, so the petition lands on the right desk the moment it is filed.',
    fact: 'Auto-assigned by department and taluk',
  },
  {
    key: 'review',
    stage: 'Under Review',
    title: 'Priority is read, not guessed.',
    body: 'Gemini reads each petition and ranks it High, Medium or Low. Without a key, offline rules do the same: urgent words like “accident” or “no water” raise it. The official accepts or declines.',
    fact: 'Line weight in the field is priority',
  },
  {
    key: 'investigation',
    stage: 'Investigation',
    title: 'The plan is public.',
    body: 'The official starts progress, logs funds, manpower, materials and dates, and plans a timeline with milestones. A case can be reassigned to the next taluk’s officer. The citizen sees the plan on the tracking page.',
    fact: 'Resources captured per case',
  },
  {
    key: 'escalated',
    stage: 'Escalated',
    title: 'Stalls are caught at noon.',
    body: 'High priority not resolved in 48 hours, or pending for 7 days, escalates on its own. Every day at noon the server checks. The petitioner can also escalate with a reason; it lands with the grievance cell.',
    fact: 'Red lines are escalations',
    accent: true,
  },
  {
    key: 'resolution',
    stage: 'Resolution',
    title: 'Closed with proof.',
    body: 'The official resolves the case with a resolution document and a note attached. The petitioner rates it and leaves feedback, or escalates if the fix did not hold.',
    fact: 'Every action logged on the timeline',
  },
];

const RULES = [
  { figure: '48 h', caption: 'A High priority petition that is still open escalates.' },
  { figure: '7 days', caption: 'Pending or assigned for a week escalates.' },
  { figure: '12:00', caption: 'The check runs every day at noon.' },
];

const ROLES = [
  { who: 'Petitioner', does: 'Files, tracks, chats with the official, rates the fix', to: '/login/petitioner' },
  { who: 'Department official', does: 'Accepts, plans, reassigns, resolves with proof', to: '/login/official' },
  { who: 'Grievance cell', does: 'Answers escalations, reads analytics, asks Smart Query', to: '/login/admin' },
];

const FAQ = [
  {
    q: 'How does my petition reach the right official?',
    a: 'You choose the department and your district, division and taluk. Those are matched to the official responsible for that jurisdiction, and the petition goes straight into their pending queue.',
  },
  {
    q: 'Do I need an account to track a petition?',
    a: 'No. Enter the petition ID on this page, like a courier tracking number. You see its status, who it is assigned to and every stage on its timeline.',
  },
  {
    q: 'What happens if nobody acts on it?',
    a: 'High priority petitions not resolved in 48 hours, and petitions pending or assigned for 7 days, are flagged for escalation by a check that runs every day at noon. They land with the grievance cell head.',
  },
  {
    q: 'What if I am not satisfied with the resolution?',
    a: 'Rate it and leave feedback, or escalate the case with your reason. The grievance cell can respond or reassign it to another official.',
  },
  {
    q: 'Can the AI change the database?',
    a: 'No. Smart Query only builds read queries from allow-listed fields and values such as department and status. Raw model output is never executed.',
  },
];

const GrievancePortal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const labelsRef = useRef(null);
  const heroRef = useRef(null);
  const [activeStep, setActiveStep] = useState(-1);

  const handleSubmitGrievance = () => {
    if (!user) {
      localStorage.setItem('redirectAfterLogin', '/submit-grievance');
      navigate('/login/petitioner');
    } else if (user.role === 'petitioner') {
      navigate('/submit-grievance');
    } else {
      navigate('/');
    }
  };

  // Smooth scrolling for this page only; app screens keep native scroll.
  useEffect(() => startSmoothScroll(), []);

  // Arriving with a hash (from the nav on another page) scrolls to it.
  useEffect(() => {
    if (!location.hash) return undefined;
    const t = setTimeout(() => scrollToTarget(location.hash), 350);
    return () => clearTimeout(t);
  }, [location.hash]);

  // The 3D field, its labels and the scroll-driven camera.
  useEffect(() => {
    const canvas = canvasRef.current;
    const labelHost = labelsRef.current;
    if (!canvas || !labelHost) return undefined;

    let scene;
    try {
      scene = new ThreadScene(canvas, {
        reducedMotion: prefersReducedMotion(),
        onFrame: (anchors, grow) => {
          labelHost.querySelectorAll('[data-anchor]').forEach((el) => {
            const a = anchors[el.dataset.anchor];
            if (!a) return;
            const need = Number(el.dataset.grow || 0);
            const show = a.visible && grow >= need && (el.dataset.journey !== 'true' || scene.progress > 0.92);
            el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)`;
            el.style.opacity = show ? '1' : '0';
          });
        },
      });
    } catch (e) {
      // No WebGL: the page still reads; the field is simply absent.
      stageRef.current?.classList.add('no-webgl');
      return undefined;
    }

    const layout = () => {
      const w = window.innerWidth;
      if (w >= 992) scene.setViewShift(0.2, 0);
      else if (w >= 640) scene.setViewShift(0.12, 0.16);
      else scene.setViewShift(0, 0.3);
    };
    layout();
    window.addEventListener('resize', layout);

    const onPointer = (e) => {
      scene.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    // Only render while the stage is on screen.
    const vis = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) scene.start();
      else scene.stop();
    });
    vis.observe(stageRef.current);

    const st = ScrollTrigger.create({
      trigger: stageRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        scene.setProgress(self.progress);
        const step = Math.round(self.progress * 6) - 1;
        setActiveStep(step >= 0 && step < JOURNEY.length ? step : -1);
      },
    });

    return () => {
      st.kill();
      vis.disconnect();
      window.removeEventListener('resize', layout);
      window.removeEventListener('pointermove', onPointer);
      scene.dispose();
    };
  }, []);

  // Signature move: the headline rises from behind its baselines.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.lp-hero .lp-line__in', { yPercent: 115, duration: 1.1, stagger: 0.11 })
        .from('.lp-hero__lede, .lp-hero__actions', { y: 24, opacity: 0, duration: 0.9, stagger: 0.08 }, '-=0.65')
        .from('.lp-hero__note', { opacity: 0, duration: 0.8 }, '-=0.5');

      // Hero type drifts up slower than the scroll as the journey begins.
      gsap.to('.lp-hero__type', {
        yPercent: -18,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.lp-hero', start: 'top top', end: 'bottom top', scrub: true },
      });

      // Each journey step: stage name, then heading, then text.
      gsap.utils.toArray('.lp-step').forEach((step) => {
        gsap.from(step.querySelectorAll('.lp-step__stage, .lp-step__title, .lp-step__body, .lp-step__fact'), {
          y: 36,
          opacity: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: step, start: 'top 72%', toggleActions: 'play none none reverse' },
        });
      });

      // The closing question pulls its two lines together as it arrives.
      gsap.fromTo('.lp-cta__line--top', { xPercent: -8 }, {
        xPercent: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.lp-cta', start: 'top bottom', end: 'top top', scrub: true },
      });
      gsap.fromTo('.lp-cta__line--bottom', { xPercent: 8 }, {
        xPercent: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.lp-cta', start: 'top bottom', end: 'top top', scrub: true },
      });

      // Rule tiles step up into place.
      gsap.utils.toArray('.lp-rules__tile').forEach((tile, i) => {
        gsap.from(tile, {
          yPercent: 18 + i * 10,
          ease: 'none',
          scrollTrigger: { trigger: '.lp-rules', start: 'top bottom', end: 'center center', scrub: true },
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="lp" id="top">
      <NavBar overlay />

      <div className="lp-stage" ref={stageRef}>
        <div className="lp-stage__sticky" aria-hidden="true">
          <canvas ref={canvasRef} className="lp-stage__canvas" />
          <div className="lp-stage__labels" ref={labelsRef}>
            {DEPARTMENTS.map((d) => (
              <span key={d.name} className="lp-label lp-label--dept" data-anchor={`dept-${d.name}`} data-grow="0.05">
                {d.name}
              </span>
            ))}
            {STAGES.map((s) => (
              <span key={s.key} className="lp-label lp-label--stage" data-anchor={`stage-${s.key}`} data-journey="true">
                {s.name}
              </span>
            ))}
            <span className="lp-label lp-label--gate" data-anchor="gate" data-grow="0.9">Escalated</span>
          </div>
          <ol className={`lp-rail ${activeStep >= 0 ? 'is-on' : ''}`}>
            {JOURNEY.map((j, i) => (
              <li key={j.key} className={`${i === activeStep ? 'is-active' : ''} ${j.accent ? 'is-accent' : ''}`}>
                {j.stage}
              </li>
            ))}
          </ol>
        </div>

        <header className="lp-hero" ref={heroRef}>
          <div className="lp-hero__type">
            <p className="lp-hero__tamil tk-tamil" lang="ta">
              <span className="lp-line"><span className="lp-line__in">தீர்வு காணல்</span></span>
            </p>
            <h1 className="lp-hero__title">
              <span className="lp-line"><span className="lp-line__in">No petition is</span></span>
              <span className="lp-line">
                <span className="lp-line__in">left <em>waiting.</em></span>
              </span>
            </h1>
            <p className="lp-hero__lede">
              Most grievance portals stop at filing. Theervu-Kaanal routes each petition to the right
              official, keeps it in public view, and escalates it on its own when it stalls.
            </p>
            <div className="lp-hero__actions">
              <button type="button" className="btn btn-primary btn-lg lp-btn" onClick={handleSubmitGrievance}>
                File a grievance <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button type="button" className="btn btn-outline-primary btn-lg lp-btn" onClick={() => scrollToTarget('#track')}>
                Track a petition
              </button>
            </div>
          </div>
          <p className="lp-hero__note">
            Each line is one petition for Water, RTO or Electricity in Tamil Nadu.
            Line weight is priority, set by Gemini.
          </p>
          <button type="button" className="lp-hero__scroll" onClick={() => scrollToTarget('#journey')}>
            Follow a petition <span aria-hidden="true">↓</span>
          </button>
        </header>

        <section className="lp-journey" id="journey" aria-labelledby="journey-title">
          <h2 id="journey-title" className="visually-hidden">How a petition moves</h2>
          {JOURNEY.map((j) => (
            <article key={j.key} className={`lp-step ${j.accent ? 'lp-step--accent' : ''}`}>
              <div className="lp-step__card">
                <p className="lp-step__stage">{j.stage}</p>
                <h3 className="lp-step__title">{j.title}</h3>
                <p className="lp-step__body">{j.body}</p>
                <p className="lp-step__fact">{j.fact}</p>
              </div>
            </article>
          ))}
          <article className="lp-step lp-step--outro">
            <div className="lp-step__card">
              <h3 className="lp-step__title">Every line ends somewhere.</h3>
              <p className="lp-step__body">
                Resolved at the bottom, or pulled out in red to the grievance cell. None of them stops halfway.
              </p>
            </div>
          </article>
        </section>
      </div>

      <section className="lp-track" id="track" aria-labelledby="track-title">
        <TrackPanel />
      </section>

      <section className="lp-board" aria-labelledby="board-title">
        <div className="lp-board__grid">
          <div className="lp-tile lp-tile--head" data-reveal>
            <h2 id="board-title">Why it stands out</h2>
          </div>
          <div className="lp-tile lp-tile--id" data-reveal style={{ '--reveal-delay': '80ms' }}>
            <div className="lp-frag lp-frag--id" data-ui>GRV100004</div>
            <p className="lp-tile__cap"><strong>Public tracking, no login.</strong> One ID shows the whole timeline.</p>
          </div>
          <div className="lp-tile lp-tile--clock" data-reveal>
            <EscalationClock />
            <p className="lp-tile__cap"><strong>Nothing stalls silently.</strong> High priority escalates after 48 hours, stalled cases after 7 days.</p>
          </div>
          <div className="lp-tile lp-tile--priority" data-reveal style={{ '--reveal-delay': '80ms' }}>
            <div className="lp-frag lp-frag--priority" data-ui>
              <span className="is-on">High</span>
              <span>Medium</span>
              <span>Low</span>
            </div>
            <p className="lp-tile__cap"><strong>AI sets the priority.</strong> Gemini reads each petition and ranks it.</p>
          </div>
          <div className="lp-tile lp-tile--repeat" data-reveal style={{ '--reveal-delay': '160ms' }}>
            <div className="lp-frag lp-frag--repeat" data-ui>
              <span>W</span><span>W</span><span>W</span>
            </div>
            <p className="lp-tile__cap"><strong>Repeat problems linked.</strong> Similar petitions from one area are flagged, so the cause is fixed once.</p>
          </div>
          <div className="lp-tile lp-tile--chat" data-reveal>
            <div className="lp-frag lp-frag--chat" data-ui>
              <span className="from">The crew is on site at 10.</span>
              <span className="to">Thank you, the pipe is still leaking.</span>
            </div>
            <p className="lp-tile__cap"><strong>Chat on every case.</strong> Petitioner and official talk on the petition itself.</p>
          </div>
          <div className="lp-tile lp-tile--res" data-reveal style={{ '--reveal-delay': '80ms' }}>
            <div className="lp-frag lp-frag--res" data-ui>
              <span>Funds</span><span>Manpower</span><span>Materials</span><span>Start date</span>
            </div>
            <p className="lp-tile__cap"><strong>Resources planned per case.</strong> Rolled up for the heads of department.</p>
          </div>
        </div>
      </section>

      <section className="lp-query" aria-labelledby="query-title">
        <div className="lp-query__text" data-reveal>
          <h2 id="query-title">Ask the data in plain English.</h2>
          <p>
            Admins type a question. Gemini classifies it and fills in the filters; without a key, a
            rule-based analyser does the same. Only allow-listed fields and values ever reach the database.
          </p>
        </div>
        <SmartQueryDemo />
      </section>

      <section className="lp-rules" aria-labelledby="rules-title">
        <div className="lp-rules__grid">
          {RULES.map((r, i) => (
            <div key={r.figure} className={`lp-rules__tile lp-rules__tile--${i}`}>
              <p className="lp-rules__fig">{r.figure}</p>
              <p className="lp-rules__cap">{r.caption}</p>
            </div>
          ))}
          <h2 id="rules-title" className="lp-rules__head" data-reveal>The rules are fixed. Nobody has to remember them.</h2>
        </div>
      </section>

      <section className="lp-roles" aria-labelledby="roles-title">
        <h2 id="roles-title" data-reveal>Three desks, one record.</h2>
        <ul className="lp-roles__list">
          {ROLES.map((r, i) => (
            <li key={r.who} data-reveal style={{ '--reveal-delay': `${i * 80}ms` }}>
              <Link to={r.to} className="lp-roles__row">
                <span className="lp-roles__who">{r.who}</span>
                <span className="lp-roles__does">{r.does}</span>
                <span className="lp-roles__go">Sign in <ArrowUpRight size={22} aria-hidden="true" /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="lp-faq" aria-labelledby="faq-title">
        <div className="lp-faq__head">
          <h2 id="faq-title" data-reveal>Questions</h2>
        </div>
        {FAQ.map((f) => (
          <div className="lp-faq__band" key={f.q}>
            <h3 data-reveal>{f.q}</h3>
            <p data-reveal style={{ '--reveal-delay': '90ms' }}>{f.a}</p>
          </div>
        ))}
      </section>

      <section className="lp-cta" aria-labelledby="cta-title">
        <h2 id="cta-title" className="lp-cta__title">
          <span className="lp-cta__line lp-cta__line--top">File it.</span>
          <span className="lp-cta__line lp-cta__line--bottom">Or track it.</span>
        </h2>
        <div className="lp-cta__mid">
        <div className="lp-cta__row">
          <button type="button" className="btn btn-accent btn-lg lp-btn" onClick={handleSubmitGrievance}>File a grievance</button>
          <span className="lp-cta__or">or</span>
          <button type="button" className="btn btn-light btn-lg lp-btn" onClick={() => scrollToTarget('#track')}>Track a petition</button>
        </div>
        <p className="lp-cta__after">Either way, you get a petition ID and a public timeline.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GrievancePortal;
