import cron from 'node-cron';
import { telegramService } from '../services/TelegramService.js';

/*
 * Schedules the Telegram scraper to run every hour.
 * Expression: 0 * * * *
 * Runs at the start of every hour (24 times per day)
*/
export const startScraperCron = (): cron.ScheduledTask => {
    let isScraping = false;

    const task = cron.schedule('0 * * * *', async () => {
        if (isScraping) {
            console.log('⚠️ Scraper is already running, skipping this cycle.');
            return;
        }

        isScraping = true;
        console.log(`\n🕐 [${new Date().toISOString()}] Cron: starting Telegram scraper...`);

        try {
            await telegramService.run();
        } catch (error) {
            console.error('❌ Cron job error:', error);
        } finally {
            isScraping = false;
        }
    });

    return task;
};