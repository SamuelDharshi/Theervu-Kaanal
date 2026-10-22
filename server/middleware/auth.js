import jwt from 'jsonwebtoken';
import Petitioner from '../models/Petitioner.js';
import Official from '../models/Official.js';
import Admin from '../models/Admin.js';
import { JWT_SECRET, JWT_OPTIONS, JWT_EXPIRY } from '../config/jwt.js';
import { supabase, isSupabaseEnabled } from '../config/supabase.js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import mongoose from 'mongoose';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv to look for .env file in the server root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

export const generateToken = (user) => {
    if (!user || !user._id) {
        throw new Error('Invalid user object');
    }

    const payload = {
        id: user._id.toString(),
        role: (user.role || 'petitioner').toLowerCase(),
        ...(user.department && { department: user.department })
    };

    return jwt.sign(payload, JWT_SECRET, { ...JWT_OPTIONS, expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, JWT_OPTIONS);
        return {
            ...decoded,
            id: decoded.id.toString(),
            role: decoded.role.toLowerCase()
        };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        }
        throw new Error('Invalid token');
    }
};

const MODELS = { petitioner: Petitioner, official: Official, admin: Admin };

const findUserByEmail = async (email) => {
    for (const [role, Model] of Object.entries(MODELS)) {
        const user = await Model.findOne({ email });
        if (user) return { user, role };
    }
    return null;
};

// Accepts either an app JWT (issued by /api/auth/*/login) or, when Supabase is
// configured, a Supabase access token.
export const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'No authentication token provided',
                code: 'TOKEN_MISSING'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        let found = null;
        let supabaseId;

        // 1. App-issued JWT
        try {
            const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
            const role = (decoded.role || '').toLowerCase();
            const Model = MODELS[role];
            if (Model && mongoose.Types.ObjectId.isValid(decoded.id)) {
                const user = await Model.findById(decoded.id);
                if (user) found = { user, role };
            }
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired', code: 'TOKEN_EXPIRED' });
            }
            // 2. Supabase access token (optional)
            if (isSupabaseEnabled) {
                const { data, error } = await supabase.auth.getUser(token);
                if (!error && data?.user) {
                    supabaseId = data.user.id;
                    found = await findUserByEmail(data.user.email);
                }
            }
        }

        if (!found) {
            return res.status(401).json({
                message: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }

        const { user, role } = found;
        req.user = {
            id: user._id.toString(),
            ...(supabaseId && { supabaseId }),
            role,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            ...(user.department && { department: user.department }),
            ...(user.taluk && { taluk: user.taluk }),
            ...(user.district && { district: user.district }),
            ...(user.division && { division: user.division })
        };

        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
};

// Restrict a route to one or more roles (use after auth)
export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied', code: 'FORBIDDEN' });
    }
    next();
};

export default auth; 