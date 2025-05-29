import { redirect } from 'next/navigation';
import { getWorkspaceAccess } from '@/lib/server/workspace-utils';
import NewKioskClient from './new-kiosk-client';

interface PageProps {
    params: Promise<{ id: string }>;
}

/**
 * Server component for new kiosk page
 * Validates workspace access and role permissions server-side
 */
export default async function NewKioskPage({ params }: PageProps) {
    try {
        // Await params before accessing properties
        const { id } = await params;

        // Validate workspace access server-side
        const { workspace, userRole } = await getWorkspaceAccess(id);

        // Check if user has permission to create kiosks
        const canCreateKiosk = userRole === 'ADMIN' || userRole === 'MEMBER';

        if (!canCreateKiosk) {
            redirect(`/workspace/${id}/kiosks?error=${encodeURIComponent('Insufficient permissions to create kiosks')}`);
        }

        return (
            <NewKioskClient
                workspace={workspace}
                workspaceId={id}
            />
        );
    } catch (error) {
        console.error('New kiosk access error:', error);

        // Await params to get the id for redirect  
        const { id } = await params;

        // Redirect to kiosks page with error message
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        redirect(`/workspace/${id}/kiosks?error=${encodeURIComponent(errorMessage)}`);
    }
} 