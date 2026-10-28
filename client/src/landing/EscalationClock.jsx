import React, { useEffect, useState } from 'react';

// The 48-hour window a High priority petition gets before it escalates,
// counting down from the moment the visitor arrives.
const WINDOW_MS = 48 * 3600 * 1000;
const pad = (n) => String(n).padStart(2, '0');

export default function EscalationClock() {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const left = Math.max(0, WINDOW_MS - (now - start));
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);

  return (
    <div className="lp-frag lp-frag--clock" data-ui aria-label="Time left before a High priority petition escalates">
      <span className="lp-frag__small">High priority · escalates in</span>
      <span className="lp-frag__clock">
        {pad(h)}<i>:</i>{pad(m)}<i>:</i>{pad(s)}
      </span>
    </div>
  );
}
