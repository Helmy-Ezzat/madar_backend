import 'dotenv/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram';
import { Job } from '../models/Job.js';
import { aiService } from './AiService.js';


interface CompanyData {
    name: string;
    license: string;
    description: string;
}

export const COMPANY_REGISTRY: Record<string, CompanyData> = {
    '@SaudiaJobsChannel': {
        name: 'شركة تراست جروب',
        license: '878',
        description: 'منصة رقمية رائدة في خدمات التوظيف بمصر والشرق الأوسط، تمتلك خبرة أكثر من 10 سنوات في ربط الكوادر المهنية بكبرى الشركات، مع تقديم حلول مبتكرة لتقييم المرشحين عبر الفيديو والسير الذاتية.',
    },
    '@jobwayegypt': {
        name: 'شركة جوب واي',
        license: '878',
        description: 'منصة توظيف رقمية متخصصة في مساعدة الباحثين عن عمل للوصول لأفضل الفرص في مصر والخليج، وتسهيل عملية استقطاب الكفاءات لأصحاب العمل من خلال قاعدة بيانات محدثة وفريق دعم متخصص.',
    },
    '@horizonrec': {
        name: 'شركة هورايزون',
        license: '1333',
        description: 'من أهم الشركات الرائدة في مصر والخليج بمجال توظيف وتشغيل الكوادر المصرية، وتتميز بخبرة واسعة في تلبية احتياجات السوق الخليجي والمصري من الكفاءات المتميزة في مختلف التخصصات.',
    },
    '@trustgroupksa': {
        name: '(نقل كفالة أو خدمات) تراست',
        license: '878',
        description: 'فرع متخصص من مجموعة تراست جروب يركز على خدمات نقل الكفالة والتوظيف المباشر في المملكة العربية السعودية، مع الالتزام بتوفير أفضل الكوادر البشرية والحلول الإدارية لقطاع الأعمال السعودي.',
    },
    '@ElshereefCompany463': {
        name: 'شركة الشريف',
        license: '463',
        description: 'شركة عريقة بخبرة تقترب من 20 عاماً، تبلغ مساحتها 500 متر مجهزة للمقابلات والاختبارات، وتمتلك قاعدة بيانات تضم آلاف السير الذاتية المنتقاة وفريقاً من الاستشاريين المتخصصين لضمان جودة الاختيار.',
    },
    '@JAzqZJT_iN9hNTM0': {
        name: 'شركة إستدامة',
        license: '1488',
        description: 'أول شركة في مصر متخصصة حصرياً في توظيف وكوادر قطاع (المطاعم، الفنادق، الكافيهات، والضيافة)، استطاعت كسب ثقة أكبر العلامات التجارية في السوق المصري والخليجي في وقت قياسي.',
    },
    '@Alzedancompany2006': {
        name: 'شركة آل زيدان',
        license: '581',
        description: 'من كبرى شركات توظيف المصريين بالخارج بخبرة واسعة وعلاقات وثيقة بدول الخليج، تعتمد على أحدث تكنولوجيا إدارة البيانات لاختيار العناصر البشرية الأكثر خبرة وفعالية من جميع المحافظات المصرية.',
    },
    '@RoyalCorne': {
        name: 'شركة الركن الملكي',
        license: '1415',
        description: 'مؤسسة متخصصة في استقدام العمالة والتوظيف بالخارج، توفر كوادر مؤهلة في مجالات الطب، الهندسة، المحاسبة، والعمالة الفنية، مع تقديم خدمات الدعم الكامل والتعقيب وتوثيق الأوراق الرسمية.',
    },
    '@mohamed2024Am': {
        name: 'شركة السلسبيل (محمد عبد الرؤوف)',
        license: '747',
        description: 'تتمتع بسمعة طيبة وموقع استراتيجي بالقاهرة، متخصصة في إلحاق الكفاءات المصرية بدول الخليج في قطاعات المقاولات والمستشفيات والتعليم، مع الالتزام التام بالشفافية وتسهيل كافة إجراءات السفر والفحص الطبي.',
    },
};

export const CHANNELS = Object.keys(COMPANY_REGISTRY);

// Service

const REQUEST_DELAY_MS = 15_000; // 15 seconds between AI requests

class TelegramService {
    private client: TelegramClient | null = null;

    private buildClient(): TelegramClient {
        const apiId = parseInt(process.env.TELEGRAM_API_ID ?? '0', 10);
        const apiHash = process.env.TELEGRAM_API_HASH ?? '';
        const session = new StringSession(process.env.TELEGRAM_STRING_SESSION ?? '');
        return new TelegramClient(session, apiId, apiHash, {
            connectionRetries: 3,
            useWSS: false,
            requestRetries: 2,
            timeout: 10000,
            autoReconnect: false,
            // Unique device identity helps Telegram distinguish this session
            // from stale/lingering connections that cause AUTH_KEY_DUPLICATED.
            deviceModel: `MadarBot-${process.pid}`,
            systemVersion: 'Linux',
            appVersion: '1.0.0',
        });
    }

