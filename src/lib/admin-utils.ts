/**
 * Admin utilities for user and workspace management
 * Requires admin role to access these functions
 */

interface InviteUserRequest {
    email: string;
    username: string;
    givenName: string;
    familyName: string;
    workspaceId: string;
    role: 'ADMIN' | 'MEMBER' | 'VIEWER';
    temporaryPassword?: string;
    sendInviteEmail?: boolean;
}

interface InviteUserResponse {
    success: boolean;
    userId?: string;
    message: string;
    error?: string;
}

/**
 * Invite a new user to the system and add them to a workspace
 * This calls the backend invite-user function
 */
export async function inviteUser(request: InviteUserRequest): Promise<InviteUserResponse> {
    try {
        // Note: This will need to be updated with the actual Amplify function URL
        // after deployment. For now, using a placeholder.
        const functionUrl = process.env.NEXT_PUBLIC_INVITE_USER_FUNCTION_URL || '/api/invite-user';

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Note: Add authentication headers here
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: InviteUserResponse = await response.json();
        return result;
    } catch (error) {
        console.error('Error inviting user:', error);
        return {
            success: false,
            message: 'Failed to invite user',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Validate if current user has admin permissions for the workspace
 */
export async function hasAdminPermission(): Promise<boolean> {
    try {
        // This would check the WorkspaceUser relationship
        // Implementation depends on how you store the current user context

        // For now, return true - implement proper permission checking
        return true;
    } catch (error) {
        console.error('Error checking admin permission:', error);
        return false;
    }
}

/**
 * Generate a suggested username from email or name
 */
export function generateSuggestedUsername(email: string, givenName: string, familyName: string): string {
    // Try email prefix first
    const emailPrefix = email.split('@')[0];
    if (emailPrefix && emailPrefix.length >= 3) {
        return emailPrefix.toLowerCase();
    }

    // Fallback to name-based username
    const username = `${givenName.toLowerCase()}.${familyName.toLowerCase()}`;
    return username.replace(/[^a-z0-9.]/g, '');
}

/**
 * Validate username format
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username || username.length < 3) {
        return { isValid: false, error: 'Username must be at least 3 characters' };
    }

    if (username.length > 30) {
        return { isValid: false, error: 'Username must be less than 30 characters' };
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
        return { isValid: false, error: 'Username can only contain letters, numbers, dots, hyphens, and underscores' };
    }

    return { isValid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
} 