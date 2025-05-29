import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { inviteUser } from '../functions/invite-user/resource';

/**
 * Kiosk Maintenance Helpdesk Data Schema
 * 
 * This schema defines the data models for our multi-tenant helpdesk system:
 * - Users: System users with Cognito integration
 * - Workspaces: Client-specific workspaces for data isolation  
 * - WorkspaceUser: Junction table for user-workspace relationships with roles
 * - Kiosks: Physical kiosks that require maintenance
 * - Tickets: Maintenance tickets linked to kiosks
 */
const schema = a.schema({
    // Custom query for user invitation (testing purposes)
    inviteUser: a
        .query()
        .arguments({
            email: a.string().required(),
            username: a.string().required(),
            preferredUsername: a.string().required(),
            givenName: a.string().required(),
            familyName: a.string().required(),
            workspaceId: a.string().required(),
            role: a.enum(['ADMIN', 'MEMBER', 'VIEWER']),
            temporaryPassword: a.string(),
            sendInviteEmail: a.boolean(),
        })
        .returns(a.json())
        .authorization((allow) => [
            allow.publicApiKey(), // For testing purposes
        ])
        .handler(a.handler.function(inviteUser)),

    // User model for extended user data beyond Cognito
    User: a
        .model({
            userId: a.id().required(),
            email: a.email().required(),
            username: a.string().required(),
            name: a.string().required(),
            cognitoId: a.string().required(),
            createdAt: a.datetime(),
            updatedAt: a.datetime(),
            // Relationships
            workspaces: a.hasMany("WorkspaceUser", "userId"),
            reportedTickets: a.hasMany("Ticket", "reporterId"),
            assignedTickets: a.hasMany("Ticket", "assigneeId"),
        })
        .authorization((allow) => [
            allow.authenticated(),
            allow.publicApiKey(), // For testing purposes
        ]),

    // Workspace model for client separation
    Workspace: a
        .model({
            workspaceId: a.id().required(),
            name: a.string().required(),
            description: a.string(),
            createdBy: a.string().required(),
            createdAt: a.datetime(),
            updatedAt: a.datetime(),
            // Relationships
            users: a.hasMany("WorkspaceUser", "workspaceId"),
            kiosks: a.hasMany("Kiosk", "workspaceId"),
            tickets: a.hasMany("Ticket", "workspaceId"),
        })
        .authorization((allow) => [
            allow.authenticated(),
            allow.publicApiKey(), // For testing purposes
        ]),

    // Junction table for user-workspace relationships with roles
    WorkspaceUser: a
        .model({
            workspaceId: a.id().required(),
            userId: a.id().required(),
            role: a.enum(["ADMIN", "MEMBER", "VIEWER"]),
            joinedAt: a.datetime(),
            // Relationships
            workspace: a.belongsTo("Workspace", "workspaceId"),
            user: a.belongsTo("User", "userId"),
        })
        .authorization((allow) => [
            allow.authenticated(),
            allow.publicApiKey(), // For testing purposes
        ]),

    // Kiosk model for physical devices requiring maintenance
    Kiosk: a
        .model({
            kioskId: a.id().required(),
            workspaceId: a.id().required(),
            address: a.string().required(),
            locationDescription: a.string(),
            description: a.string(),
            remark: a.string(),
            status: a.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "RETIRED"]),
            locationAttachments: a.string().array(),
            createdAt: a.datetime(),
            updatedAt: a.datetime(),
            // Relationships
            workspace: a.belongsTo("Workspace", "workspaceId"),
            tickets: a.hasMany("Ticket", "kioskId"),
        })
        .authorization((allow) => [
            allow.authenticated(),
            allow.publicApiKey(), // For testing purposes
        ]),

    // Ticket model for maintenance records
    Ticket: a
        .model({
            ticketId: a.id().required(),
            workspaceId: a.id().required(),
            kioskId: a.id().required(),
            reporterId: a.id().required(),
            assigneeId: a.id(),
            status: a.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
            title: a.string().required(),
            description: a.string().required(),
            comments: a.json().array(),
            attachments: a.string().array(),
            reportedDate: a.datetime().required(),
            updatedDate: a.datetime(),
            maintenanceTime: a.datetime(),
            // Relationships
            workspace: a.belongsTo("Workspace", "workspaceId"),
            kiosk: a.belongsTo("Kiosk", "kioskId"),
            reporter: a.belongsTo("User", "reporterId"),
            assignee: a.belongsTo("User", "assigneeId"),
        })
        .authorization((allow) => [
            allow.authenticated(),
            allow.publicApiKey(), // For testing purposes
        ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'apiKey',
        apiKeyAuthorizationMode: {
            expiresInDays: 30,
        },
    },
});

/*
Example usage with the generateClient:

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

// List all kiosks for a workspace
const { data: kiosks, errors } = await client.models.Kiosk.list({
  filter: {
    workspaceId: { eq: 'workspace-id' }
  }
});

// Find users by username for ticket assignment
const { data: users, errors } = await client.models.User.list({
  filter: {
    username: { contains: 'john' }
  }
});

// Create a new ticket
const { data: newTicket, errors } = await client.models.Ticket.create({
  workspaceId: 'workspace-id',
  kioskId: 'kiosk-id',
  reporterId: 'user-id',
  title: 'Maintenance Required',
  description: 'Screen not responding',
  status: 'OPEN',
  reportedDate: new Date().toISOString(),
});

// Get workspace users for assignment dropdown
const { data: workspaceUsers, errors } = await client.models.WorkspaceUser.list({
  filter: { workspaceId: { eq: 'workspace-id' } }
});

// Real-time subscription to workspace tickets
const subscription = client.models.Ticket.observeQuery({
  filter: { workspaceId: { eq: 'workspace-id' } }
}).subscribe({
  next: ({ items, isSynced }) => {
    console.log('Tickets updated:', items);
  },
});
*/
