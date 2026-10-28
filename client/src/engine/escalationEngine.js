// Generated from server/utils/escalationEngine.js by client/scripts/sync-engine.js. Do not edit.
// The escalation engine: the three rules that decide when a grievance has stalled.
// One pure function, used by the daily check, the dashboards, public tracking and
// the landing page simulator, so every surface reports the same verdict.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const HIGH_PRIORITY_WINDOW = 48 * HOUR;
export const STALLED_WINDOW = 7 * DAY;

export const RULES = [
    {
        id: 'high-48h',
        title: 'High priority, open 48 hours',
        description: 'A High priority grievance that is not resolved 48 hours after it was filed.'
    },
    {
        id: 'stalled-7d',
        title: 'Untouched for 7 days',
        description: 'A grievance still pending or assigned 7 days after it was filed.'
    },
    {
        id: 'silent-plan',
        title: 'Silent past halfway',
        description: 'Work in progress past the halfway point of its plan with no milestone logged since.'
    }
];

const time = (d) => (d ? new Date(d).getTime() : NaN);
const clamp01 = (n) => Math.max(0, Math.min(1, n));

const ruleResult = (id, fields) => ({ ...RULES.find((r) => r.id === id), ...fields });

// Evaluate one grievance (a Mongoose document or a plain object) at `now`.
// Returns each rule's state, the reasons for any that fired, and the overall verdict.
export const evaluateEscalation = (grievance, now = new Date()) => {
    const t = time(now);
    const filed = time(grievance.createdAt);
    const status = grievance.status;
    const open = status !== 'resolved';

    // Rule 1: High priority not resolved within 48 hours.
    const highDue = filed + HIGH_PRIORITY_WINDOW;
    const high = ruleResult('high-48h', {
        applies: open && grievance.priority === 'High',
        dueAt: new Date(highDue),
        progress: clamp01((t - filed) / HIGH_PRIORITY_WINDOW)
    });
    high.triggered = high.applies && t >= highDue;
    high.reason = 'High priority grievance not resolved within 48 hours';

    // Rule 2: stuck in pending or assigned for more than 7 days.
    const stalledDue = filed + STALLED_WINDOW;
    const stalled = ruleResult('stalled-7d', {
        applies: ['pending', 'assigned'].includes(status),
        dueAt: new Date(stalledDue),
        progress: clamp01((t - filed) / STALLED_WINDOW)
    });
    stalled.triggered = stalled.applies && t >= stalledDue;
    stalled.reason = `Grievance stuck in ${status} status for over 7 days`;

    // Rule 3: in progress, past 50% of the planned timeline, no milestone since the midpoint.
    const plan = grievance.resourceManagement || {};
    const start = time(plan.startDate);
    const end = time(plan.endDate);
    const hasPlan = status === 'in-progress' && end > start;
    const midpoint = start + (end - start) / 2;
    const latestUpdate = (grievance.timelineStages || [])
        .map((s) => time(s.date))
        .filter((d) => d > start)
        .sort((a, b) => b - a)[0];
    const elapsedPct = hasPlan ? ((t - start) / (end - start)) * 100 : 0;
    const silent = ruleResult('silent-plan', {
        applies: hasPlan,
        dueAt: hasPlan ? new Date(midpoint) : null,
        progress: hasPlan ? clamp01((t - start) / (midpoint - start)) : 0,
        // A milestone logged after the midpoint keeps the case clear.
        satisfied: hasPlan && latestUpdate >= midpoint
    });
    silent.triggered = hasPlan && t >= midpoint && !(latestUpdate >= midpoint);
    silent.reason = `In progress ${elapsedPct.toFixed(0)}% through its plan with no milestone logged since the halfway point`;

    const rules = [high, stalled, silent];
    const fired = rules.filter((r) => r.triggered);
    const watching = rules.filter((r) => r.applies && !r.triggered && !r.satisfied && r.dueAt);
    const next = watching.sort((a, b) => a.dueAt - b.dueAt)[0] || null;

    let state;
    if (!open) state = 'closed';
    else if (grievance.isEscalated) state = 'escalated';
    else if (fired.length) state = 'flagged';
    else if (next) state = 'watching';
    else state = 'clear';

    return {
        state,
        eligible: open && !grievance.isEscalated && fired.length > 0,
        reasons: fired.map((r) => r.reason),
        reason: fired.map((r) => r.reason).join('; '),
        nextRule: next ? next.id : null,
        nextDueAt: next ? next.dueAt : null,
        evaluatedAt: new Date(t),
        rules: rules.map(({ id, title, description, applies, triggered, dueAt, progress, satisfied }) => ({
            id, title, description, applies, triggered, dueAt, progress, satisfied: !!satisfied
        }))
    };
};

// Attach the verdict to a grievance for an API response.
export const withEngine = (grievance, now = new Date()) => {
    const plain = typeof grievance.toObject === 'function' ? grievance.toObject() : grievance;
    return { ...plain, engine: evaluateEscalation(plain, now) };
};

// Build a hypothetical grievance for the simulator from plain numbers, then evaluate it.
export const simulateEscalation = ({
    priority = 'Medium',
    status = 'pending',
    hoursSinceFiled = 0,
    planDays = 10,
    planElapsedPct = 0,
    milestoneSinceHalfway = false
} = {}, now = new Date()) => {
    const t = now.getTime();
    const g = {
        priority: ['High', 'Medium', 'Low'].includes(priority) ? priority : 'Medium',
        status: ['pending', 'assigned', 'in-progress', 'resolved'].includes(status) ? status : 'pending',
        createdAt: new Date(t - Math.max(0, Math.min(Number(hoursSinceFiled) || 0, 24 * 365)) * HOUR),
        timelineStages: []
    };
    if (g.status === 'in-progress') {
        const days = Math.max(1, Math.min(Number(planDays) || 10, 365));
        const pct = clamp01((Number(planElapsedPct) || 0) / 100);
        const start = t - pct * days * DAY;
        g.resourceManagement = { startDate: new Date(start), endDate: new Date(start + days * DAY) };
        if (milestoneSinceHalfway && pct >= 0.5) g.timelineStages.push({ stageName: 'Investigation', date: new Date(t - 60 * 1000) });
    }
    return evaluateEscalation(g, now);
};
