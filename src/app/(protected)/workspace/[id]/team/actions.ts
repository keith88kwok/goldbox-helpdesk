'use server';

import { updateUserRole, removeUserFromWorkspace, getCurrentUserId, getNonWorkspaceUsers } from '@/lib/server/team-utils';
import { revalidatePath } from 'next/cache';

export async function updateUserRoleAction(
    workspaceId: string,
    userId: string,
    newRole: 'ADMIN' | 'MEMBER' | 'VIEWER'
) {
    try {
        const result = await updateUserRole(workspaceId, userId, newRole);
        
        if (result.success) {
            revalidatePath(`/workspace/${workspaceId}/team`);
        }
        
        return result;
    } catch (error) {
        return {
            success: false,
            message: 'Failed to update user role',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function removeUserAction(
    workspaceId: string,
    userId: string
) {
    try {
        const currentUserId = await getCurrentUserId();
        const result = await removeUserFromWorkspace(workspaceId, userId, currentUserId);
        
        if (result.success) {
            revalidatePath(`/workspace/${workspaceId}/team`);
        }
        
        return result;
    } catch (error) {
        return {
            success: false,
            message: 'Failed to remove user from workspace',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function getAvailableUsersAction(workspaceId: string) {
    try {
        const availableUsers = await getNonWorkspaceUsers(workspaceId);
        return {
            success: true,
            users: availableUsers
        };
    } catch (error) {
        return {
            success: false,
            users: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
} 