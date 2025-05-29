import { redirect } from 'next/navigation';
import { getTicketWithAccess, getWorkspaceUsers } from '@/lib/server/ticket-utils';
import { getWorkspaceKiosks } from '@/lib/server/kiosk-utils';
import EditTicketClient from './edit-ticket-client';

interface PageProps {
    params: Promise<{ id: string; ticketId: string }>;
}

/**
 * Server component for edit ticket page
 * Validates access and fetches necessary data server-side
 */
export default async function EditTicketPage({ params }: PageProps) {
    try {
        // Await params before accessing properties
        const { id, ticketId } = await params;

        // Fetch ticket data with access validation
        const { ticket, workspace, userRole } = await getTicketWithAccess(id, ticketId);

        // Check if user has permission to edit tickets
        const canEditTicket = userRole === 'ADMIN' || userRole === 'MEMBER';

        if (!canEditTicket) {
            redirect(`/workspace/${id}/tickets/${ticketId}?error=${encodeURIComponent('Insufficient permissions to edit tickets')}`);
        }

        // Get workspace kiosks for selection
        const { kiosks } = await getWorkspaceKiosks(id);

        // Get workspace users for assignment
        const workspaceUsers = await getWorkspaceUsers(id);

        return (
            <EditTicketClient
                ticket={ticket}
                workspace={workspace}
                workspaceId={id}
                kiosks={kiosks}
                workspaceUsers={workspaceUsers}
            />
        );
    } catch (error) {
        console.error('Edit ticket access error:', error);

        // Await params to get the ids for redirect
        const { id, ticketId } = await params;

        // Redirect to ticket detail page with error message
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        redirect(`/workspace/${id}/tickets/${ticketId}?error=${encodeURIComponent(errorMessage)}`);
    }
} 