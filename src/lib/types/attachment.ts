export interface Attachment {
    id: string;
    filename: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    s3Key: string;
    uploadedBy: string;
    uploadedAt: string;
    isImage: boolean;
    url?: string; // Signed URL for access
}

export interface AttachmentUploadProgress {
    id: string;
    filename: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
}

// Supported file types
export const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
] as const;

export const SUPPORTED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv'
] as const;

export const ALL_SUPPORTED_TYPES = [
    ...SUPPORTED_IMAGE_TYPES,
    ...SUPPORTED_DOCUMENT_TYPES
] as const;

// File size limits (in bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Validation functions
export function isImageFile(fileType: string): boolean {
    return SUPPORTED_IMAGE_TYPES.includes(fileType as typeof SUPPORTED_IMAGE_TYPES[number]);
}

export function isDocumentFile(fileType: string): boolean {
    return SUPPORTED_DOCUMENT_TYPES.includes(fileType as typeof SUPPORTED_DOCUMENT_TYPES[number]);
}

export function isSupportedFile(fileType: string): boolean {
    return ALL_SUPPORTED_TYPES.includes(fileType as typeof ALL_SUPPORTED_TYPES[number]);
}

export function validateFileSize(fileSize: number, isImage: boolean = false): boolean {
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
    return fileSize <= maxSize;
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function generateAttachmentId(): string {
    return `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate S3 key for ticket attachments
 */
export function generateS3Key(workspaceId: string, ticketId: string, filename: string): string {
    // Sanitize filename for S3
    const sanitizedFilename = sanitizeForS3(filename);
    return `tickets/workspace/${workspaceId}/${ticketId}/${Date.now()}_${sanitizedFilename}`;
}

/**
 * Generate S3 key for kiosk attachments (location photos)
 */
export function generateKioskS3Key(workspaceId: string, kioskId: string, filename: string): string {
    // Sanitize filename for S3
    const sanitizedFilename = sanitizeForS3(filename);
    return `kiosks/workspace/${workspaceId}/${kioskId}/${Date.now()}_${sanitizedFilename}`;
}

/**
 * Sanitize string for S3 key (more restrictive)
 */
export function sanitizeForS3(input: string): string {
    return input
        .normalize('NFD') // Decompose Unicode characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace non-ASCII with underscore
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

/**
 * Sanitize string for HTTP headers (ISO-8859-1 compatible)
 */
export function sanitizeForHeaders(input: string): string {
    return input
        .normalize('NFD') // Decompose Unicode characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^\x00-\xFF]/g, '?') // Replace non-ISO-8859-1 with ?
        .substring(0, 255); // Limit length for header values
} 