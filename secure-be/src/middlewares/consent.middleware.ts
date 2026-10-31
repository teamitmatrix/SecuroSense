// backend/src/middlewares/consent.middleware.ts
// MiFID II Article 16(7) - Recording Consent Validation
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware to validate recording consent before processing calls.
 * Required for MiFID II Article 16(7) compliance.
 * 
 * Expects in request body:
 * - consentObtained: boolean (required, must be true)
 * - consentMethod: string (optional, defaults to 'electronic')
 */
export const requireConsent = (req: Request, res: Response, next: NextFunction) => {
    const { consentObtained, consentMethod } = req.body;
    
    // Check if consent was explicitly provided
    if (consentObtained !== true && consentObtained !== 'true') {
        logger.warn('Recording consent not obtained', {
            ip: req.ip,
            path: req.path,
            consentObtained
        });
        
        return res.status(400).json({
            error: 'Consent Required',
            message: 'Recording consent must be obtained before processing. This is required for MiFID II Article 16(7) compliance.',
            code: 'CONSENT_REQUIRED',
            details: {
                requirement: 'Set consentObtained=true in the request body',
                regulation: 'MiFID II Article 16(7)',
                acceptedMethods: ['verbal', 'written', 'electronic']
            }
        });
    }
    
    // Validate consent method if provided
    const validMethods = ['verbal', 'written', 'electronic'];
    if (consentMethod && !validMethods.includes(consentMethod)) {
        return res.status(400).json({
            error: 'Invalid Consent Method',
            message: `Consent method must be one of: ${validMethods.join(', ')}`,
            code: 'INVALID_CONSENT_METHOD'
        });
    }
    
    // Add consent data to request for downstream use
    (req as any).consent = {
        obtained: true,
        timestamp: new Date(),
        method: consentMethod || 'electronic'
    };
    
    next();
};

/**
 * Optional middleware for routes where consent is recommended but not required.
 * Logs a warning if consent is not provided.
 */
export const warnIfNoConsent = (req: Request, res: Response, next: NextFunction) => {
    // Safely check req.body - it may not be parsed yet for multipart/form-data
    // Multer should populate req.body, but handle cases where it might not be ready
    try {
        if (!req.body || typeof req.body !== 'object') {
            return next();
        }
        
        const consentObtained = req.body.consentObtained;
        
        if (consentObtained !== true && consentObtained !== 'true') {
            logger.warn('Processing call without explicit consent confirmation', {
                ip: req.ip,
                path: req.path,
                customerName: req.body?.customerName
            });
        }
    } catch (error) {
        // If anything goes wrong, just continue - this is a warning middleware
        logger.debug('Error in warnIfNoConsent middleware', { error });
    }
    
    next();
};
