import { getServerUser } from './auth-utils';
import { cookiesClient, type Schema } from '@/utils/amplify-utils';

type WorkspaceUserType = Schema['WorkspaceUser']['type'];
type WorkspaceRole = 'ADMIN' | 'MEMBER' | 'VIEWER';

// Define the selected workspace fields
const workspaceSelectionSet = [
    'id',
    'workspaceId', 
    'name',
    'description',
    'createdBy',
    'createdAt',
    'updatedAt'
] as const;

// Type for workspace data with only selected fields
export type SelectedWorkspace = {
    id: string;
    workspaceId: string;
    name: string;
    description: string | null;
    createdBy: string;
    createdAt: string | null;
    updatedAt: string | null;
};

export interface WorkspaceAccess {
    workspace: SelectedWorkspace;
    userRole: WorkspaceRole;
    userWorkspace: WorkspaceUserType;
}

/**
 * Get workspace access for current user
 * Validates user has access to the specified workspace
 * Throws error if no access
 */
export async function getWorkspaceAccess(workspaceId: string): Promise<WorkspaceAccess> {
    const user = await getServerUser();

    // Find user's workspace relationship
    const { data: workspaceUsers, errors: userErrors } = await cookiesClient.models.WorkspaceUser.list({
        filter: {
            userId: { eq: user.id },
            workspaceId: { eq: workspaceId }
        }
    });

    if (userErrors || !workspaceUsers?.length) {
        throw new Error(`Access denied to workspace: ${workspaceId}`);
    }

    const userWorkspace = workspaceUsers[0];

    if (!userWorkspace.role) {
        throw new Error('Invalid workspace role');
    }

    // Get workspace details with custom selection set
    const { data: workspace, errors: workspaceErrors } = await cookiesClient.models.Workspace.get(
        { id: workspaceId },
        { 
            selectionSet: workspaceSelectionSet
        }
    );

    if (workspaceErrors || !workspace) {
        // Try alternative lookup by workspaceId field
        const { data: workspaces, errors: listErrors } = await cookiesClient.models.Workspace.list(
            {
                filter: { workspaceId: { eq: workspaceId } },
                selectionSet: workspaceSelectionSet
            },
        );

        if (listErrors || !workspaces?.length) {
            throw new Error(`Workspace not found: ${workspaceId}`);
        }

        return {
            workspace: workspaces[0] as SelectedWorkspace,
            userRole: userWorkspace.role as WorkspaceRole,
            userWorkspace
        };
    }

    return {
        workspace: workspace as SelectedWorkspace,
        userRole: userWorkspace.role as WorkspaceRole,
        userWorkspace
    };
}

/**
 * Get all workspaces for current user
 */
export async function getUserWorkspaces(): Promise<Array<{
    workspace: SelectedWorkspace;
    role: WorkspaceRole;
    joinedAt: string;
}>> {
    const user = await getServerUser();

    // Get all user's workspace relationships
    const { data: workspaceUsers, errors } = await cookiesClient.models.WorkspaceUser.list({
        filter: {
            userId: { eq: user.id }
        }
    });

    if (errors || !workspaceUsers) {
        return [];
    }

    // Get workspace details for each relationship
    const workspacesWithDetails = await Promise.all(
        workspaceUsers
            .filter(wu => wu.role && wu.joinedAt)
            .map(async (wu) => {
                // Try to get workspace by id first
                let workspace = null;

                try {
                    const { data } = await cookiesClient.models.Workspace.get(
                        { id: wu.workspaceId },
                        { selectionSet: workspaceSelectionSet }
                    );
                    workspace = data;
                } catch {
                    // If that fails, try by workspaceId field
                    const { data: workspaces } = await cookiesClient.models.Workspace.list({
                        filter: { workspaceId: { eq: wu.workspaceId } },
                        selectionSet: workspaceSelectionSet
                    });
                    workspace = workspaces?.[0] || null;
                }

                if (!workspace) return null;

                return {
                    workspace: workspace as SelectedWorkspace,
                    role: wu.role as WorkspaceRole,
                    joinedAt: wu.joinedAt!
                };
            })
    );

    return workspacesWithDetails.filter(Boolean) as Array<{
        workspace: SelectedWorkspace;
        role: WorkspaceRole;
        joinedAt: string;
    }>;
}

/**
 * Check if user has permission for specific action
 */
export function hasPermission(userRole: WorkspaceRole, requiredLevel: 'ADMIN' | 'MEMBER' | 'VIEWER'): boolean {
    const hierarchy = {
        'ADMIN': 3,
        'MEMBER': 2,
        'VIEWER': 1
    };

    return hierarchy[userRole] >= hierarchy[requiredLevel];
}

/**
 * Validate workspace access or throw error
 */
export async function validateWorkspaceAccess(
    workspaceId: string,
    requiredRole: WorkspaceRole = 'VIEWER'
): Promise<WorkspaceAccess> {
    const access = await getWorkspaceAccess(workspaceId);

    if (!hasPermission(access.userRole, requiredRole)) {
        throw new Error(`Insufficient permissions. Required: ${requiredRole}, Current: ${access.userRole}`);
    }

    return access;
}

/**
 * Create a new workspace and add the creator as an ADMIN
 */
export async function createWorkspace(workspaceData: {
    name: string;
    description?: string;
}): Promise<SelectedWorkspace> {
    const user = await getServerUser();

    // Validate input
    if (!workspaceData.name?.trim()) {
        throw new Error('Workspace name is required');
    }

    if (workspaceData.name.trim().length > 100) {
        throw new Error('Workspace name must be 100 characters or less');
    }

    if (workspaceData.description && workspaceData.description.length > 500) {
        throw new Error('Workspace description must be 500 characters or less');
    }

    // Generate unique workspace ID
    const workspaceId = `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    try {
        // Create workspace
        const { data: workspace, errors: workspaceErrors } = await cookiesClient.models.Workspace.create({
            workspaceId,
            name: workspaceData.name.trim(),
            description: workspaceData.description?.trim() || null,
            createdBy: user.id,
            createdAt: now,
            updatedAt: now
        });

        if (workspaceErrors || !workspace) {
            throw new Error(`Failed to create workspace: ${workspaceErrors?.map(e => e.message).join(', ') || 'Unknown error'}`);
        }

        // Add creator as ADMIN
        const { data: workspaceUser, errors: userErrors } = await cookiesClient.models.WorkspaceUser.create({
            userId: user.id,
            workspaceId: workspace.id,
            role: 'ADMIN',
            joinedAt: now
        });

        if (userErrors || !workspaceUser) {
            // If adding user fails, we should ideally clean up the workspace
            // For now, log the error but don't fail the entire operation
            console.error('Failed to add creator as admin to workspace:', userErrors);
        }

        return {
            id: workspace.id,
            workspaceId: workspace.workspaceId,
            name: workspace.name,
            description: workspace.description,
            createdBy: workspace.createdBy,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt
        } as SelectedWorkspace;

    } catch (error) {
        console.error('Error creating workspace:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create workspace');
    }
} 