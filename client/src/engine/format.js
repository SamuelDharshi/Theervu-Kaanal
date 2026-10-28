// Words for the escalation engine's verdicts, shared by the landing page,
// public tracking and the dashboards.

export const RULE_FIGURE = {
  'high-48h': '48 h',
  'stalled-7d': '7 days',
  'silent-plan': 'Halfway',
};

// "45 min", "18 h", "3 days 4 h"
export const span = (ms) => {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h`;
  const d = Math.floor(h / 24);
  const rest = h % 24;
  return rest ? `${d} days ${rest} h` : `${d} days`;
};

export const dueIn = (date, now = Date.now()) => span(new Date(date).getTime() - now);

const ruleTitle = (engine, id) => engine.rules?.find((r) => r.id === id)?.title || '';

// { tone, headline, detail } for one verdict. tone is clear | watching | flagged | escalated | closed.
export const describeVerdict = (engine, { escalationStatus, now = Date.now() } = {}) => {
  if (!engine) return null;
  switch (engine.state) {
    case 'closed':
      return { tone: 'closed', headline: 'Resolved', detail: 'The engine has stopped watching this petition.' };
    case 'escalated':
      return escalationStatus === 'Resolved'
        ? { tone: 'closed', headline: 'Answered by the grievance cell', detail: 'The escalation has a response on the timeline.' }
        : { tone: 'escalated', headline: 'With the grievance cell', detail: 'Escalated and waiting for the cell to answer or reassign.' };
    case 'flagged':
      return { tone: 'flagged', headline: 'Flagged for escalation', detail: engine.reasons.join('. ') + '.' };
    case 'watching':
      return {
        tone: 'watching',
        headline: `Escalates in ${dueIn(engine.nextDueAt, now)}`,
        detail: `If nothing changes. Rule: ${ruleTitle(engine, engine.nextRule).toLowerCase()}.`,
      };
    default:
      return { tone: 'clear', headline: 'On track', detail: 'No escalation rule applies right now.' };
  }
};

// One rule's state in a few words, for the rule rows.
export const describeRule = (rule, now = Date.now()) => {
  if (!rule.applies) return 'Does not apply';
  if (rule.triggered) return 'Fired';
  if (rule.satisfied) return 'Cleared by a milestone';
  return `Fires in ${dueIn(rule.dueAt, now)}`;
};
