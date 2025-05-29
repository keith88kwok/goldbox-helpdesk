import { defineStorage } from '@aws-amplify/backend';

/**
 * S3 Storage configuration for Kiosk Maintenance Helpdesk
 * 
 * Handles file attachments for:
 * - Kiosk location photos and documents
 * - Ticket maintenance attachments
 * 
 * Folder structure: attachments/workspace/{workspace-id}/{entity_id}/*
 */
export const storage = defineStorage({
    name: 'helpdeskStorage',
    access: (allow) => ({
        'attachments/workspace/{entity_id}/*': [
            allow.authenticated.to(['read', 'write', 'delete']),
        ],
        'kiosks/workspace/{entity_id}/*': [
            allow.authenticated.to(['read', 'write', 'delete']),
        ],
        'tickets/workspace/{entity_id}/*': [
            allow.authenticated.to(['read', 'write', 'delete']),
        ],
    }),
}); 