import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase is optional. When it is not configured the server authenticates
// users locally (bcrypt password hashes in MongoDB + signed JWTs).
export const isSupabaseEnabled = Boolean(
    supabaseUrl && supabaseAnonKey && !supabaseUrl.startsWith('your_')
);

if (!isSupabaseEnabled) {
    console.warn('Supabase not configured - using local JWT authentication.');
}

// Client for general use (with anon key)
export const supabase = isSupabaseEnabled ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Admin client with service role key for server-side operations
export const supabaseAdmin = isSupabaseEnabled && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

export default supabase;
