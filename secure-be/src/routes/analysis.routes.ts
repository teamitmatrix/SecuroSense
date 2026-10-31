import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { analyzeCall } from '../services/analysis.service';
import { generateCallPDF } from '../services/pdf.service';
import { db } from '../index';
import logger from '../utils/logger';
import * as musicMetadata from 'music-metadata';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { filterByOrganization } from '../middlewares/organization.middleware';
import { warnIfNoConsent } from '../middlewares/consent.middleware';
import { decryptField, encryptField } from '../utils/encryption';

const router = Router();

// Hardcoded for Ubuntu production: always absolute so recording playback never uses relative "uploads/..." (avoids ENOENT).
const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.resolve(process.cwd(), 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '0', 10) || 25 * 1024 * 1024; // 25MB default

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    logger.info('Created upload directory', { UPLOAD_DIR });
}

const sanitizeFileName = (name: string): string => {
    const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
    return base || `recording-${Date.now()}`;
};

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
        filename: (_req, file, cb) => cb(null, `${Date.now()}-${sanitizeFileName(file.originalname)}`),
    }),
    limits: { fileSize: MAX_FILE_SIZE },
});

// Trim to avoid quotes/whitespace from .env breaking the key
const googleApiKey = (process.env.GOOGLE_AI_KEY || '').trim();
const genAI = new GoogleGenerativeAI(googleApiKey);
const fileManager = new GoogleAIFileManager(googleApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

const INVALID_KEY_MESSAGE = 'The AI API key is invalid or was revoked (e.g. reported as leaked). Create a new key at https://aistudio.google.com/app/apikey and set GOOGLE_AI_KEY in your .env.';

function isInvalidKeyError(error: any): boolean {
    const msg = (error?.message || error?.toString() || '').toLowerCase();
    const code = error?.code ?? error?.status ?? error?.statusCode;
    return (
        !googleApiKey ||
        code === 401 ||
        code === 403 ||
        msg.includes('leaked') ||
        msg.includes('403') ||
        msg.includes('401') ||
        msg.includes('invalid api key') ||
        msg.includes('api key not valid') ||
        msg.includes('apikey') && msg.includes('invalid') ||
        msg.includes('revoked') ||
        msg.includes('permission_denied') ||
        msg.includes('forbidden')
    );
}

/**
 * Decrypt PII for UI display (server-side only).
 * We encrypt phone numbers at rest; UI should never receive ciphertext.
 */
const decryptPhoneMaybe = (value: string | null | undefined): string | null | undefined => {
    if (!value) return value;
    try {
        return decryptField(value);
    } catch {
        return value;
    }
};

/** Attach playback URL for local recordings (no S3). Frontend should use this for audio src. */
const withRecordingPlaybackUrl = (call: any): any => {
    if (!call) return call;
    const hasLocalRecording =
        call.recordingUrl &&
        !call.recordingUrl.startsWith('http://') &&
        !call.recordingUrl.startsWith('https://');
    return {
        ...call,
        recordingPlaybackUrl: hasLocalRecording ? `analysis/${call.id}/recording` : undefined,
    };
};

/**
 * Helper to generate and save PDF report
 */
const savePDFReport = async (result: any) => {
    try {
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const pdfBuffer = await generateCallPDF(result);
        const pdfPath = path.join(reportsDir, `analysis-${result.id}.pdf`);
        fs.writeFileSync(pdfPath, pdfBuffer);
        logger.info('Auto-generated PDF report saved', { callId: result.id, path: pdfPath });
    } catch (pdfError) {
        logger.error('Failed to auto-generate PDF report', { error: pdfError, callId: result.id });
    }
};

/**
 * Transcribe audio file using Google Gemini
 */
const transcribeAudio = async (filePath: string): Promise<string> => {
    if (!googleApiKey) {
        throw new Error('GOOGLE_AI_KEY is not set. ' + INVALID_KEY_MESSAGE);
    }
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(UPLOAD_DIR, path.basename(filePath));
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Recording file not found: ${absolutePath}`);
    }
    try {
        logger.info('Starting audio transcription using Gemini File API', { filePath: absolutePath });

        const uploadResult = await fileManager.uploadFile(absolutePath, {
            mimeType: "audio/mpeg",
            displayName: path.basename(absolutePath),
        });

        const fileUri = uploadResult.file.uri;
        const fileName = uploadResult.file.name;
        logger.info(`File uploaded to Gemini. URI: ${fileUri}`);

        let file = await fileManager.getFile(fileName);
        while (file.state === FileState.PROCESSING) {
            logger.info('File is still processing, waiting 2 seconds...');
            await new Promise((resolve) => setTimeout(resolve, 2000));
            file = await fileManager.getFile(fileName);
        }

        if (file.state === FileState.FAILED) {
            throw new Error("Gemini file processing failed.");
        }

        const prompt = "Please transcribe this audio file exactly as spoken. If there are multiple people speaking, please identify them as 'Customer' and 'Agent' (or Person 1 and Person 2 if the roles are unclear) and prefix their speech accordingly. Return only the transcription text in a dialogue format.";

        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: file.mimeType,
                    fileUri: file.uri,
                },
            },
            { text: prompt },
        ], {
            timeout: 300000,
        });

        const transcription = result.response.text();

        try {
            await fileManager.deleteFile(fileName);
        } catch (deleteError) {
            logger.warn('Failed to delete file from Gemini servers', { fileName, deleteError });
        }

        return transcription;
    } catch (error: any) {
        logger.error('Audio transcription failed with Gemini File API', { error: error.message, filePath });
        throw new Error(`Transcription failed: ${error.message || 'Unknown error'}`);
    }
};

/**
 * @swagger
 * /api/analysis/upload:
 *   post:
 *     summary: Upload and analyze audio recording
 *     description: Uploads an audio file, transcribes it, and performs AI analysis including sentiment, topics, keywords, and QA scoring
 *     tags: [Call Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - recording
 *             properties:
 *               recording:
 *                 type: string
 *                 format: binary
 *                 description: Audio file (MP3, WAV, etc.) - max 25MB
 *               customerName:
 *                 type: string
 *                 example: John Doe
 *               agentName:
 *                 type: string
 *                 example: Jane Smith
 *               customerNumber:
 *                 type: string
 *                 example: +1234567890
 *               leadId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Call analyzed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 transcript:
 *                   type: string
 *                 analysis:
 *                   $ref: '#/components/schemas/CallAnalysis'
 *       400:
 *         description: Bad request (no file or invalid file)
 *       500:
 *         description: Internal server error
 */

/**
 * Direct upload only (no S3). Returns instructions for POST multipart upload.
 * GET /api/analysis/upload-url - use response to upload via POST /api/analysis/upload instead.
 */
router.get('/upload-url', authenticateJWT, (_req, res) => {
    res.json({
        directUpload: true,
        endpoint: 'analysis/upload',
        method: 'POST',
        fieldName: 'recording',
        message: 'Upload the file directly to POST /api/analysis/upload with multipart/form-data. No S3.',
        uploadUrl: null,
        fileUrl: null,
        key: null,
    });
});

router.post('/upload', authenticateJWT, upload.single('recording'), warnIfNoConsent, async (req, res) => {
    let tempFilePath: string | null = null;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No recording file uploaded' });
        }

        // Use absolute path so it works regardless of process cwd (pm2/systemd on Ubuntu)
        const fileAbsolutePath = path.isAbsolute(req.file.path)
            ? req.file.path
            : path.resolve(UPLOAD_DIR, req.file.filename);
        tempFilePath = fileAbsolutePath;

        const { customerName, customerNameAr, agentName, agentNameAr, customerNumber, leadId, consentObtained, consentMethod } = req.body;

        // Encrypt customer phone number before storage (P0 Security)
        const customerPhone = customerNumber ? encryptField(customerNumber) : undefined;

        // Get organizationId from body or user token
        const user = (req as any).user;
        let organizationId = user?.organizationId;

        // If user is a platform admin (no fixed organizationId), allow them to specify one in the request
        if ((organizationId === null || organizationId === undefined) && req.body.organizationId) {
            organizationId = parseInt(req.body.organizationId);
        }

        // Calculate duration
        let duration = 0;
        try {
            const metadata = await musicMetadata.parseFile(fileAbsolutePath);
            duration = Math.round(metadata.format.duration || 0);
            logger.info('Calculated audio duration', { duration, fileName: req.file.filename });
        } catch (metadataError) {
            logger.warn('Failed to parse audio metadata, defaulting to 0', { error: metadataError });
        }

        const transcript = await transcribeAudio(fileAbsolutePath);

        logger.info('Uploading call', {
            userId: user?.userId,
            organizationId,
            customerName,
            hasTranscript: !!transcript,
            consentObtained: !!consentObtained
        });

        // Store path relative to UPLOAD_DIR for playback (so we resolve with UPLOAD_DIR when serving)
        const recordingPath = req.file.filename;

        const result = await analyzeCall({
            transcript,
            customerName: customerName || 'Uploaded Customer',
            customerNameAr: customerNameAr || undefined,
            duration,
            agentName: agentName || undefined,
            agentNameAr: agentNameAr || undefined,
            recordingUrl: recordingPath,
            leadId: leadId ? Number.parseInt(leadId as string) : undefined,
            customerPhone,
            organizationId: organizationId ?? undefined,
            consentObtained: consentObtained === true || consentObtained === 'true',
            consentMethod: consentMethod || 'electronic'
        });

        logger.info('Call analyzed and saved', {
            callId: result.id,
            organizationId: result.organizationId,
            leadId: result.leadId,
            recordingPath
        });

        setImmediate(async () => {
            try {
                await savePDFReport(result);
            } catch (pdfError) {
                logger.error('Background PDF generation failed', { callId: result.id, error: pdfError });
            }
        });

        res.json(withRecordingPlaybackUrl(result));
    } catch (error: any) {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch (e) { }
        }
        if (error.code === 'ENOENT' && error.path) {
            return res.status(500).json({
                error: 'Recording file not found during processing',
                details: 'Set UPLOAD_DIR to an absolute path in production (e.g. /home/ubuntu/secure/securo_backend/uploads) and ensure the process is started from the project directory, or restart the app after deploying.',
            });
        }
        // Better error message for quota issues
        if (error.message.includes('429')) {
            return res.status(429).json({
                error: 'AI Quota Exceeded',
                details: 'The free tier quota for transcription has been reached. Please try again in 1 minute or check your Gemini API plan.',
                suggestedWait: 60
            });
        }

        // Friendly message when API key is missing, invalid, or revoked
        if (isInvalidKeyError(error) || error.message?.includes('GOOGLE_AI_KEY is not set')) {
            return res.status(503).json({
                error: 'Transcription service unavailable',
                details: INVALID_KEY_MESSAGE,
            });
        }
        res.status(500).json({ error: error.message || 'Failed to process recording' });
    }
});

/**
 * Get all unique leads with pagination and latest interaction info
 */
router.get('/leads', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Get organizationId from JWT token
        const user = (req as any).user;
        const userOrganizationId = user?.organizationId;

        // For super_admin: can use query param to filter by specific organization, or null to see all
        // For regular admin: must use their own organizationId (ignore query param for security)
        let organizationId: number | null | undefined;
        if (userOrganizationId === null || userOrganizationId === undefined) {
            // Super Admin - can use query param
            organizationId = req.query.organizationId
                ? parseInt(req.query.organizationId as string)
                : null; // null = show all
        } else {
            // Regular Admin - must use their own organizationId
            organizationId = userOrganizationId;
        }

        const userRole = user?.role;
        const userName = user?.name || user?.email;

        // Check if user is an Agent
        const isAgent = userRole === 'Agent' || (typeof userRole === 'object' && userRole?.name === 'Agent');

        logger.info('Fetching leads', {
            userId: user?.userId,
            userOrganizationId,
            queryOrganizationId: req.query.organizationId,
            finalOrganizationId: organizationId,
            isAgent,
            userName
        });

        const where: any = {};
        // Filter by organizationId if specified
        // Super Admin with null sees all leads
        if (organizationId !== null && organizationId !== undefined) {
            where.calls = {
                some: {
                    organizationId: organizationId
                }
            };
        }

        // For Agents: filter leads by their agent name
        if (isAgent && userName) {
            if (where.calls) {
                where.calls.some.agentName = userName;
            } else {
                where.calls = {
                    some: {
                        agentName: userName
                    }
                };
            }
        }

        logger.info('Leads query where clause', { where });

        const [leads, total] = await Promise.all([
            db.lead.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                include: {
                    _count: {
                        select: { calls: true }
                    },
                    calls: {
                        orderBy: { timestamp: 'desc' },
                        take: 1,
                        include: { analysis: true }
                    }
                },
                skip,
                take: limit
            }),
            db.lead.count({ where })
        ]);

        const decryptedLeads = leads.map((lead) => ({
            ...lead,
            customerPhone: decryptPhoneMaybe((lead as any).customerPhone),
            calls: (lead as any).calls?.map((call: any) =>
                withRecordingPlaybackUrl({
                    ...call,
                    customerPhone: decryptPhoneMaybe(call.customerPhone),
                })
            ) ?? (lead as any).calls
        }));

        res.json({
            leads: decryptedLeads,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        logger.error('Failed to fetch leads', { error });
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

/**
 * Get details for a specific lead with history
 */
router.get('/leads/:id', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const user = (req as any).user;
        const organizationId = user?.organizationId;
        const userRole = user?.role;
        const userName = user?.name || user?.email;

        // Check if user is an Agent
        const isAgent = userRole === 'Agent' || (typeof userRole === 'object' && userRole?.name === 'Agent');

        // Build where clause for calls
        const callsWhere: any = {};

        // Filter by organizationId if user has one (not super_admin)
        if (organizationId !== null && organizationId !== undefined) {
            callsWhere.organizationId = organizationId;
        }

        // For Agents: filter calls by their agent name
        if (isAgent && userName) {
            callsWhere.agentName = userName;
        }

        const lead = await db.lead.findUnique({
            where: { id: Number.parseInt(req.params.id) },
            include: {
                calls: {
                    where: Object.keys(callsWhere).length > 0 ? callsWhere : undefined,
                    orderBy: { timestamp: 'desc' },
                    include: { analysis: true }
                }
            }
        });

        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        // Check if lead has any calls for this organization/agent (if not super_admin)
        if (organizationId !== null && organizationId !== undefined && lead.calls.length === 0) {
            return res.status(403).json({ error: 'Forbidden', message: 'You do not have access to this lead' });
        }

        // For agents: also check if they have any calls for this lead
        if (isAgent && lead.calls.length === 0) {
            return res.status(403).json({ error: 'Forbidden', message: 'You do not have access to this lead' });
        }

        const decryptedLead = {
            ...lead,
            customerPhone: decryptPhoneMaybe((lead as any).customerPhone),
            calls: (lead as any).calls?.map((call: any) =>
                withRecordingPlaybackUrl({
                    ...call,
                    customerPhone: decryptPhoneMaybe(call.customerPhone),
                })
            ) ?? (lead as any).calls
        };

        res.json(decryptedLead);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lead details' });
    }
});

/**
 * Get aggregated performance statistics for agents
 * OPTIMIZED: Uses database-level aggregation instead of loading all calls into memory
 */
router.get('/performance/agents', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const user = (req as any).user;
        const organizationId = user?.organizationId;

        // Use raw SQL for efficient database-level aggregation
        // This avoids loading all calls into memory (P1 Scalability fix)
        const orgFilter = organizationId !== null && organizationId !== undefined
            ? `WHERE c."organizationId" = ${organizationId}`
            : '';

        const result: any[] = await db.$queryRawUnsafe(`
            SELECT 
                COALESCE(c."agentName", 'Unknown Agent') as name,
                COUNT(c.id)::int as "totalCalls",
                COALESCE(ROUND(AVG(ca.score)), 0)::int as "avgScore",
                COUNT(CASE WHEN ca."wasDealClosed" = true THEN 1 END)::int as "dealsClosed",
                COUNT(CASE WHEN ca.sentiment = 'POSITIVE' THEN 1 END)::int as "positiveCount",
                COUNT(CASE WHEN ca.sentiment = 'NEUTRAL' THEN 1 END)::int as "neutralCount",
                COUNT(CASE WHEN ca.sentiment = 'NEGATIVE' THEN 1 END)::int as "negativeCount"
            FROM "Call" c
            LEFT JOIN "CallAnalysis" ca ON c.id = ca."callId"
            ${orgFilter}
            GROUP BY c."agentName"
            ORDER BY COUNT(c.id) DESC
            LIMIT 100
        `);

        // Transform to expected format
        const formattedResult = result.map(row => ({
            name: row.name,
            totalCalls: row.totalCalls,
            avgScore: row.avgScore,
            dealsClosed: row.dealsClosed,
            closingRate: row.totalCalls > 0 ? Math.round((row.dealsClosed / row.totalCalls) * 100) : 0,
            sentimentBreakdown: {
                POSITIVE: row.positiveCount,
                NEUTRAL: row.neutralCount,
                NEGATIVE: row.negativeCount
            }
        }));

        res.json(formattedResult);
    } catch (error) {
        logger.error('Failed to fetch agent performance', { error });
        res.status(500).json({ error: 'Failed to fetch performance stats' });
    }
});

/**
 * @swagger
 * /api/analysis:
 *   get:
 *     summary: Get all analyzed calls with pagination
 *     description: Returns paginated list of calls with their analysis. Data is filtered by organization automatically.
 *     tags: [Call Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Paginated list of calls
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 calls:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Call'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page as string) || 1;
        const limit = Number.parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Get organizationId from middleware (set by filterByOrganization)
        const user = (req as any).user;
        const organizationId = user?.organizationId;
        const userRole = user?.role;
        const userName = user?.name || user?.email;

        // Check if user is an Agent
        const isAgent = userRole === 'Agent' || (typeof userRole === 'object' && userRole?.name === 'Agent');

        const where: any = {};
        // Filter by organizationId if user has one (not super_admin)
        // Super Admin (organizationId = null) sees all calls
        if (organizationId !== null && organizationId !== undefined) {
            where.organizationId = organizationId;
        }

        // For Agents: filter by their name (agentName field in Call model)
        if (isAgent && userName) {
            where.agentName = userName;
        }

        const [calls, total] = await Promise.all([
            db.call.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                include: { analysis: true },
                skip,
                take: limit
            }),
            db.call.count({ where })
        ]);

        res.json({
            calls: calls.map((c: any) => withRecordingPlaybackUrl(c)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch calls' });
    }
});

router.get('/:id/pdf', authenticateJWT, async (req, res) => {
    try {
        const pdfPath = path.join(process.cwd(), 'reports', `analysis-${req.params.id}.pdf`);
        if (fs.existsSync(pdfPath)) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=analysis-${req.params.id}.pdf`);
            fs.createReadStream(pdfPath).pipe(res);
        } else {
            const call = await db.call.findUnique({
                where: { id: parseInt(req.params.id) },
                include: { analysis: true }
            });
            if (!call) return res.status(404).json({ error: 'Call not found' });

            const pdfBuffer = await generateCallPDF(call);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=analysis-${req.params.id}.pdf`);
            res.send(pdfBuffer);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate/retrieve PDF' });
    }
});

/**
 * Serve recording file from uploads folder (direct upload, no S3).
 * GET /api/analysis/:id/recording
 */
router.get('/:id/recording', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const user = (req as any).user;
        const organizationId = user?.organizationId;

        const call = await db.call.findUnique({
            where: { id: parseInt(req.params.id) },
            select: { id: true, recordingUrl: true, organizationId: true }
        });

        if (!call || !call.recordingUrl) return res.status(404).json({ error: 'Recording not found' });
        if (organizationId != null && call.organizationId !== organizationId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Only serve local paths (no S3/external URLs)
        if (call.recordingUrl.startsWith('http://') || call.recordingUrl.startsWith('https://')) {
            return res.status(404).json({ error: 'Recording is stored externally; use the provided URL' });
        }

        // Always resolve to absolute path: DB may store "uploads/hash" or just "filename" — never open by raw recordingUrl.
        const safeBasename = path.basename(call.recordingUrl);
        const resolvedPath = path.resolve(UPLOAD_DIR, safeBasename);
        const uploadDirResolved = path.resolve(UPLOAD_DIR);
        if (!resolvedPath.startsWith(uploadDirResolved) || resolvedPath === uploadDirResolved) {
            return res.status(403).json({ error: 'Invalid recording path' });
        }
        if (!fs.existsSync(resolvedPath)) {
            return res.status(404).json({ error: 'Recording file not found' });
        }

        const ext = path.extname(resolvedPath).toLowerCase();
        const contentType = ext === '.mp3' ? 'audio/mpeg' : ext === '.wav' ? 'audio/wav' : 'audio/mpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline');
        fs.createReadStream(resolvedPath).pipe(res);
    } catch (error) {
        res.status(500).json({ error: 'Failed to serve recording' });
    }
});

router.get('/:id', authenticateJWT, filterByOrganization, async (req, res) => {
    try {
        const user = (req as any).user;
        const organizationId = user?.organizationId;

        const call = await db.call.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { analysis: true }
        });

        if (!call) return res.status(404).json({ error: 'Call not found' });

        // Check if call belongs to user's organization (if not super_admin)
        if (organizationId !== null && organizationId !== undefined && call.organizationId !== organizationId) {
            return res.status(403).json({ error: 'Forbidden', message: 'You do not have access to this call' });
        }

        const out = withRecordingPlaybackUrl({
            ...call,
            customerPhone: decryptPhoneMaybe((call as any).customerPhone),
        });
        res.json(out);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch call details' });
    }
});


export default router;
