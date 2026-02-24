import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

import JobRoutes from './routes/v1/JobRoutes.js';

const app = express();

// 1 - CORS Policy: Who can call me
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'https://madar-jobs.vercel.app,http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g., Postman, server-to-server)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: origin '${origin}' is not allowed.`));
            }
        },
        methods: ['GET'],
        credentials: false,
    })
);

// 2 - Rate Limiting: How many times they can call
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                   // max requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Please try again later.' },
});
app.use(limiter);

//  Body Parser 
app.use(express.json());

// 3 - Routing: Where the request goes 
app.use('/api/v1/jobs', JobRoutes);
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 4 - Error Handling: How to handle failures
app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Route not found.' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error.' });
});

export default app;
