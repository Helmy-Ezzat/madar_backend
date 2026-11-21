import 'dotenv/config';
import mongoose from 'mongoose';
import { telegramService } from '../services/TelegramService.js';

async function execute() {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI!, {
            dbName: process.env.DB_NAME || 'jobs_db',
        });
        console.log('✅ Connected to MongoDB.');

        let recovered = 0;
        let classified = 0;
        do {
            const batch = await telegramService.reprocessUnclassified(80);
            classified = batch.classified;
            recovered += batch.recovered;
        } while (classified > 0);

        console.log(`🚀 Reprocess completed. Recovered jobs this run: ${recovered}.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error in reprocess runner:', error);
        process.exit(1);
    }
}

execute();
