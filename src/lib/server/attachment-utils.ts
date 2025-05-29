import { uploadData, remove } from 'aws-amplify/storage';
import { getUrl } from 'aws-amplify/storage/server';
import { cookiesClient, runWithAmplifyServerContext } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';
import type { Attachment } from '@/lib/types/attachment';
import {
    generateAttachmentId,
    generateS3Key,
    isImageFile,
    isSupportedFile,
    validateFileSize
} from '@/lib/types/attachment';

interface UploadFileParams {
    file: File;
    workspaceId: string;
    ticketId: string;
    uploadedBy: string;
}

interface AttachmentResult {
    success: boolean;
    attachment?: Attachment;
    error?: string;
}

/**
 * Upload a file to S3 and create attachment metadata
 */
export async function uploadAttachment(params: UploadFileParams): Promise<AttachmentResult> {
    const { file, workspaceId, ticketId, uploadedBy } = params;

    try {
        // Validate file type
        if (!isSupportedFile(file.type)) {
            return {
                success: false,
                error: `Unsupported file type: ${file.type}`
            };
        }

        // Validate file size
        const isImage = isImageFile(file.type);
        if (!validateFileSize(file.size, isImage)) {
            const maxSize = isImage ? '5MB' : '10MB';
            return {
                success: false,
                error: `File size exceeds maximum allowed size of ${maxSize}`
            };
        }

        // Generate attachment metadata
        const attachmentId = generateAttachmentId();
        const s3Key = generateS3Key(workspaceId, ticketId, file.name);

        const attachment: Attachment = {
            id: attachmentId,
            filename: s3Key.split('/').pop() || file.name,
            originalName: file.name,
            fileType: file.type,
            fileSize: file.size,
            s3Key,
            uploadedBy,
            uploadedAt: new Date().toISOString(),
            isImage
        };

        // Upload file to S3
        const uploadResult = await uploadData({
            key: s3Key,
            data: file,
            options: {
                contentType: file.type,
                metadata: {
                    originalName: file.name,
                    uploadedBy,
                    ticketId,
                    workspaceId
                }
            }
        }).result;

        if (!uploadResult.key) {
            return {
                success: false,
                error: 'Failed to upload file to storage'
            };
        }

        return {
            success: true,
            attachment
        };

    } catch (error) {
        console.error('Error uploading attachment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown upload error'
        };
    }
}

/**
 * Save attachment metadata to ticket (server action)
 */
