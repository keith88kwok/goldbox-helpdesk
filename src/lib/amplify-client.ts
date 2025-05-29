import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

/**
 * Centralized Amplify Data Client for Kiosk Maintenance Helpdesk
 * 
 * This client provides type-safe access to all our data models:
 * - User, Workspace, WorkspaceUser, Kiosk, Ticket
 * 
 * Usage:
 * import { client } from '@/lib/amplify-client';
 * const { data: kiosks } = await client.models.Kiosk.list();
 */
export const client = generateClient<Schema>();

// Re-export the Schema type for convenience
export type { Schema } from '../../amplify/data/resource'; 