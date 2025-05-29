'use server';

import { saveAttachmentToTicket, removeAttachmentFromTicket, saveAttachmentToKiosk, removeAttachmentFromKiosk, getTicketAttachments, getKioskAttachments } from '@/lib/server/attachment-utils';
import type { Attachment } from '@/lib/types/attachment';

/**
 * Server action to save attachment metadata to ticket
 */
export async function saveAttachmentAction(
    ticketId: string,
    attachment: Attachment
): Promise<{ success: boolean; error?: string }> {
    try {
        return await saveAttachmentToTicket(ticketId, attachment);
    } catch (error) {
        console.error('Error in saveAttachmentAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Server action to remove attachment from ticket
 */
export async function removeAttachmentAction(
    ticketId: string,
    attachmentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        return await removeAttachmentFromTicket(ticketId, attachmentId);
    } catch (error) {
        console.error('Error in removeAttachmentAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Server action to fetch fresh ticket attachments
 */
export async function getTicketAttachmentsAction(
    ticketId: string
): Promise<{ success: boolean; attachments?: Attachment[]; error?: string }> {
    try {
        const attachments = await getTicketAttachments(ticketId);
        return {
            success: true,
            attachments
        };
    } catch (error) {
        console.error('Error in getTicketAttachmentsAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Server action to save attachment metadata to kiosk
 */
export async function saveKioskAttachmentAction(
    kioskId: string,
    attachment: Attachment
): Promise<{ success: boolean; error?: string }> {
    try {
        return await saveAttachmentToKiosk(kioskId, attachment);
    } catch (error) {
        console.error('Error in saveKioskAttachmentAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Server action to remove attachment from kiosk
 */
export async function removeKioskAttachmentAction(
    kioskId: string,
    attachmentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        return await removeAttachmentFromKiosk(kioskId, attachmentId);
    } catch (error) {
        console.error('Error in removeKioskAttachmentAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Server action to fetch fresh kiosk attachments
 */
export async function getKioskAttachmentsAction(
    kioskId: string
): Promise<{ success: boolean; attachments?: Attachment[]; error?: string }> {
    try {
        const attachments = await getKioskAttachments(kioskId);
        return {
            success: true,
            attachments
        };
    } catch (error) {
        console.error('Error in getKioskAttachmentsAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
} 