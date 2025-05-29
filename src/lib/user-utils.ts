import { client, type Schema } from './amplify-client';

type User = Schema['User']['type'];

/**
 * User management utilities for the helpdesk system
 * Leverages username for easier user identification
 */

/**
 * Search users by username - useful for ticket assignment
 */
export async function searchUsersByUsername(searchTerm: string) {
    const { data: users, errors } = await client.models.User.list({
        filter: {
            username: { contains: searchTerm.toLowerCase() }
        }
    });

    if (errors) {
        console.error('Error searching users:', errors);
        return [];
    }

    return users || [];
}

/**
 * Get users in a specific workspace - useful for assignment dropdowns
 */
export async function getWorkspaceMembers(workspaceId: string) {
    const { data: workspaceUsers, errors } = await client.models.WorkspaceUser.list({
        filter: { workspaceId: { eq: workspaceId } }
    });

    if (errors) {
        console.error('Error fetching workspace members:', errors);
        return [];
    }

    return workspaceUsers || [];
}

/**
 * Format user display name for UI
 */
export function formatUserDisplayName(user: User) {
    return `${user.name} (@${user.username})`;
}

/**
 * Create or update user profile after Cognito registration
 */
export async function createUserProfile(cognitoUser: {
    id: string;
    email: string;
    username: string;
    given_name: string;
    family_name: string;
}) {
    const fullName = `${cognitoUser.given_name} ${cognitoUser.family_name}`;

    const { data: user, errors } = await client.models.User.create({
        userId: cognitoUser.id,
        cognitoId: cognitoUser.id,
        email: cognitoUser.email,
        username: cognitoUser.username,
        name: fullName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    if (errors) {
        console.error('Error creating user profile:', errors);
        throw new Error('Failed to create user profile');
    }

    return user;
} 