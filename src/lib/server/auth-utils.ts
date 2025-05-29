import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';

export interface ServerUser {
    id: string;
    email: string;
    username: string;
    name: string;
    cognitoId: string;
}

/**
 * Get current authenticated user for server components
 * Uses Amplify server-side authentication
 * Throws error if user is not authenticated
 */
export async function getServerUser(): Promise<ServerUser> {
    try {
        // Get current user using Amplify server utilities
        const cognitoUser = await AuthGetCurrentUserServer();

        if (!cognitoUser || !cognitoUser.userId) {
            throw new Error('No authenticated user found');
        }

        // Get user details from database using Cognito user ID
        const { data: dbUsers, errors } = await cookiesClient.models.User.list({
            filter: {
                cognitoId: { eq: cognitoUser.userId }
            }
        });

        if (errors || !dbUsers || dbUsers.length === 0) {
            throw new Error('User not found in database');
        }

        const dbUser = dbUsers[0];

        return {
            id: dbUser.userId,
            email: dbUser.email,
            username: dbUser.username,
            name: dbUser.name,
            cognitoId: dbUser.cognitoId
        };
    } catch (error) {
        console.error('Server auth error:', error);
        throw new Error('Authentication required');
    }
}

/**
 * Check if user is authenticated (returns null if not)
 */
export async function getServerUserOrNull(): Promise<ServerUser | null> {
    try {
        return await getServerUser();
    } catch {
        return null;
    }
}

/**
 * Simple authentication check for server components
 * Returns true if user appears to be authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    try {
        const user = await AuthGetCurrentUserServer();
        return !!user;
    } catch {
        return false;
    }
} 