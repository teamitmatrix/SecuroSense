// backend/src/utils/encryption.ts
import crypto from 'crypto';
import logger from './logger';

const algorithm = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    logger.warn('ENCRYPTION_KEY not set. Encryption will use a default key (NOT SECURE FOR PRODUCTION)');
}

/**
 * Get encryption key from environment variable
 * Key must be 32 bytes (64 hex characters) for AES-256
 */
const getEncryptionKey = (): Buffer => {
    if (ENCRYPTION_KEY) {
        // If key is provided as hex string, convert it
        if (ENCRYPTION_KEY.length === 64) {
            return Buffer.from(ENCRYPTION_KEY, 'hex');
        }
        // Otherwise, derive key from string using SHA-256
        return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    }
    // Default key for development (NOT SECURE - MUST BE SET IN PRODUCTION)
    logger.warn('Using default encryption key. Set ENCRYPTION_KEY environment variable for production.');
    return crypto.createHash('sha256').update('default-securosense-key-change-in-production').digest();
};

/**
 * Encrypt a field value using AES-256-GCM
 * @param text Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData (all base64)
 */
export const encryptField = (text: string): string => {
    if (!text) return text;
    
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        const authTag = cipher.getAuthTag();
        
        // Return format: iv:authTag:encryptedData (all base64)
        return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    } catch (error) {
        logger.error('Encryption failed', { error });
        throw new Error('Failed to encrypt field');
    }
};

/**
 * Decrypt a field value using AES-256-GCM
 * @param encryptedText Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export const decryptField = (encryptedText: string): string => {
    if (!encryptedText) return encryptedText;
    
    // Check if already decrypted (not in encrypted format)
    if (!encryptedText.includes(':')) {
        return encryptedText;
    }
    
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            logger.warn('Invalid encrypted format, returning as-is', { encryptedText });
            return encryptedText;
        }
        
        const [ivBase64, authTagBase64, encrypted] = parts;
        const key = getEncryptionKey();
        const iv = Buffer.from(ivBase64, 'base64');
        const authTag = Buffer.from(authTagBase64, 'base64');
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        logger.error('Decryption failed', { error });
        // Return original if decryption fails (might be plain text)
        return encryptedText;
    }
};

/**
 * Check if a string is encrypted
 */
export const isEncrypted = (text: string): boolean => {
    if (!text) return false;
    return text.includes(':') && text.split(':').length === 3;
};

