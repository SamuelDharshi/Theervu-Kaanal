import { StreamChat } from 'stream-chat';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

export const STREAM_API_KEY = process.env.STREAM_API_KEY || '';
const STREAM_API_SECRET = process.env.STREAM_API_SECRET || '';

// Stream Chat is optional. Without credentials the app uses its built-in
// chat (messages stored on the grievance in MongoDB).
export const isStreamEnabled = Boolean(STREAM_API_KEY && STREAM_API_SECRET);

const streamChat = isStreamEnabled ? new StreamChat(STREAM_API_KEY, STREAM_API_SECRET) : null;

export default streamChat;
