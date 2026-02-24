import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { startScraperCron } from './cron/ScraperCron.js';
import mongoose from 'mongoose';
import cron from 'node-cron';

const PORT = process.env.PORT || 8080;
let scraperTask: cron.ScheduledTask | null = null;

const bootstrap = async (): Promise<void> => {
    try {
        // 1 - DB Connection: Connect Database.
        await connectDB();
        console.log('✅ Database connected successfully');

        // 2 - Server Start: Start the server.
        const server = app.listen(Number(PORT), '0.0.0.0', () => {
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
        scraperTask = startScraperCron();
        console.log('⏰ Scraper Cron initialized');

        // 4 - Graceful Shutdown: Handle SIGTERM and SIGINT
        const shutdown = async (signal: string) => {
            console.log(`\n⚠️  Received ${signal}, starting graceful shutdown...`);
            
            // Stop accepting new requests
            server.close(() => {
                console.log('✅ HTTP server closed');
            });

            // Stop the cron job
            if (scraperTask) {
                scraperTask.stop();
                console.log('✅ Scraper Cron stopped');
            }

            // Close MongoDB connection
            try {
                await mongoose.disconnect();
                console.log('✅ MongoDB disconnected');
            } catch (error) {
                console.error('❌ Error disconnecting MongoDB:', error);
            }

            console.log('✅ Graceful shutdown complete');
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

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
