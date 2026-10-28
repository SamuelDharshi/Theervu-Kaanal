import React from 'react';
import { describeVerdict } from '../engine/format';
import { useT } from '../i18n/LanguageContext';

// The escalation engine's verdict on one grievance, for table cells and panels.
const EngineVerdict = ({ grievance, compact = false }) => {
  const { t } = useT();
  const v = describeVerdict(grievance.engine, t, { escalationStatus: grievance.escalationStatus });
  if (!v) return <span className="text-muted">—</span>;
  return (
    <div className={`tk-engine tk-engine--${v.tone}`}>
      <strong>{v.headline}</strong>
      {!compact && <span>{v.detail}</span>}
    </div>
  );
};

export default EngineVerdict;
