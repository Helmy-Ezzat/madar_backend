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

// Service

class AiService {
    private client: Groq;
    private model = 'llama-3.3-70b-versatile';

    constructor() {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.warn('⚠️  GROQ_API_KEY is missing. AI parsing will return null.');
        }
        this.client = new Groq({ apiKey });
    }

    /**
     * Parses a raw Arabic Telegram message using Groq LLM.
     * Identical prompt to the Python AIParser — same fields, same rules.
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

            return JSON.parse(content) as ParsedJob;
        } catch (error) {
            console.error('⚠️  AiService.parseJob error:', error);
            return null;
        }
    }
}

export const aiService = new AiService();
