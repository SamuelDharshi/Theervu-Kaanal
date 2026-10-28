import express from 'express';
import { RULES, simulateEscalation } from '../utils/escalationEngine.js';

// Public, read-only access to the escalation engine: its rules, and a simulator
// that evaluates a hypothetical grievance. Nothing here touches the database.
const router = express.Router();

router.get('/rules', (req, res) => {
    res.json({ rules: RULES, schedule: 'Every day at 12:00' });
});

router.post('/simulate', (req, res) => {
    res.json({ verdict: simulateEscalation(req.body || {}) });
});

export default router;
