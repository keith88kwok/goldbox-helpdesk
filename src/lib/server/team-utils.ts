import { getWorkspaceAccess, type SelectedWorkspace } from './workspace-utils';
import { cookiesClient, type Schema } from '@/utils/amplify-utils';
import { client } from '@/lib/amplify-client';

type WorkspaceRole = 'ADMIN' | 'MEMBER' | 'VIEWER';
type WorkspaceUserType = Schema['WorkspaceUser']['type'];

export interface TeamMember {
    id: string;
    userId: string;
    name: string;
    email: string;
    username: string;
    role: WorkspaceRole;
    joinedAt: string;
    lastActivity?: string;
}

export interface TeamManagementData {
    members: TeamMember[];
    workspace: SelectedWorkspace;
    userRole: WorkspaceRole;
    canManageTeam: boolean;
}

export interface AvailableUser {
    id: string;
    userId: string;
    name: string;
    email: string;
    username: string;
}

/**
 * Get detailed team member information for a workspace
 */
export async function getWorkspaceTeamDetails(workspaceId: string): Promise<TeamManagementData> {
    // Validate access to workspace
    const { workspace, userRole } = await getWorkspaceAccess(workspaceId);
    
    // Get workspace users
    const { data: workspaceUsers, errors } = await cookiesClient.models.WorkspaceUser.list({
        filter: {
            workspaceId: { eq: workspaceId }
        }
    });

    if (errors) {
        throw new Error(`Failed to fetch workspace users: ${errors.map(e => e.message).join(', ')}`);
    }

    // Get detailed user information for each workspace user
    const memberPromises = (workspaceUsers || []).map(async (wu): Promise<TeamMember | null> => {
        if (!wu.role || !wu.joinedAt) return null;

        const { data: user } = await cookiesClient.models.User.get({ id: wu.userId });
        
        if (!user) return null;

        return {
            id: wu.id,
            userId: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: wu.role as WorkspaceRole,
            joinedAt: wu.joinedAt,
            lastActivity: undefined // TODO: Implement activity tracking
        };
    });

    const members = (await Promise.all(memberPromises))
        .filter((member): member is TeamMember => member !== null)
        .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

    return {
        members,
        workspace,
        userRole,
        canManageTeam: userRole === 'ADMIN'
    };
}

/**
 * Invite a user to a workspace (wrapper around the GraphQL query)
 */
