import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { API_BASE } from '../config';

// Seeded demo petitions (server/config/seed.js), so the panel works on a fresh install.
const EXAMPLES = [
  { id: 'GRV100004', label: 'Transformer sparking near school' },
  { id: 'GRV100001', label: 'Contaminated drinking water' },
  { id: 'GRV100005', label: 'Driving licence renewal pending' },
];

const STATUS_LABEL = {
  pending: 'Pending',
  assigned: 'Assigned',
  'in-progress': 'In progress',
  resolved: 'Resolved',
  rejected: 'Declined',
  escalated: 'Escalated',
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function TrackPanel() {
  const [value, setValue] = useState(EXAMPLES[0].id);
  const [state, setState] = useState({ status: 'idle' });
  const inputRef = useRef(null);
  const requestId = useRef(0);

  const track = async (raw) => {
    const id = raw.trim().toUpperCase();
    if (!id) {
      setState({ status: 'error', message: 'Enter a petition ID, for example GRV100004.' });
      return;
    }
    const mine = ++requestId.current;
    setState({ status: 'loading' });
    try {
      const res = await fetch(`${API_BASE}/api/grievances/track/${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 404 ? `No petition found with ID ${id}.` : data.error || 'Could not track that petition.');

      let stages = [];
      try {
        const t = await fetch(`${API_BASE}/api/grievances/${encodeURIComponent(id)}/timeline-stages`);
        if (t.ok) stages = (await t.json()).timelineStages || [];
      } catch (e) {
        stages = [];
      }
      if (mine !== requestId.current) return;
      setState({ status: 'done', grievance: data.grievance, stages });
    } catch (e) {
      if (mine !== requestId.current) return;
      const offline = e instanceof TypeError;
      setState({
        status: 'error',
        message: offline ? 'The server is not reachable right now. Try again in a moment.' : e.message,
      });
    }
  };

  // Show a real result as soon as the section exists.
  useEffect(() => {
    track(EXAMPLES[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    track(value);
  };

  const pick = (id) => {
    setValue(id);
    track(id);
    inputRef.current?.focus({ preventScroll: true });
  };

  const g = state.grievance;
  const escalated = g && (g.status === 'escalated' || g.escalationStatus === 'Escalated' || g.isEscalated);

  return (
    <div className="lp-trackp">
      <div className="lp-trackp__intro" data-reveal>
        <h2 id="track-title">Track a petition. No login.</h2>
        <p>Type the ID you were given when you filed. You see the status, the official handling it and every stage so far.</p>
      </div>

      <form className="lp-trackp__form" onSubmit={onSubmit} role="search" data-ui>
        <label htmlFor="track-id" className="visually-hidden">Petition ID</label>
        <input
          id="track-id"
          ref={inputRef}
          className="lp-trackp__input"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          spellCheck="false"
          autoComplete="off"
          aria-describedby="track-hint"
        />
        <button type="submit" className="lp-trackp__go" aria-label="Track this petition">
          <ArrowRight size={36} aria-hidden="true" />
        </button>
      </form>
      <p id="track-hint" className="visually-hidden">Petition IDs start with GRV followed by six digits.</p>

      <div className="lp-trackp__examples">
        <span>Try a demo petition:</span>
        {EXAMPLES.map((ex) => (
          <button key={ex.id} type="button" onClick={() => pick(ex.id)} className={value === ex.id ? 'is-on' : ''}>
            {ex.label}
          </button>
        ))}
      </div>

      <div className="lp-trackp__result" aria-live="polite" data-ui>
        {state.status === 'loading' && (
          <div className="lp-trackp__skeleton" aria-label="Loading">
            <span /><span /><span />
          </div>
        )}

        {state.status === 'error' && <p className="lp-trackp__error">{state.message}</p>}

        {state.status === 'done' && g && (
          <div className="lp-trackp__card" key={g.petitionId}>
            <div className="lp-trackp__head">
              <div>
                <p className="lp-trackp__pid">{g.petitionId}</p>
                <h3>{g.title}</h3>
              </div>
              <span className={`lp-chip lp-chip--${escalated ? 'escalated' : g.status}`}>
                {escalated ? 'Escalated' : STATUS_LABEL[g.status] || g.status}
              </span>
            </div>

            <dl className="lp-trackp__facts">
              <div><dt>Department</dt><dd>{g.department || '—'}</dd></div>
              <div><dt>Priority</dt><dd className={g.priority === 'High' ? 'is-high' : ''}>{g.priority || '—'}</dd></div>
              <div>
                <dt>Assigned to</dt>
                <dd>{g.assignedTo ? `${g.assignedTo.firstName} ${g.assignedTo.lastName}` : 'Not assigned yet'}</dd>
              </div>
              <div><dt>Filed</dt><dd>{fmt(g.createdAt)}</dd></div>
              <div><dt>Last update</dt><dd>{fmt(g.updatedAt)}</dd></div>
            </dl>

            {state.stages.length > 0 && (
              <ol className="lp-trackp__stages">
                {state.stages.map((s, i) => (
                  <li
                    key={`${s.stageName}-${i}`}
                    className={s.stageName === 'Escalated' ? 'is-escalated' : ''}
                    style={{ '--i': i }}
                  >
                    <strong>{s.stageName}</strong>
                    <time>{fmt(s.date)}</time>
                    {s.description && <span>{s.description}</span>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
