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
    return SUPPORTED_IMAGE_TYPES.includes(fileType as any);
}

export function isDocumentFile(fileType: string): boolean {
    return SUPPORTED_DOCUMENT_TYPES.includes(fileType as any);
}

export function isSupportedFile(fileType: string): boolean {
    return ALL_SUPPORTED_TYPES.includes(fileType as any);
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

export function generateS3Key(workspaceId: string, ticketId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `tickets/workspace/${workspaceId}/${ticketId}/${timestamp}_${sanitizedFilename}`;
} 