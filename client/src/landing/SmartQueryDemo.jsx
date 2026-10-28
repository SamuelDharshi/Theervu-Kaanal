import React, { useEffect, useRef, useState } from 'react';

/*
 * A worked example of the admin's Smart Query: the question types itself, then
 * the intent and filters it is parsed into appear. Intent names are the real
 * ones from server/llm/intentClassifier.js; nothing here calls the server.
 */
const EXAMPLES = [
  {
    q: 'How many pending cases in Water?',
    parsed: [['intent', 'status_query'], ['department', 'Water'], ['status', 'pending']],
  },
  {
    q: 'What resources are needed in Egmore?',
    parsed: [['intent', 'resource_query'], ['taluk', 'Egmore']],
  },
  {
    q: 'Show escalated cases in Electricity',
    parsed: [['intent', 'escalation_summary'], ['department', 'Electricity'], ['status', 'escalated']],
  },
];

export default function SmartQueryDemo() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [showParsed, setShowParsed] = useState(false);
  const [running, setRunning] = useState(false);
  const rootRef = useRef(null);

  // Start only when visible.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { threshold: 0.3 });
    if (rootRef.current) io.observe(rootRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const full = EXAMPLES[index].q;
    if (reduced || !running) {
      setTyped(full);
      setShowParsed(true);
      return undefined;
    }
    setTyped('');
    setShowParsed(false);
    let i = 0;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const type = () => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i < full.length) later(type, 38 + Math.random() * 50);
      else {
        later(() => setShowParsed(true), 380);
        later(() => setIndex((n) => (n + 1) % EXAMPLES.length), 4600);
      }
    };
    later(type, 500);
    return () => timers.forEach(clearTimeout);
  }, [index, running]);

  const ex = EXAMPLES[index];

  return (
    <div className="lp-sq" ref={rootRef} data-ui data-reveal>
      <div className="lp-sq__ask">
        <span className="lp-sq__q">{typed}</span>
        <span className="lp-sq__caret" aria-hidden="true" />
      </div>
      <div className={`lp-sq__parsed ${showParsed ? 'is-on' : ''}`}>
        <p className="lp-sq__label">Parsed into</p>
        <pre>
          <code>
            {ex.parsed.map(([k, v], i) => (
              <span key={k} style={{ '--i': i }}>
                <b>{k.padEnd(12, ' ')}</b>
                {v}
                {'\n'}
              </span>
            ))}
          </code>
        </pre>
        <p className="lp-sq__note">Then run as a read-only query on allow-listed fields.</p>
      </div>
      <div className="lp-sq__tabs" role="tablist" aria-label="Example questions">
        {EXAMPLES.map((e, i) => (
          <button
            key={e.q}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={i === index ? 'is-on' : ''}
            onClick={() => setIndex(i)}
          >
            {e.q}
          </button>
        ))}
      </div>
    </div>
  );
}
