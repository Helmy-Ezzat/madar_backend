import Groq from 'groq-sdk';
import 'dotenv/config';

// Types

export interface ParsedJob {
    is_job: boolean;
    job_titles?: string[];
    location?: string;
    salary?: string;
    experience?: string;
    summary?: string;
}

// Groq retired llama-3.3-70b-versatile for free/developer tiers on 2026-08-16.
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

class AiService {
    private client: Groq;
    private model: string;

    constructor() {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.warn('⚠️  GROQ_API_KEY is missing. AI parsing will return null.');
        }
        this.client = new Groq({ apiKey });
        this.model = process.env.GROQ_MODEL || DEFAULT_MODEL;
    }

    /**
     * Parses a raw Arabic Telegram message using Groq LLM.
     * Returns null on error or if the Groq API is unreachable.
     */
    async parseJob(rawText: string): Promise<ParsedJob | null> {
        const prompt = `أنت محلل وظائف ذكي. حلل هذا المنشور العربي واستخرج بيانات منظمة بصيغة JSON.

        قواعد صارمة:
        1. إذا كان المنشور نصيحة أو تحية أو إعلان بدون وظيفة محددة، أرجع: {"is_job": false}
        2. استخرج كل المسميات الوظيفية كمصفوفة (array) منفصلة
        3. salary: 
            - إذا وجد رقم (مثلاً: 5000)، اكتب الرقم فقط.
            - إذا لم يوجد رقم، اكتب "حسب الخبرة".
            - إذا ذكر النص "يحدد في المقابلة"، اكتب "قابل للتفاوض".
        4. experience: 
            - إذا ذكر عدد سنين (مثلاً: 3 سنوات)، اكتبها (مثل: "3 سنوات").
            - إذا لم تذكر، اكتب "غير محدد".
        5. summary: أنت خبير توظيف ومحرر محتوى محترف. قم بصياغة ملخص الوظيفة بلغة عربية سليمة وجذابة، بعيداً عن الترجمة الحرفية. ابدأ بجوهر الوظيفة مباشرة، واستخدم جملة قصيرة وواضحة تلخص أهم المزايا في 3 أسطر

        الحقول المطلوبة (أرجع JSON بهذا الشكل بالضبط):
        {
        "is_job": boolean,
        "job_titles": ["وظيفة 1", "وظيفة 2"],
        "location": "المدينة، الدولة",
        "salary": "الراتب أو حسب الخبرة",
        "experience": "عدد السنين أو غير محدد",
        "summary": "وصف مختصر من 3 أسطر"
        }

        ملاحظات:
        - is_job: true فقط إذا كان إعلان وظيفة فعلي
        - job_titles: مصفوفة بكل المسميات الوظيفية المذكورة
        النص:
        ${rawText}

        أرجع JSON فقط.`;

        try {
            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) return null;

            return this.parseJsonContent(content);
        } catch (error) {
            console.error('⚠️  AiService.parseJob error:', error);
            return null;
        }
    }

    private parseJsonContent(content: string): ParsedJob {
        const trimmed = content.trim();
        try {
            return JSON.parse(trimmed) as ParsedJob;
        } catch {
            const match = trimmed.match(/\{[\s\S]*\}/);
            if (!match) throw new Error('Model response was not valid JSON');
            return JSON.parse(match[0]) as ParsedJob;
        }
    }
}

export const aiService = new AiService();
