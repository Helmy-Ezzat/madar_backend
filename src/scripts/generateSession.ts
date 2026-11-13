import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const apiId = parseInt(process.env.TELEGRAM_API_ID ?? '', 10);
const apiHash = process.env.TELEGRAM_API_HASH ?? '';

if (!apiId || !apiHash) {
    console.error('❌ TELEGRAM_API_ID or TELEGRAM_API_HASH is missing in .env');
    process.exit(1);
}

const rl = readline.createInterface({ input, output });

async function main() {
    console.log('🔄 Initializing Telegram Client...');
    const stringSession = new StringSession('');
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => {
            const phone = await rl.question('📱 Enter your phone number (e.g. +2010...): ');
            return phone.trim();
        },
        password: async () => {
            const pwd = await rl.question('🔒 Enter your 2FA password (if enabled, or press Enter): ');
            return pwd.trim();
        },
        phoneCode: async () => {
            const code = await rl.question('📩 Enter the verification code received on Telegram: ');
            return code.trim();
        },
        onError: (err) => console.error('Telegram Auth Error:', err),
    });

    console.log('\n✅ Successfully authenticated with Telegram!');
    const sessionString = client.session.save() as unknown as string;

    // Automatically update .env
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (/TELEGRAM_STRING_SESSION=.*/.test(envContent)) {
            envContent = envContent.replace(/TELEGRAM_STRING_SESSION=.*/, `TELEGRAM_STRING_SESSION=${sessionString}`);
        } else {
            envContent += `\nTELEGRAM_STRING_SESSION=${sessionString}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('💾 TELEGRAM_STRING_SESSION has been automatically saved to .env file!');
    }

    console.log('\n--- Your Session String ---');
    console.log(sessionString);
    console.log('---------------------------\n');

    await client.disconnect();
    rl.close();
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Failed to generate session:', err);
    rl.close();
    process.exit(1);
});

