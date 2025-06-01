import { getWorkspaceAccess, validateWorkspaceAccess, type SelectedWorkspace } from './workspace-utils';
import { cookiesClient, type Schema } from '@/utils/amplify-utils';

type KioskType = Schema['Kiosk']['type'];
type KioskStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED';

// Type for kiosk data with only safe fields (no functions)
export type SelectedKiosk = {
    id: string;
    kioskId: string;
    workspaceId: string;
    address: string;
    locationDescription: string | null;
    description: string | null;
    remark: string | null;
    status: string | null;
    createdAt: string | null;
    updatedAt: string | null;
};

export interface KioskWithWorkspace {
    kiosk: SelectedKiosk;
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

/**
 * Extract safe kiosk fields for client components
 */
function extractKioskFields(kiosk: KioskType): SelectedKiosk {
    return {
        id: kiosk.id,
        kioskId: kiosk.kioskId,
        workspaceId: kiosk.workspaceId,
        address: kiosk.address,
        locationDescription: kiosk.locationDescription || null,
        description: kiosk.description || null,
        remark: kiosk.remark || null,
        status: kiosk.status || null,
        createdAt: kiosk.createdAt || null,
        updatedAt: kiosk.updatedAt || null
    };
}

/**
 * Get all kiosks for a workspace
 */
export async function getWorkspaceKiosks(workspaceId: string): Promise<{
    kiosks: SelectedKiosk[];
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
}> {
    // Validate access to workspace
    const access = await getWorkspaceAccess(workspaceId);

    // Get all kiosks for this workspace
    const { data: kiosks, errors } = await cookiesClient.models.Kiosk.list({
        filter: {
            workspaceId: { eq: workspaceId }
        }
    });

    if (errors) {
        throw new Error(`Failed to fetch kiosks: ${errors.map(e => e.message).join(', ')}`);
    }

    return {
        kiosks: (kiosks || []).map(extractKioskFields),
        workspace: access.workspace,
        userRole: access.userRole
    };
}

/**
 * Get specific kiosk with access validation
 */
export async function getKioskWithAccess(workspaceId: string, kioskId: string): Promise<KioskWithWorkspace> {
    // Validate access to workspace
    const access = await getWorkspaceAccess(workspaceId);

    // Get the specific kiosk
    const { data: kiosk, errors } = await cookiesClient.models.Kiosk.get({ id: kioskId });

    if (errors || !kiosk) {
        throw new Error(`Kiosk not found: ${kioskId}`);
    }

    // Verify kiosk belongs to the workspace
    if (kiosk.workspaceId !== workspaceId) {
        throw new Error(`Kiosk ${kioskId} does not belong to workspace ${workspaceId}`);
    }

    return {
        kiosk: extractKioskFields(kiosk),
        workspace: access.workspace,
        userRole: access.userRole
    };
}

/**
 * Get specific kiosk by ID (for use in components that already have access)
 */
export async function getKioskById(workspaceId: string, kioskId: string): Promise<SelectedKiosk> {
    // Validate access to workspace
    await validateWorkspaceAccess(workspaceId, 'VIEWER');

    // Get the specific kiosk
    const { data: kiosk, errors } = await cookiesClient.models.Kiosk.get({ id: kioskId });

    if (errors || !kiosk) {
        throw new Error(`Kiosk not found: ${kioskId}`);
    }

    // Verify kiosk belongs to the workspace
    if (kiosk.workspaceId !== workspaceId) {
        throw new Error(`Kiosk ${kioskId} does not belong to workspace ${workspaceId}`);
    }

    return extractKioskFields(kiosk);
}

/**
 * Create a new kiosk (requires MEMBER or ADMIN role)
 */
export async function createKiosk(
    workspaceId: string,
    kioskData: {
        address: string;
        locationDescription?: string;
        description?: string;
        remark?: string;
        status?: KioskStatus;
    }
): Promise<KioskType> {
    // Validate access (requires MEMBER or higher)
    await validateWorkspaceAccess(workspaceId, 'MEMBER');

    // Generate unique kioskId
    const kioskId = `kiosk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data: kiosk, errors } = await cookiesClient.models.Kiosk.create({
        kioskId,
        workspaceId,
        address: kioskData.address,
        locationDescription: kioskData.locationDescription || null,
        description: kioskData.description || null,
        remark: kioskData.remark || null,
        status: kioskData.status || 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    if (errors || !kiosk) {
        throw new Error(`Failed to create kiosk: ${errors?.map(e => e.message).join(', ') || 'Unknown error'}`);
    }

    return kiosk;
}

/**
 * Update kiosk (requires MEMBER or ADMIN role)
 */
export async function updateKiosk(
    workspaceId: string,
    kioskId: string,
    updates: Partial<{
        address: string;
        locationDescription: string;
        description: string;
        remark: string;
        status: KioskStatus;
    }>
): Promise<KioskType> {
    // Validate access (requires MEMBER or higher)
    await validateWorkspaceAccess(workspaceId, 'MEMBER');

    // Verify kiosk exists and belongs to workspace
    const { kiosk: existingKiosk } = await getKioskWithAccess(workspaceId, kioskId);

    const { data: kiosk, errors } = await cookiesClient.models.Kiosk.update({
        id: existingKiosk.id,
        ...updates,
        updatedAt: new Date().toISOString()
    });

    if (errors || !kiosk) {
        throw new Error(`Failed to update kiosk: ${errors?.map(e => e.message).join(', ') || 'Unknown error'}`);
    }

    return kiosk;
}

/**
 * Delete kiosk (requires ADMIN role)
 */
export async function deleteKiosk(workspaceId: string, kioskId: string): Promise<void> {
    // Validate access (requires ADMIN)
    await validateWorkspaceAccess(workspaceId, 'ADMIN');

    // Verify kiosk exists and belongs to workspace
    const { kiosk: existingKiosk } = await getKioskWithAccess(workspaceId, kioskId);

    const { errors } = await cookiesClient.models.Kiosk.delete({ id: existingKiosk.id });

    if (errors) {
        throw new Error(`Failed to delete kiosk: ${errors.map(e => e.message).join(', ')}`);
    }
}

/**
 * Search kiosks within a workspace
 */
export async function searchKiosks(
    workspaceId: string,
    searchTerm: string,
    status?: KioskStatus
): Promise<{
    kiosks: SelectedKiosk[];
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
}> {
    // Get all workspace kiosks first
    const result = await getWorkspaceKiosks(workspaceId);

    // Filter kiosks based on search criteria
    let filteredKiosks = result.kiosks;

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredKiosks = filteredKiosks.filter(kiosk =>
            kiosk.address.toLowerCase().includes(term) ||
            kiosk.locationDescription?.toLowerCase().includes(term) ||
            kiosk.description?.toLowerCase().includes(term) ||
            kiosk.kioskId.toLowerCase().includes(term)
        );
    }

    if (status) {
        filteredKiosks = filteredKiosks.filter(kiosk => kiosk.status === status);
    }

    return {
        ...result,
        kiosks: filteredKiosks
    };
} 