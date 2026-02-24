import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import 'dotenv/config';

const apiId = parseInt(process.env.TELEGRAM_API_ID ?? '0', 10);
const apiHash = process.env.TELEGRAM_API_HASH ?? '';
const stringSession = new StringSession(process.env.TELEGRAM_STRING_SESSION ?? '');

if (!apiId || !apiHash) {
    console.warn('⚠️  Telegram credentials are missing. Scraper will not function.');
}

export const createTelegramClient = (): TelegramClient => {
    const sessionStr = process.env.TELEGRAM_STRING_SESSION ?? '';
    
    if (!sessionStr) {
        console.error('❌ TELEGRAM_STRING_SESSION is missing! Scraper cannot authorize.');
    }

    const client = new TelegramClient(
        new StringSession(sessionStr), 
        apiId, 
        apiHash, 
        {
            connectionRetries: 10,
            retryDelay: 2000,
            autoReconnect: true,
            floodSleepThreshold: 60 
        }
    );
    return client;
};
