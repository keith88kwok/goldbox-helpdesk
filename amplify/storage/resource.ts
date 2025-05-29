import { defineStorage } from '@aws-amplify/backend';

/**
 * S3 Storage configuration for Kiosk Maintenance Helpdesk
 * 
 * Handles file attachments for:
 * - Kiosk location photos and documents
 * - Ticket maintenance attachments
 * 
 * Folder structure: public/tickets/workspace/{workspace-id}/{ticket-id}/*
 */
export const storage = defineStorage({
    name: 'helpdeskStorage',
    access: (allow) => ({
        'public/attachments/*': [
            allow.authenticated.to(['read', 'write', 'delete']),
        ],
        'public/kiosks/*': [
            allow.authenticated.to(['read', 'write', 'delete']),
        ],
        'public/tickets/*': [
            allow.authenticated.to(['read', 'write', 'delete']),
        ],
        'public/*': [
            allow.authenticated.to(['read', 'write', 'delete']),
        ],
    }),
}); 