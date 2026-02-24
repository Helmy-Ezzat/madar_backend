// src/scripts/runScraper.ts
import 'dotenv/config';
import mongoose from 'mongoose';
import { telegramService } from '../services/TelegramService.js';

async function execute() {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ Connected to MongoDB.');

        await telegramService.run();
        
        console.log('🚀 Scrape process completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error in standalone runner:', error);
        process.exit(1);
    }
}

execute();