export async function inviteUserToWorkspace(
    workspaceId: string,
    inviteData: {
        email: string;
        preferredUsername: string;
        givenName: string;
        familyName: string;
        role: WorkspaceRole;
        sendInviteEmail?: boolean;
    }
): Promise<{ success: boolean; message: string; error?: string; isNewUser?: boolean; isExistingWorkspaceMember?: boolean }> {
    // Validate workspace access and ensure user is ADMIN
    const { userRole } = await getWorkspaceAccess(workspaceId);
    
    if (userRole !== 'ADMIN') {
        throw new Error('Only workspace administrators can invite users');
    }

    try {
        // Use email as username for Cognito login, preferredUsername for display
        const username = inviteData.email;
        const preferredUsername = inviteData.preferredUsername;

        // Call the GraphQL mutation
        const { data: result, errors } = await client.queries.inviteUser({
            email: inviteData.email,
            username: username,
            preferredUsername: preferredUsername,
            givenName: inviteData.givenName,
            familyName: inviteData.familyName,
            workspaceId: workspaceId,
            role: inviteData.role,
            sendInviteEmail: inviteData.sendInviteEmail || false,
        });

        if (errors && errors.length > 0) {
            return {
                success: false,
                message: 'Failed to invite user',
                error: errors.map(e => e.message).join(', ')
            };
        }

        if (!result) {
            return {
                success: false,
                message: 'No response from invite function',
                error: 'Unknown error'
            };
        }

        // Parse the JSON response
        const parsedResult = JSON.parse(result as string);
        return parsedResult;

    } catch (error) {
        console.error('Error inviting user to workspace:', error);
        return {
            success: false,
            message: 'Failed to invite user',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Update a user's role in a workspace (ADMIN only)
 */
export async function updateUserRole(
    workspaceId: string,
    targetUserId: string,
    newRole: WorkspaceRole
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        // Validate workspace access and ensure user is ADMIN
        const { userRole } = await getWorkspaceAccess(workspaceId);
        
        if (userRole !== 'ADMIN') {
            throw new Error('Only workspace administrators can update user roles');
        }

        // Find the workspace user relationship
        const { data: workspaceUsers, errors: findErrors } = await cookiesClient.models.WorkspaceUser.list({
            filter: {
                workspaceId: { eq: workspaceId },
                userId: { eq: targetUserId }
            }
        });

        if (findErrors || !workspaceUsers?.length) {
            throw new Error('User not found in workspace');
        }

        const workspaceUser = workspaceUsers[0];

        // Update the role
        const { data: updatedUser, errors: updateErrors } = await cookiesClient.models.WorkspaceUser.update({
            id: workspaceUser.id,
            role: newRole
        });

        if (updateErrors || !updatedUser) {
            throw new Error('Failed to update user role');
        }

        return {
            success: true,
            message: `User role updated to ${newRole} successfully`
        };

    } catch (error) {
        console.error('Error updating user role:', error);
        return {
            success: false,
            message: 'Failed to update user role',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Remove a user from a workspace (ADMIN only)
 */
export async function removeUserFromWorkspace(
    workspaceId: string,
    targetUserId: string,
    currentUserId: string
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        // Validate workspace access and ensure user is ADMIN
        const { userRole } = await getWorkspaceAccess(workspaceId);
        
        if (userRole !== 'ADMIN') {
            throw new Error('Only workspace administrators can remove users');
        }

        // Prevent self-removal
        if (targetUserId === currentUserId) {
            throw new Error('You cannot remove yourself from the workspace');
        }

        // Find the workspace user relationship
        const { data: workspaceUsers, errors: findErrors } = await cookiesClient.models.WorkspaceUser.list({
            filter: {
                workspaceId: { eq: workspaceId },
                userId: { eq: targetUserId }
            }
        });

        if (findErrors || !workspaceUsers?.length) {
            throw new Error('User not found in workspace');
        }

        const workspaceUser = workspaceUsers[0];

        // Get user details for the response message
        const { data: user } = await cookiesClient.models.User.get({ id: targetUserId });
        const userName = user?.name || 'User';

        // Remove the workspace user relationship
        const { errors: deleteErrors } = await cookiesClient.models.WorkspaceUser.delete({
            id: workspaceUser.id
        });

        if (deleteErrors) {
            throw new Error('Failed to remove user from workspace');
        }

        return {
            success: true,
            message: `${userName} has been removed from the workspace`
        };

    } catch (error) {
        console.error('Error removing user from workspace:', error);
        return {
            success: false,
            message: 'Failed to remove user from workspace',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get current user ID for permission checks
 */
export async function getCurrentUserId(): Promise<string> {
    const { data: currentUser } = await cookiesClient.models.User.list({ limit: 1 });
    if (!currentUser?.length) {
        throw new Error('Current user not found');
    }
    return currentUser[0].id;
}

/**
 * Get users who are not members of the specified workspace
 * Useful for showing available users to invite
 */
export async function getNonWorkspaceUsers(workspaceId: string): Promise<AvailableUser[]> {
    try {
        // Validate workspace access and ensure user is ADMIN
        const { userRole } = await getWorkspaceAccess(workspaceId);
        
        if (userRole !== 'ADMIN') {
            throw new Error('Only workspace administrators can view available users');
        }

        // Get all users in the system
        const { data: allUsers, errors: userErrors } = await cookiesClient.models.User.list();
        
        if (userErrors || !allUsers) {
            throw new Error('Failed to fetch users');
        }

        // Get current workspace members
        const { data: workspaceUsers, errors: workspaceErrors } = await cookiesClient.models.WorkspaceUser.list({
            filter: {
                workspaceId: { eq: workspaceId }
            }
        });

        if (workspaceErrors) {
            throw new Error('Failed to fetch workspace members');
        }

        // Create a set of user IDs who are already members
        const memberUserIds = new Set(
            (workspaceUsers || []).map(wu => wu.userId)
        );

        // Filter out users who are already members
        const availableUsers = allUsers
            .filter(user => !memberUserIds.has(user.userId))
            .map(user => ({
                id: user.id,
                userId: user.userId,
                name: user.name,
                email: user.email,
                username: user.username
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return availableUsers;

    } catch (error) {
        console.error('Error fetching non-workspace users:', error);
        throw error;
    }
} 