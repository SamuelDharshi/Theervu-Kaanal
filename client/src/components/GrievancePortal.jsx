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
import EngineSection from '../landing/EngineSection';
import { gsap, ScrollTrigger, prefersReducedMotion, scrollToTarget, startSmoothScroll } from '../motion/smoothScroll';
import '../styles/Landing.css';
import { useT } from '../i18n/LanguageContext';

// Copy lives in the i18n dictionaries under landing.*; these are the structure.
const JOURNEY = [
  { key: 'filed' },
  { key: 'review' },
  { key: 'investigation' },
  { key: 'escalated', accent: true },
  { key: 'resolution' },
];

const ROLES = [
  { key: 'petitioner', to: '/login/petitioner' },
  { key: 'official', to: '/login/official' },
  { key: 'admin', to: '/login/admin' },
];

const FAQ_KEYS = ['route', 'account', 'nobody', 'unsatisfied', 'ai'];

const GrievancePortal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useT();
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


      // The engine's three rule tiles step up into place (side by side only; stacked on a phone).
      gsap.utils.toArray(window.innerWidth >= 640 ? '.lp-eng__rules li' : []).forEach((tile, i) => {
        gsap.from(tile, {
          yPercent: 8 + i * 8,
          ease: 'none',
          scrollTrigger: { trigger: '.lp-eng__rules', start: 'top bottom', end: 'center center', scrub: true },
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
                {t(`dept.${d.name}`)}
              </span>
            ))}
            {STAGES.map((s) => (
              <span key={s.key} className="lp-label lp-label--stage" data-anchor={`stage-${s.key}`} data-journey="true">
                {t(`stage.${s.key}`)}
              </span>
            ))}
            <span className="lp-label lp-label--gate" data-anchor="gate" data-grow="0.9">{t('stage.escalated')}</span>
          </div>
          <ol className={`lp-rail ${activeStep >= 0 ? 'is-on' : ''}`}>
            {JOURNEY.map((j, i) => (
              <li key={j.key} className={`${i === activeStep ? 'is-active' : ''} ${j.accent ? 'is-accent' : ''}`}>
                {t(`stage.${j.key}`)}
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
              <span className="lp-line"><span className="lp-line__in">{t('landing.heroLine1')}</span></span>
              <span className="lp-line">
                <span className="lp-line__in">{t('landing.heroLine2')} <em>{t('landing.heroLine2Em')}</em></span>
              </span>
            </h1>
            <p className="lp-hero__lede">
              {t('landing.heroLede')}
            </p>
            <div className="lp-hero__actions">
              <button type="button" className="btn btn-primary btn-lg lp-btn" onClick={handleSubmitGrievance}>
                {t('common.fileGrievance')} <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button type="button" className="btn btn-outline-primary btn-lg lp-btn" onClick={() => scrollToTarget('#track')}>
                {t('nav.track')}
              </button>
            </div>
          </div>
          <p className="lp-hero__note">
            {t('landing.heroNote')}
          </p>
          <button type="button" className="lp-hero__scroll" onClick={() => scrollToTarget('#journey')}>
            {t('landing.follow')} <span aria-hidden="true">↓</span>
          </button>
        </header>

        <section className="lp-journey" id="journey" aria-labelledby="journey-title">
          <h2 id="journey-title" className="visually-hidden">{t('landing.journeyTitle')}</h2>
          {JOURNEY.map((j) => (
            <article key={j.key} className={`lp-step ${j.accent ? 'lp-step--accent' : ''}`}>
              <div className="lp-step__card">
                <p className="lp-step__stage">{t(`stage.${j.key}`)}</p>
                <h3 className="lp-step__title">{t(`landing.journey.${j.key}.title`)}</h3>
                <p className="lp-step__body">{t(`landing.journey.${j.key}.body`)}</p>
                <p className="lp-step__fact">{t(`landing.journey.${j.key}.fact`)}</p>
              </div>
            </article>
          ))}
          <article className="lp-step lp-step--outro">
            <div className="lp-step__card">
              <h3 className="lp-step__title">{t('landing.outroTitle')}</h3>
              <p className="lp-step__body">
                {t('landing.outroBody')}
              </p>
            </div>
          </article>
        </section>
      </div>

      <EngineSection />

      <section className="lp-track" id="track" aria-labelledby="track-title">
        <TrackPanel />
      </section>

      <section className="lp-board" aria-labelledby="board-title">
        <div className="lp-board__grid">
          <div className="lp-tile lp-tile--head" data-reveal>
            <h2 id="board-title">{t('landing.board.title')}</h2>
          </div>
          <div className="lp-tile lp-tile--id" data-reveal style={{ '--reveal-delay': '80ms' }}>
            <div className="lp-frag lp-frag--id" data-ui>GRV100004</div>
            <p className="lp-tile__cap"><strong>{t('landing.board.idStrong')}</strong> {t('landing.board.id')}</p>
          </div>
          <div className="lp-tile lp-tile--clock" data-reveal>
            <EscalationClock />
            <p className="lp-tile__cap"><strong>{t('landing.board.clockStrong')}</strong> {t('landing.board.clock')}</p>
          </div>
          <div className="lp-tile lp-tile--priority" data-reveal style={{ '--reveal-delay': '80ms' }}>
            <div className="lp-frag lp-frag--priority" data-ui>
              <span className="is-on">{t('priority.High')}</span>
              <span>{t('priority.Medium')}</span>
              <span>{t('priority.Low')}</span>
            </div>
            <p className="lp-tile__cap"><strong>{t('landing.board.priorityStrong')}</strong> {t('landing.board.priority')}</p>
          </div>
          <div className="lp-tile lp-tile--repeat" data-reveal style={{ '--reveal-delay': '160ms' }}>
            <div className="lp-frag lp-frag--repeat" data-ui>
              <span>W</span><span>W</span><span>W</span>
            </div>
            <p className="lp-tile__cap"><strong>{t('landing.board.repeatStrong')}</strong> {t('landing.board.repeat')}</p>
          </div>
          <div className="lp-tile lp-tile--chat" data-reveal>
            <div className="lp-frag lp-frag--chat" data-ui>
              <span className="from">{t('landing.board.chatFrom')}</span>
              <span className="to">{t('landing.board.chatTo')}</span>
            </div>
            <p className="lp-tile__cap"><strong>{t('landing.board.chatStrong')}</strong> {t('landing.board.chat')}</p>
          </div>
          <div className="lp-tile lp-tile--res" data-reveal style={{ '--reveal-delay': '80ms' }}>
            <div className="lp-frag lp-frag--res" data-ui>
              <span>{t('resource.funds')}</span><span>{t('resource.manpower')}</span><span>{t('resource.materials')}</span><span>{t('resource.startDate')}</span>
            </div>
            <p className="lp-tile__cap"><strong>{t('landing.board.resStrong')}</strong> {t('landing.board.res')}</p>
          </div>
        </div>
      </section>

      <section className="lp-query" aria-labelledby="query-title">
        <div className="lp-query__text" data-reveal>
          <h2 id="query-title">{t('landing.query.title')}</h2>
          <p>
            {t('landing.query.body')}
          </p>
        </div>
        <SmartQueryDemo />
      </section>

      <section className="lp-roles" aria-labelledby="roles-title">
        <h2 id="roles-title" data-reveal>{t('landing.rolesTitle')}</h2>
        <ul className="lp-roles__list">
          {ROLES.map((r, i) => (
            <li key={r.key} data-reveal style={{ '--reveal-delay': `${i * 80}ms` }}>
              <Link to={r.to} className="lp-roles__row">
                <span className="lp-roles__who">{t(`roles.${r.key}`)}</span>
                <span className="lp-roles__does">{t(`landing.roleDoes.${r.key}`)}</span>
                <span className="lp-roles__go">{t('nav.signIn')} <ArrowUpRight size={22} aria-hidden="true" /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="lp-faq" aria-labelledby="faq-title">
        <div className="lp-faq__head">
          <h2 id="faq-title" data-reveal>{t('landing.faqTitle')}</h2>
        </div>
        {FAQ_KEYS.map((k) => (
          <div className="lp-faq__band" key={k}>
            <h3 data-reveal>{t(`landing.faq.${k}.q`)}</h3>
            <p data-reveal style={{ '--reveal-delay': '90ms' }}>{t(`landing.faq.${k}.a`)}</p>
          </div>
        ))}
      </section>

      <section className="lp-cta" aria-labelledby="cta-title">
        <h2 id="cta-title" className="lp-cta__title">
          <span className="lp-cta__line lp-cta__line--top">{t('landing.ctaTop')}</span>
          <span className="lp-cta__line lp-cta__line--bottom">{t('landing.ctaBottom')}</span>
        </h2>
        <div className="lp-cta__mid">
        <div className="lp-cta__row">
          <button type="button" className="btn btn-accent btn-lg lp-btn" onClick={handleSubmitGrievance}>{t('common.fileGrievance')}</button>
          <span className="lp-cta__or">{t('common.or')}</span>
          <button type="button" className="btn btn-light btn-lg lp-btn" onClick={() => scrollToTarget('#track')}>{t('nav.track')}</button>
        </div>
        <p className="lp-cta__after">{t('landing.ctaAfter')}</p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GrievancePortal;
