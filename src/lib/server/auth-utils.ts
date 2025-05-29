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
            console.warn('Server auth: User found in Cognito but not in database:', cognitoUser.userId);
            // Instead of throwing, return a temporary user object
            // This helps with new invited users who might not be synced yet
            return {
                id: cognitoUser.userId,
                email: cognitoUser.signInDetails?.loginId || '',
                username: cognitoUser.signInDetails?.loginId || '',
                name: 'User',
                cognitoId: cognitoUser.userId
            };
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
 * Get current authenticated user for server components (nullable version)
 * Returns null instead of throwing error for better SSR compatibility
 */
export async function getServerUserOrNull(): Promise<ServerUser | null> {
    try {
        return await getServerUser();
    } catch (error) {
        console.log('Server auth: No authenticated user found:', error instanceof Error ? error.message : error);
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

/**
 * Get basic authentication session for server components
 * Returns minimal session info to reduce database calls
 */
export async function getServerAuthSession() {
    try {
        const user = await AuthGetCurrentUserServer();
        return {
            isAuthenticated: !!user,
            userId: user?.userId || null,
            userEmail: user?.signInDetails?.loginId || null
        };
    } catch (error) {
        console.log('Server session check failed:', error);
        return {
            isAuthenticated: false,
            userId: null,
            userEmail: null
        };
    }
} 