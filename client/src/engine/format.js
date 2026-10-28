// Words for the escalation engine's verdicts, shared by the landing page,
// public tracking and the dashboards. Every function takes the i18n `t`, and
// reasons are built from rule ids so they read in the visitor's language.

// "45 min", "18 h", "3 days 4 h"
export const span = (ms, t) => {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return t('time.min', { n: m });
  const h = Math.floor(m / 60);
  if (h < 48) return t('time.h', { n: h });
  const d = Math.floor(h / 24);
  const rest = h % 24;
  return rest ? t('time.daysHours', { d, h: rest }) : t('time.days', { n: d });
};

export const dueIn = (date, t, now = Date.now()) => span(new Date(date).getTime() - now, t);

export const ruleTitle = (id, t) => t(`engine.rule.${id}.title`);
export const ruleFigure = (id, t) => t(`engine.rule.${id}.figure`);

// The reasons for every rule that fired, one sentence each.
export const engineReasons = (engine, t) =>
  (engine?.rules || []).filter((r) => r.triggered).map((r) => t(`engine.rule.${r.id}.reason`));

// { tone, headline, detail } for one verdict. tone is clear | watching | flagged | escalated | closed.
export const describeVerdict = (engine, t, { escalationStatus, now = Date.now() } = {}) => {
  if (!engine) return null;
  switch (engine.state) {
    case 'closed':
      return { tone: 'closed', headline: t('engine.verdict.closed'), detail: t('engine.verdict.closedDetail') };
    case 'escalated':
      return escalationStatus === 'Resolved'
        ? { tone: 'closed', headline: t('engine.verdict.answered'), detail: t('engine.verdict.answeredDetail') }
        : { tone: 'escalated', headline: t('engine.verdict.withCell'), detail: t('engine.verdict.withCellDetail') };
    case 'flagged':
      return { tone: 'flagged', headline: t('engine.verdict.flagged'), detail: engineReasons(engine, t).join(' ') };
    case 'watching':
      return {
        tone: 'watching',
        headline: t('engine.verdict.escalatesIn', { time: dueIn(engine.nextDueAt, t, now) }),
        detail: t('engine.verdict.watchingDetail', { rule: ruleTitle(engine.nextRule, t) }),
      };
    default:
      return { tone: 'clear', headline: t('engine.verdict.clear'), detail: t('engine.verdict.clearDetail') };
  }
};

// One rule's state in a few words, for the rule rows.
export const describeRule = (rule, t, now = Date.now()) => {
  if (!rule.applies) return t('engine.ruleState.off');
  if (rule.triggered) return t('engine.ruleState.fired');
  if (rule.satisfied) return t('engine.ruleState.cleared');
  return t('engine.ruleState.firesIn', { time: dueIn(rule.dueAt, t, now) });
};
