import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import JobRoutes from './routes/v1/JobRoutes.js';
import AuthRoutes from './routes/v1/AuthRoutes.js';
import SavedJobRoutes from './routes/v1/SavedJobRoutes.js';
import SavedSearchRoutes from './routes/v1/SavedSearchRoutes.js';
import NotificationRoutes from './routes/v1/NotificationRoutes.js';
import { healthCheck } from './controllers/v1/JobController.js';

const app = express();

// Trust proxy - needed for rate limiting behind proxies/load balancers
app.set('trust proxy', 1);

// 1 - CORS Policy: Who can call me
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'https://madar-jobs.vercel.app,http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        credentials: false,
    })
);
// 2 - Body Parser
app.use(express.json());

// 3 - Routes
app.get('/', (_req: Request, res: Response) => {
    res.status(200).send('🚀 Madar API is LIVE and Running');
});
app.get('/health', healthCheck);

// 4 - Rate Limiting: How many times they can call
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                   // max requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Please try again later.' },
});
app.use('/api',limiter);
app.use('/api/v1/jobs', JobRoutes);
app.use('/api/v1/auth', AuthRoutes);
app.use('/api/v1/saved-jobs', SavedJobRoutes);
app.use('/api/v1/saved-searches', SavedSearchRoutes);
app.use('/api/v1/notifications', NotificationRoutes);

// 5 - Error Handling: How to handle failures
app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Route not found.' });
});

// 6 - Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error.' });
});

export default app;
