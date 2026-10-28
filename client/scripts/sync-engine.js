// Copies the server's escalation engine into the client so the landing page
// simulator runs the exact rules the server enforces. Runs before start and build.
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../../server/utils/escalationEngine.js');
const target = path.join(__dirname, '../src/engine/escalationEngine.js');

// A client-only checkout (e.g. a frontend deploy) keeps the committed copy.
if (!fs.existsSync(source)) process.exit(0);

const header = '// Generated from server/utils/escalationEngine.js by client/scripts/sync-engine.js. Do not edit.\n';
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, header + fs.readFileSync(source, 'utf8'));
