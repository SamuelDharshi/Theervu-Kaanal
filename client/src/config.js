// API configuration.
// REACT_APP_API_URL overrides the server address (e.g. http://192.168.1.10:5001).
// Otherwise a client served from localhost talks to the local server on :5001,
// and any other host uses the deployed backend.
const isLocal = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_BASE = (
    process.env.REACT_APP_API_URL ||
    (isLocal ? 'http://localhost:5001' : 'https://theervu-kaanal.onrender.com')
).replace(/\/+$/, '');

export const API_URL = `${API_BASE}/api`;
