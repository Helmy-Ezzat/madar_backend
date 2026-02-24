import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { startScraperCron } from './cron/ScraperCron.js';

const PORT = parseInt(process.env.PORT ?? '5000', 10);

const bootstrap = async (): Promise<void> => {
    try {
        // 1 - DB Connection: Connect Database.
        await connectDB();
        console.log('✅ Database connected successfully');

        // 2 - Server Start: Start the server.
        app.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`\n🚀 Madar Backend is LIVE`);
            console.log(`   Port: ${PORT}`);
            console.log(`   Mode: ${process.env.NODE_ENV ?? 'development'}`);
            
            if (process.env.NODE_ENV !== 'production') {
                console.log(`   Local URL: http://localhost:${PORT}`);
                console.log(`   Health Check: http://localhost:${PORT}/health\n`);
            } else {
                console.log(`   Health Check Path: /health\n`);
            }
        });
        // 3 - Cron Scheduling: Start Scraper.
        startScraperCron();
        console.log('⏰ Scraper Cron initialized');

    } catch (err) {
        // 4 - Fatal Recovery: Handle Crash.
        console.error('❌ Fatal startup error:', err);
        process.exit(1); 
    }
};

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

bootstrap();
