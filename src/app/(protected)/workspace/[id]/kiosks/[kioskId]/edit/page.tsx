import { redirect } from 'next/navigation';
import { getKioskWithAccess } from '@/lib/server/kiosk-utils';
import EditKioskClient from './edit-kiosk-client';

interface PageProps {
    params: Promise<{ id: string; kioskId: string }>;
}

/**
 * Server component for edit kiosk page
 * Validates workspace access, role permissions, and fetches kiosk data server-side
 */
export default async function EditKioskPage({ params }: PageProps) {
    try {
        // Await params before accessing properties
        const { id, kioskId } = await params;

        // Get kiosk with access validation server-side
        const { kiosk, workspace, userRole } = await getKioskWithAccess(id, kioskId);

        // Check if user has permission to edit kiosks
        const canEditKiosk = userRole === 'ADMIN' || userRole === 'MEMBER';

        if (!canEditKiosk) {
            redirect(`/workspace/${id}/kiosks/${kioskId}?error=${encodeURIComponent('Insufficient permissions to edit kiosks')}`);
        }

        return (
            <EditKioskClient
                kiosk={kiosk}
                workspace={workspace}
                userRole={userRole}
                workspaceId={id}
            />
        );
    } catch (error) {
        console.error('Edit kiosk access error:', error);

        // Await params to get the ids for redirect  
        const { id, kioskId } = await params;

        // Redirect to kiosk detail page with error message
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        redirect(`/workspace/${id}/kiosks/${kioskId}?error=${encodeURIComponent(errorMessage)}`);
    }
} 