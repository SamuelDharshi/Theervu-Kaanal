import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { seedDatabase } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let memoryServer = null;

// Starts an embedded MongoDB (mongodb-memory-server) that stores its data in
// server/.localdb so the demo keeps its data between restarts and runs fully offline.
const startLocalMongo = async () => {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.join(__dirname, '..', '.localdb');
    fs.mkdirSync(dbPath, { recursive: true });

    memoryServer = await MongoMemoryServer.create({
        instance: {
            dbPath,
            dbName: 'theervu-kaanal',
            storageEngine: 'wiredTiger',
            launchTimeout: 60000
        }
    });
    return memoryServer.getUri('theervu-kaanal');
};

const connectDB = async () => {
    const remoteUri = process.env.MONGODB_URI;
    const forceLocal = process.env.USE_LOCAL_DB === 'true';

    if (remoteUri && !forceLocal) {
        try {
            await mongoose.connect(remoteUri, { serverSelectionTimeoutMS: 8000 });
            console.log('MongoDB connected (MONGODB_URI)');
            await seedDatabase();
            return;
        } catch (error) {
            console.error('MongoDB connection error:', error.message);
            console.warn('Falling back to the embedded local MongoDB...');
            await mongoose.disconnect().catch(() => { });
        }
    } else if (!remoteUri) {
        console.warn('MONGODB_URI not set - using the embedded local MongoDB (server/.localdb).');
    }

    try {
        const localUri = await startLocalMongo();
        await mongoose.connect(localUri);
        console.log(`Local MongoDB running at ${localUri}`);
        await seedDatabase();
    } catch (error) {
        console.error('Could not start the embedded MongoDB:', error.message);
        process.exit(1);
    }
};

const shutdown = async () => {
    try {
        await mongoose.disconnect();
        if (memoryServer) await memoryServer.stop({ doCleanup: false });
    } finally {
        process.exit(0);
    }
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

export default connectDB;
