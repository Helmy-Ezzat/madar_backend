import mongoose from 'mongoose';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI!;
// 1 - URI Validation: Secret key verification
if (!MONGODB_URI) {
    throw new Error('❌ MONGODB_URI is not defined in environment variables.');
}
// 2 - Database Connection: Establish data tunnel
export const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: process.env.DB_NAME || 'jobs_db',
        });
        console.log('✅ MongoDB connected successfully.');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};
// 3 - Auto-Recovery: Handle unexpected disconnections.
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});
// 4 - Error Handling: Fail-safe for missing database.
mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected.');
});
