import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv to look for .env file in the server root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// JWT Configuration
// Without JWT_SECRET a secret is generated once and kept in server/.jwt-secret,
// so sign-ins survive restarts during a local demo.
const loadSecret = () => {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    const file = path.join(__dirname, '..', '.jwt-secret');
    try {
        if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
        const secret = crypto.randomBytes(32).toString('hex');
        fs.writeFileSync(file, secret, { mode: 0o600 });
        console.warn('JWT_SECRET not set - generated one in server/.jwt-secret (set JWT_SECRET for production).');
        return secret;
    } catch {
        console.warn('JWT_SECRET not set - using a random secret for this run.');
        return crypto.randomBytes(32).toString('hex');
    }
};
export const JWT_SECRET = loadSecret();
export const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// JWT Options
export const JWT_OPTIONS = {
    algorithm: 'HS256'
};
