import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import logger from './utils/logger';
import { requestLogger } from './middlewares/request-logger.middleware';
import rateLimit from 'express-rate-limit';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? 'production.env' : 'development.env';
dotenv.config({ path: envFile });

// ============================================
// Rate Limiting Configuration (P1 Security)
// ============================================
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health', // Don't rate limit health checks
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 uploads per minute
    message: { error: 'Upload limit exceeded. Please wait before uploading more files.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per 15 minutes
    message: { error: 'Too many login attempts, please try again later.' }
});

const app = express();
// initialized with empty object to satisfy stricter constructor checks if needed,
// or explicit log options which are common.
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

const PORT = process.env.PORT || 3000;

// Trust proxy for ALB (handles X-Forwarded-* headers)
app.set('trust proxy', 1);

// CORS configuration - allow CloudFront, API domain, EC2 domain, and ALB DNS names
const allowedOrigins: string[] = [
    'https://d3awhf5a50mcra.cloudfront.net', // CloudFront domain
    'https://api.securosense.com', // API domain (if frontend uses it)
    'http://3.128.203.121:3000', // EC2 IP (for direct access)
    'http://ec2-3-128-203-121.us-east-2.compute.amazonaws.com:3000', // EC2 domain (for Swagger UI)
    'http://ec2-3-128-203-121.us-east-2.compute.amazonaws.com', // EC2 domain without port
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []), // Custom frontend URL from env
    ...(process.env.CLOUDFRONT_DOMAIN ? [`https://${process.env.CLOUDFRONT_DOMAIN}`] : []), // Dynamic CloudFront domain
];

// app.use(cors({
//     origin: (origin, callback) => {
//         // Allow requests with no origin (like mobile apps, Postman, or same-origin)
//         if (!origin) {
//             callback(null, true);
//             return;
//         }
//
//         // In development, allow all origins
//         if (process.env.NODE_ENV !== 'production') {
//             callback(null, true);
//             return;
//         }
//
//         // Check if origin is in allowed list
//         const isInAllowedList = allowedOrigins.some(allowed => {
//             if (!allowed) return false;
//             // Exact match or starts with (for paths)
//             return origin === allowed || origin.startsWith(allowed);
//         });
//
//         // Check for CloudFront domains (any CloudFront distribution)
//         const isCloudFront = origin.includes('.cloudfront.net');
//
//         // Check for ALB DNS names
//         const isALB = origin.endsWith('.elb.amazonaws.com');
//
//         // Check for EC2 domains
//         const isEC2 = (origin.includes('ec2-') && origin.includes('.compute.amazonaws.com'))
//                    || origin.includes('3.128.203.121');
//
//         // Check for localhost (development/testing)
//         const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
//
//         const isAllowed = isInAllowedList || isCloudFront || isALB || isEC2 || isLocalhost;
//
//         if (isAllowed) {
//             logger.debug(`CORS allowed origin: ${origin}`);
//             callback(null, true);
//         } else {
//             logger.warn(`CORS blocked origin: ${origin}`);
//             logger.warn(`Allowed origins: ${allowedOrigins.join(', ')}`);
//             // STRICT MODE: Reject unknown origins in production
//             callback(new Error('Not allowed by CORS'), false);
//         }
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
//     exposedHeaders: ['Content-Range', 'X-Content-Range'],
//     maxAge: 86400, // 24 hours
// }));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    exposedHeaders: [
        'Content-Range',
        'X-Content-Range'
    ],
    maxAge: 86400
}));


app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increase URL-encoded payload limit
app.use(requestLogger); // Add request logging

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Swagger JSON endpoint (for Swagger UI to fetch the spec)
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    // Add CORS headers for Swagger UI
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.send(swaggerSpec);
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'SecuroSense API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        url: '/api-docs.json',
    },
}));

// Also serve Swagger at /swagger for backward compatibility
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'SecuroSense API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        url: '/api-docs.json', // Use the JSON endpoint
    },
}));

// Root route - redirect to API docs
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// Health Check (for ALB and monitoring) - Enhanced with dependency checks
app.get('/health', async (req, res) => {
    const health: {
        status: string;
        timestamp: string;
        checks: {
            database?: string;
            ai?: string;
        };
    } = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        checks: {}
    };

    // Check Database connectivity
    try {
        await prisma.$queryRaw`SELECT 1`;
        health.checks.database = 'healthy';
    } catch (error) {
        health.status = 'degraded';
        health.checks.database = 'unhealthy';
        logger.error('Health check: Database unhealthy', { error });
    }

    // Check AI Service configuration
    health.checks.ai = process.env.GOOGLE_AI_KEY ? 'configured' : 'missing_key';
    if (!process.env.GOOGLE_AI_KEY) {
        health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
});

// Test endpoint to verify server is running
app.get('/test', (req, res) => {
    res.json({
        message: 'Server is running!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

import authRoutes from './routes/auth.routes';
import analysisRoutes from './routes/analysis.routes';
import ingestionRoutes from './routes/ingestion.routes';
import teamRoutes from './routes/team.routes';
import qaTemplateRoutes from './routes/qa-template.routes';
import qaParameterRoutes from './routes/qa-parameter.routes';
import roleRoutes from './routes/role.routes';
import onboardingRoutes from './routes/onboarding.routes';
import promiseRoutes from './routes/promise.routes';
import salesRoutes from './routes/sales.routes';
import organizationRoutes from './routes/organization.routes';
import complianceRoutes from './routes/compliance.routes';
import dataRetentionRoutes from './routes/data-retention.routes';
import { initializePermissions } from './services/permission.service';
import { seedDefaultTemplates } from './services/qa-template.service';
import { seedDefaultRoles } from './services/role.service';

// Routes with specific rate limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/analysis/upload', uploadLimiter); // Extra protection for uploads
app.use('/api/analysis', analysisRoutes);
app.use('/api/ingestion', ingestionRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/qa-templates', qaTemplateRoutes);
app.use('/api/qa-parameters', qaParameterRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/promises', promiseRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/data-retention', dataRetentionRoutes);

// Only listen if run directly (avoids port in use when testing/importing)
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`🚀 Server is running on http://localhost:${PORT}`);
        logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
        logger.info(`💾 Logs are saved to ./logs directory`);

        // Initialize permissions and templates in the background (non-blocking)
        // This allows the server to start immediately and handle requests
        (async () => {
            try {
                logger.info('Initializing permissions...');
                await initializePermissions();
                logger.info('✅ Permissions initialized');

                logger.info('Seeding default roles...');
                await seedDefaultRoles();
                logger.info('✅ Default roles seeded');

                logger.info('Seeding default QA templates...');
                await seedDefaultTemplates();
                logger.info('✅ Default templates seeded');
            } catch (error) {
                logger.error('Error during initialization:', error);
            }
        })();
    });
}

export const db = prisma;
export default app;