export async function saveAttachmentToTicket(
    ticketId: string,
    attachment: Attachment
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get current ticket
        const { data: ticket, errors } = await cookiesClient.models.Ticket.get({ id: ticketId });

        if (errors || !ticket) {
            return {
                success: false,
                error: 'Ticket not found'
            };
        }

        // Parse existing attachments
        let currentAttachments: Attachment[] = [];
        if (ticket.attachments && ticket.attachments.length > 0) {
            try {
                currentAttachments = ticket.attachments
                    .filter((att: string | null) => att !== null)
                    .map((att: string) => JSON.parse(att));
            } catch (parseError) {
                console.warn('Error parsing existing attachments:', parseError);
                currentAttachments = [];
            }
        }

        // Add new attachment
        currentAttachments.push(attachment);

        // Update ticket with new attachments
        const { errors: updateErrors } = await cookiesClient.models.Ticket.update({
            id: ticketId,
            attachments: currentAttachments.map(att => JSON.stringify(att))
        });

        if (updateErrors) {
            return {
                success: false,
                error: 'Failed to update ticket with attachment'
            };
        }

        return { success: true };

    } catch (error) {
        console.error('Error saving attachment to ticket:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get signed URL for file access
 */
export async function getAttachmentUrl(s3Key: string): Promise<string | null> {
    try {
        const urlResult = await runWithAmplifyServerContext({
            nextServerContext: { cookies },
            operation: (contextSpec: Parameters<typeof getUrl>[0]) => getUrl(contextSpec, {
                key: s3Key,
                options: {
                    expiresIn: 3600 // 1 hour
                }
            })
        });

        return urlResult.url.toString();
    } catch (error) {
        console.error('Error getting attachment URL:', error);
        return null;
    }
}

/**
 * Delete attachment from S3
 */
export async function deleteAttachment(s3Key: string): Promise<boolean> {
    try {
        await remove({ key: s3Key });
        return true;
    } catch (error) {
        console.error('Error deleting attachment:', error);
        return false;
    }
}

/**
 * Add attachment to ticket
 */
export async function addAttachmentToTicket(
    ticketId: string,
    attachment: Attachment
): Promise<{ success: boolean; error?: string }> {
    return saveAttachmentToTicket(ticketId, attachment);
}

/**
 * Remove attachment from ticket
 */
export async function removeAttachmentFromTicket(
    ticketId: string,
    attachmentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get current ticket
        const { data: ticket, errors } = await cookiesClient.models.Ticket.get({ id: ticketId });

        if (errors || !ticket) {
            return {
                success: false,
                error: 'Ticket not found'
            };
        }

        // Parse existing attachments
        let currentAttachments: Attachment[] = [];
        if (ticket.attachments && ticket.attachments.length > 0) {
            try {
                currentAttachments = ticket.attachments
                    .filter((att: string | null) => att !== null)
                    .map((att: string) => JSON.parse(att));
            } catch (parseError) {
                console.warn('Error parsing existing attachments:', parseError);
                return {
                    success: false,
                    error: 'Invalid attachment data format'
                };
            }
        }

        // Find and remove attachment
        const attachmentToRemove = currentAttachments.find(att => att.id === attachmentId);
        if (!attachmentToRemove) {
            return {
                success: false,
                error: 'Attachment not found'
            };
        }

        // Remove from S3
        const deleteSuccess = await deleteAttachment(attachmentToRemove.s3Key);
        if (!deleteSuccess) {
            console.warn('Failed to delete file from S3, but continuing with database update');
        }

        // Remove from array
        const updatedAttachments = currentAttachments.filter(att => att.id !== attachmentId);

        // Update ticket
        const { errors: updateErrors } = await cookiesClient.models.Ticket.update({
            id: ticketId,
            attachments: updatedAttachments.map(att => JSON.stringify(att))
        });

        if (updateErrors) {
            return {
                success: false,
                error: 'Failed to update ticket'
            };
        }

        return { success: true };

    } catch (error) {
        console.error('Error removing attachment from ticket:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get all attachments for a ticket with signed URLs
 */
export async function getTicketAttachments(ticketId: string): Promise<Attachment[]> {
    try {
        const { data: ticket, errors } = await cookiesClient.models.Ticket.get({ id: ticketId });

        if (errors || !ticket || !ticket.attachments) {
            return [];
        }

        // Parse attachments
        const attachments: Attachment[] = [];
        for (const attString of ticket.attachments) {
            if (attString === null) continue;
            
            try {
                const attachmentData = JSON.parse(attString) as Record<string, unknown>;
                const attachment: Attachment = {
                    id: attachmentData.id as string,
                    filename: attachmentData.filename as string,
                    originalName: attachmentData.originalName as string,
                    fileType: attachmentData.fileType as string,
                    fileSize: attachmentData.fileSize as number,
                    s3Key: attachmentData.s3Key as string,
                    uploadedBy: attachmentData.uploadedBy as string,
                    uploadedAt: attachmentData.uploadedAt as string,
                    isImage: attachmentData.isImage as boolean
                };
                
                // Get signed URL
                const url = await getAttachmentUrl(attachment.s3Key);
                if (url) {
                    attachment.url = url;
                    attachments.push(attachment);
                }
            } catch (parseError) {
                console.warn('Error parsing attachment:', parseError);
            }
        }

        return attachments;

    } catch (error) {
        console.error('Error getting ticket attachments:', error);
        return [];
    }
}

/**
 * Save attachment metadata to kiosk (server action)
 */
export async function saveAttachmentToKiosk(
    kioskId: string,
    attachment: Attachment
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get current kiosk
        const { data: kiosk, errors } = await cookiesClient.models.Kiosk.get({ id: kioskId });

        if (errors || !kiosk) {
            return {
                success: false,
                error: 'Kiosk not found'
            };
        }

        // Parse existing attachments
        let currentAttachments: Attachment[] = [];
        if (kiosk.locationAttachments && kiosk.locationAttachments.length > 0) {
            try {
                currentAttachments = kiosk.locationAttachments
                    .filter((att: string | null) => att !== null)
                    .map((att: string) => JSON.parse(att));
            } catch (parseError) {
                console.warn('Error parsing existing kiosk attachments:', parseError);
                currentAttachments = [];
            }
        }

        // Add new attachment
        currentAttachments.push(attachment);

        // Update kiosk with new attachments
        const { errors: updateErrors } = await cookiesClient.models.Kiosk.update({
            id: kioskId,
            locationAttachments: currentAttachments.map(att => JSON.stringify(att))
        });

        if (updateErrors) {
            return {
                success: false,
                error: 'Failed to update kiosk with attachment'
            };
        }

        return { success: true };

    } catch (error) {
        console.error('Error saving attachment to kiosk:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Remove attachment from kiosk
 */
export async function removeAttachmentFromKiosk(
    kioskId: string,
    attachmentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get current kiosk
        const { data: kiosk, errors } = await cookiesClient.models.Kiosk.get({ id: kioskId });

        if (errors || !kiosk) {
            return {
                success: false,
                error: 'Kiosk not found'
            };
        }

        // Parse existing attachments
        let currentAttachments: Attachment[] = [];
        if (kiosk.locationAttachments && kiosk.locationAttachments.length > 0) {
            try {
                currentAttachments = kiosk.locationAttachments
                    .filter((att: string | null) => att !== null)
                    .map((att: string) => JSON.parse(att));
            } catch (parseError) {
                console.warn('Error parsing existing kiosk attachments:', parseError);
                return {
                    success: false,
                    error: 'Invalid attachment data format'
                };
            }
        }

        // Find and remove attachment
        const attachmentToRemove = currentAttachments.find(att => att.id === attachmentId);
        if (!attachmentToRemove) {
            return {
                success: false,
                error: 'Attachment not found'
            };
        }

        // Remove from S3
        const deleteSuccess = await deleteAttachment(attachmentToRemove.s3Key);
        if (!deleteSuccess) {
            console.warn('Failed to delete file from S3, but continuing with database update');
        }

        // Remove from array
        const updatedAttachments = currentAttachments.filter(att => att.id !== attachmentId);

        // Update kiosk
        const { errors: updateErrors } = await cookiesClient.models.Kiosk.update({
            id: kioskId,
            locationAttachments: updatedAttachments.map(att => JSON.stringify(att))
        });

        if (updateErrors) {
            return {
                success: false,
                error: 'Failed to update kiosk'
            };
        }

        return { success: true };

    } catch (error) {
        console.error('Error removing attachment from kiosk:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get all attachments for a kiosk with signed URLs
 */
export async function getKioskAttachments(kioskId: string): Promise<Attachment[]> {
    try {
        const { data: kiosk, errors } = await cookiesClient.models.Kiosk.get({ id: kioskId });

        if (errors || !kiosk || !kiosk.locationAttachments) {
            return [];
        }

        // Parse attachments
        const attachments: Attachment[] = [];
        for (const attString of kiosk.locationAttachments) {
            if (attString === null) continue;
            
            try {
                const attachmentData = JSON.parse(attString) as Record<string, unknown>;
                const attachment: Attachment = {
                    id: attachmentData.id as string,
                    filename: attachmentData.filename as string,
                    originalName: attachmentData.originalName as string,
                    fileType: attachmentData.fileType as string,
                    fileSize: attachmentData.fileSize as number,
                    s3Key: attachmentData.s3Key as string,
                    uploadedBy: attachmentData.uploadedBy as string,
                    uploadedAt: attachmentData.uploadedAt as string,
                    isImage: attachmentData.isImage as boolean
                };
                
                // Get signed URL
                const url = await getAttachmentUrl(attachment.s3Key);
                if (url) {
                    attachment.url = url;
                    attachments.push(attachment);
                }
            } catch (parseError) {
                console.warn('Error parsing kiosk attachment:', parseError);
            }
        }

        return attachments;

    } catch (error) {
        console.error('Error getting kiosk attachments:', error);
        return [];
    }
} 