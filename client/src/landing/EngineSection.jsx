import React, { useMemo, useState } from 'react';
import { simulateEscalation } from '../engine/escalationEngine';
import { RULE_FIGURE, describeRule, describeVerdict, span } from '../engine/format';

const RULE_COPY = [
  { id: 'high-48h', caption: 'A High priority petition still open 48 hours after filing.' },
  { id: 'stalled-7d', caption: 'Pending or assigned for a week with nobody starting work.' },
  { id: 'silent-plan', caption: 'A work plan past its midpoint with no milestone logged since.' },
];

const REDRESSAL = [
  { title: 'Flagged', body: 'At noon the engine marks the petition and tells the grievance cell, once.' },
  { title: 'Escalated', body: 'The petitioner gets an Escalate button on their dashboard and sends a reason.' },
  { title: 'Answered or reassigned', body: 'The cell replies, or moves the case to another official. Work in progress keeps its plan and resources.' },
  { title: 'Everyone told', body: 'Petitioner, old and new official are notified, and the timeline records the response.' },
];

const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];
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
  const v = describeVerdict(verdict);

  return (
    <section className="lp-eng" id="engine" aria-labelledby="engine-title">
      <div className="lp-eng__intro">
        <h2 id="engine-title" data-reveal>The escalation engine</h2>
        <p data-reveal style={{ '--reveal-delay': '80ms' }}>
          Our own rules, not a model’s guess. Every open petition is checked against three of them each day
          at noon. When one fires, the grievance cell is told and the citizen can escalate.
        </p>
      </div>

      <ul className="lp-eng__rules">
        {RULE_COPY.map((r) => {
          const live = verdict.rules.find((x) => x.id === r.id);
          return (
            <li
              key={r.id}
              className={live.triggered ? 'is-fired' : live.applies ? 'is-live' : ''}
            >
              <p className="lp-eng__fig">{RULE_FIGURE[r.id]}</p>
              <p className="lp-eng__cap">{r.caption}</p>
            </li>
          );
        })}
      </ul>

      <div className="lp-eng__sim" data-ui>
        <form className="lp-eng__controls" onSubmit={(e) => e.preventDefault()} aria-label="Describe a petition">
          <h3>Try a petition</h3>
          <Segments
            name="eng-priority"
            legend="Priority"
            options={PRIORITIES.map((p) => ({ value: p, label: p }))}
            value={priority}
            onChange={setPriority}
          />
          <Segments name="eng-status" legend="Status" options={STATUSES} value={status} onChange={setStatus} />

          <label className="lp-eng__range">
            <span>Filed <strong>{hours ? `${span(hours * 3600000)} ago` : 'just now'}</strong></span>
            <input type="range" min="0" max="240" step="1" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </label>

          {status === 'in-progress' && (
            <>
              <label className="lp-eng__range">
                <span>Work plan <strong>{planPct}% of {PLAN_DAYS} days used</strong></span>
                <input type="range" min="0" max="100" step="1" value={planPct} onChange={(e) => setPlanPct(Number(e.target.value))} />
              </label>
              <label className="lp-eng__check">
                <input type="checkbox" checked={milestone} onChange={(e) => setMilestone(e.target.checked)} />
                Official logged a milestone after the halfway point
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
                <span className="lp-eng__meter-name">{r.title}</span>
                <span className="lp-eng__meter-state">{describeRule(r)}</span>
                <span className="lp-eng__bar" aria-hidden="true">
                  <span style={{ transform: `scaleX(${r.applies && !r.satisfied ? r.progress : 0})` }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lp-eng__redress">
        <h3 data-reveal>Then redressal</h3>
        <ol>
          {REDRESSAL.map((s, i) => (
            <li key={s.title} data-reveal style={{ '--reveal-delay': `${i * 80}ms` }}>
              <strong>{s.title}</strong>
              <span>{s.body}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
