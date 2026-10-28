import React, { useMemo, useState } from 'react';
import { simulateEscalation } from '../engine/escalationEngine';
import { describeRule, describeVerdict, ruleFigure, ruleTitle, span } from '../engine/format';
import { useT } from '../i18n/LanguageContext';

const RULE_IDS = ['high-48h', 'stalled-7d', 'silent-plan'];
const REDRESSAL_KEYS = ['flagged', 'escalated', 'answered', 'told'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = ['pending', 'assigned', 'in-progress', 'resolved'];
const PLAN_DAYS = 10;

function Segments({ name, legend, options, value, onChange }) {
  return (
    <fieldset className="lp-eng__seg">
      <legend>{legend}</legend>
      <div>
        {options.map((o) => (
          <label key={o.value} className={value === o.value ? 'is-on' : ''}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function EngineSection() {
  const { t } = useT();
  const [priority, setPriority] = useState('High');
  const [status, setStatus] = useState('pending');
  const [hours, setHours] = useState(30);
  const [planPct, setPlanPct] = useState(40);
  const [milestone, setMilestone] = useState(false);

  // The same function the server runs at noon, on a petition described by the controls.
  const verdict = useMemo(
    () => simulateEscalation({
      priority,
      status,
      hoursSinceFiled: hours,
      planDays: PLAN_DAYS,
      planElapsedPct: planPct,
      milestoneSinceHalfway: milestone,
    }),
    [priority, status, hours, planPct, milestone]
  );
  const v = describeVerdict(verdict, t);

  return (
    <section className="lp-eng" id="engine" aria-labelledby="engine-title">
      <div className="lp-eng__intro">
        <h2 id="engine-title" data-reveal>{t('engine.title')}</h2>
        <p data-reveal style={{ '--reveal-delay': '80ms' }}>{t('engine.lede')}</p>
      </div>

      <ul className="lp-eng__rules">
        {RULE_IDS.map((id) => {
          const live = verdict.rules.find((x) => x.id === id);
          return (
            <li key={id} className={live.triggered ? 'is-fired' : live.applies ? 'is-live' : ''}>
              <p className="lp-eng__fig">{ruleFigure(id, t)}</p>
              <p className="lp-eng__cap">{t(`engine.rule.${id}.caption`)}</p>
            </li>
          );
        })}
      </ul>

      <div className="lp-eng__sim" data-ui>
        <form className="lp-eng__controls" onSubmit={(e) => e.preventDefault()} aria-label={t('engine.sim.formLabel')}>
          <h3>{t('engine.sim.title')}</h3>
          <Segments
            name="eng-priority"
            legend={t('common.priority')}
            options={PRIORITIES.map((p) => ({ value: p, label: t(`priority.${p}`) }))}
            value={priority}
            onChange={setPriority}
          />
          <Segments
            name="eng-status"
            legend={t('common.status')}
            options={STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))}
            value={status}
            onChange={setStatus}
          />

          <label className="lp-eng__range">
            <span>
              {t('engine.sim.filed')}{' '}
              <strong>{hours ? t('engine.sim.ago', { time: span(hours * 3600000, t) }) : t('engine.sim.justNow')}</strong>
            </span>
            <input type="range" min="0" max="240" step="1" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </label>

          {status === 'in-progress' && (
            <>
              <label className="lp-eng__range">
                <span>
                  {t('engine.sim.plan')} <strong>{t('engine.sim.planUsed', { pct: planPct, days: PLAN_DAYS })}</strong>
                </span>
                <input type="range" min="0" max="100" step="1" value={planPct} onChange={(e) => setPlanPct(Number(e.target.value))} />
              </label>
              <label className="lp-eng__check">
                <input type="checkbox" checked={milestone} onChange={(e) => setMilestone(e.target.checked)} />
                {t('engine.sim.milestone')}
              </label>
            </>
          )}
        </form>

        <div className={`lp-eng__out lp-eng__out--${v.tone}`} aria-live="polite">
          <p className="lp-eng__verdict">{v.headline}</p>
          <p className="lp-eng__detail">{v.detail}</p>
          <ul className="lp-eng__meters">
            {verdict.rules.map((r) => (
              <li key={r.id} className={r.triggered ? 'is-fired' : r.applies ? '' : 'is-off'}>
                <span className="lp-eng__meter-name">{ruleTitle(r.id, t)}</span>
                <span className="lp-eng__meter-state">{describeRule(r, t)}</span>
                <span className="lp-eng__bar" aria-hidden="true">
                  <span style={{ transform: `scaleX(${r.applies && !r.satisfied ? r.progress : 0})` }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lp-eng__redress">
        <h3 data-reveal>{t('engine.redress.title')}</h3>
        <ol>
          {REDRESSAL_KEYS.map((k, i) => (
            <li key={k} data-reveal style={{ '--reveal-delay': `${i * 80}ms` }}>
              <strong>{t(`engine.redress.${k}.title`)}</strong>
              <span>{t(`engine.redress.${k}.body`)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