    async connect(): Promise<boolean> {
        try {
            if (!process.env.TELEGRAM_STRING_SESSION) {
                console.error('❌ TELEGRAM_STRING_SESSION is missing.');
                return false;
            }
            this.client = this.buildClient();
            await this.client.connect();
            console.log('✅ Telegram client connected.');
            return true;
        } catch (error: any) {
            const isAuthKeyDuplicated =
                error?.errorMessage === 'AUTH_KEY_DUPLICATED' ||
                error?.message?.includes('AUTH_KEY_DUPLICATED');

            if (isAuthKeyDuplicated) {
                console.error(
                    '❌ Telegram connect error: AUTH_KEY_DUPLICATED\n' +
                    '   Your session string has been invalidated by Telegram.\n' +
                    '   ACTION REQUIRED: Generate a new TELEGRAM_STRING_SESSION and update your environment variables.'
                );
            } else {
                console.error('❌ Telegram connect error:', error);
            }
            return false;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            try {
                await this.client.disconnect();
                await this.client.destroy();
            } catch (error) {
                console.warn('⚠️  Error during disconnect:', error);
            } finally {
                this.client = null;
                console.log('🔌 Telegram client disconnected.');
            }
        }
    }

    /** Returns the highest message_id already stored for a channel (for deduplication). */
    private async getLastProcessedId(channelUsername: string): Promise<number> {
        const latest = await Job.findOne({ channel_username: channelUsername })
            .sort({ message_id: -1 })
            .select('message_id')
            .lean()
            .exec();
        return (latest as { message_id?: number } | null)?.message_id ?? 0;
    }

    async scrapeChannel(channel: string): Promise<void> {
        if (!this.client) throw new Error('Client not connected.');

        try {
            const entity = await this.client.getEntity(channel);
            const entityTitle = (entity as { title?: string }).title ?? channel;
            console.log(`📡 Checking channel: ${entityTitle}`);

            const companyData: CompanyData = COMPANY_REGISTRY[channel] ?? {
                name: entityTitle,
                license: '',
                description: '',
            };

            const lastId = await this.getLastProcessedId(channel);
            console.log(`Last processed message ID: ${lastId}`);

            const history = await this.client.invoke(
                new Api.messages.GetHistory({
                    peer: entity,
                    limit: 10,
                    offsetDate: 0,
                    offsetId: 0,
                    addOffset: 0,
                    maxId: 0,
                    minId: lastId,
                    hash: 0n as any,
                })
            );

            const messages = (history as Api.messages.Messages & { messages: Api.Message[] }).messages ?? [];
            let newCount = 0;

            for (const message of messages) {
                if (!(message instanceof Api.Message)) continue;
                if (message.id <= lastId) continue;
                await this.processMessage(message, channel, entityTitle, companyData);
                newCount++;
            }

            console.log(`✅ Processed ${newCount} new messages from ${channel}`);
        } catch (error) {
            console.error(`⚠️  Error scraping channel ${channel}:`, error);
        }
    }

    private async processMessage(
        message: Api.Message,
        channelUsername: string,
        channelTitle: string,
        companyData: CompanyData
    ): Promise<void> {
        console.log(`📩 Checking message ID: ${message.id} | Length: ${message.message?.length || 0}`);
        // Skip very short messages
        if (!message.message || message.message.length <= 40) return;

        // Deduplication — skip if already in DB
        const existing = await Job.findOne({
            message_id: message.id,
            channel_username: channelUsername,
        }).lean().exec();

        if (existing) return;

        console.log(`🧠 AI analysing new post from ${channelUsername}...`);
        const aiData = await aiService.parseJob(message.message);

        // Rate-limit delay between AI calls
        await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));

        const baseData = {
            message_id: message.id,
            source_platform: 'telegram',
            channel_username: channelUsername,
            channel_title: channelTitle,
            company_name: companyData.name,
            license_number: companyData.license,
            company_description: companyData.description,
            source_link: `https://t.me/${channelUsername.replace('@', '')}/${message.id}`,
            raw_text: message.message,
            published_at: new Date((message.date ?? 0) * 1000),
            is_job: false,
            job_info: null,
        };

        if (aiData?.is_job) {
            const jobTitles = aiData.job_titles ?? [];
            if (jobTitles.length > 0) {
                Object.assign(baseData, {
                    is_job: true,
                    job_info: {
                        job_titles: jobTitles,
                        location: aiData.location ?? '',
                        salary: aiData.salary ?? 'يحدد عند المقابلة',
                        experience: aiData.experience ?? 'غير محدد',
                        summary: aiData.summary ?? '',
                    },
                });
                const preview = jobTitles.slice(0, 2).join(', ');
                console.log(`✅ Job found: ${preview}${jobTitles.length > 2 ? '...' : ''}`);
            } else {
                console.log(`⏭️  Skipped: Invalid job data (no job_titles)`);
            }
        } else {
            console.log(`⏭️  Not a job post (saved for deduplication)`);
        }

        // Always upsert so we don't re-process non-job messages
        await Job.findOneAndUpdate(
            { message_id: message.id, channel_username: channelUsername },
            { $set: baseData },
            { upsert: true, new: true }
        ).exec();
    }

    /** Main entry — connect → scrape all channels → disconnect. Never throws. */
    /** Main entry — connect → scrape all channels → disconnect. Never throws. */
    async run(channels: string[] = CHANNELS): Promise<void> {
        try {
            console.log('\n🚀 Telegram scraper started...');

            const connected = await this.connect();
            if (!connected) {
                throw new Error('Could not connect to Telegram');
            }

            for (const channel of channels) {
                await this.scrapeChannel(channel);
            }

            console.log('🏁 Scraping finished. Data synced to MongoDB Atlas.\n');
        } catch (error) {
            console.error('❌ TelegramService.run fatal error:', error);
            throw error;
        } finally {
            await this.disconnect();

            console.log('👋 Process exiting...');
        }
    }
}

export const telegramService = new TelegramService();