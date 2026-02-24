import { connectDB } from '../config/db.js';
import { Job } from '../models/Job.js';
import { COMPANY_REGISTRY } from '../services/TelegramService.js'; 

const migrateCompanyData = async () => {
    try {
        console.log('🚀 Starting Data Migration...');
        await connectDB();

        const channels = Object.keys(COMPANY_REGISTRY); 

        for (const channel of channels) {
            const company = COMPANY_REGISTRY[channel];

            console.log(`⏳ Updating: ${channel} -> ${company.name}`);

            await Job.updateMany(
                { channel_username: channel },
                { 
                    $set: { 
                        company_name: company.name,
                        license_number: company.license,
                        company_description: company.description 
                    } 
                }
            );
        }
        console.log('🏁 Migration finished!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

migrateCompanyData();