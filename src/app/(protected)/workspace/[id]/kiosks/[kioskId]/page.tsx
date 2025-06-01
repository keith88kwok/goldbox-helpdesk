import { redirect } from 'next/navigation';
import { getKioskWithAccess } from '@/lib/server/kiosk-utils';
import { getKioskAttachments } from '@/lib/server/attachment-utils';
import { getKioskMaintenanceRecords } from '@/lib/server/kiosk-maintenance-utils';
import KioskDetailClient from './kiosk-detail-client';

interface PageProps {
    params: Promise<{ id: string; kioskId: string }>;
}

/**
 * Server component for kiosk detail page
 * Fetches kiosk data server-side with access validation
 */
export default async function KioskDetailPage({ params }: PageProps) {
    try {
        // Await params before accessing properties
        const { id, kioskId } = await params;

        // Fetch kiosk data server-side with workspace access validation
        const { kiosk, workspace, userRole } = await getKioskWithAccess(id, kioskId);

        // Fetch kiosk attachments with signed URLs
        const attachments = await getKioskAttachments(kiosk.id);

        // Fetch maintenance records for this kiosk
        const maintenanceRecords = await getKioskMaintenanceRecords(id, kiosk.id);

        return (
            <KioskDetailClient
                kiosk={kiosk}
                workspace={workspace}
                userRole={userRole}
                workspaceId={id}
                initialAttachments={attachments}
                maintenanceRecords={maintenanceRecords}
            />
        );
    } catch (error) {
        console.error('Kiosk detail access error:', error);

        // Await params to get the id for redirect
        const { id } = await params;

        // Redirect to kiosks page with error message
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        redirect(`/workspace/${id}/kiosks?error=${encodeURIComponent(errorMessage)}`);
    }
} 