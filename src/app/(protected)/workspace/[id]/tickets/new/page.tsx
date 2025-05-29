import { redirect } from 'next/navigation';
import { getWorkspaceAccess } from '@/lib/server/workspace-utils';
import { getWorkspaceKiosks } from '@/lib/server/kiosk-utils';
import { getWorkspaceUsers } from '@/lib/server/ticket-utils';
import NewTicketClient from './new-ticket-client';

interface PageProps {
    params: Promise<{ id: string }>;
}

/**
 * Server component for new ticket page
 * Validates workspace access and role permissions server-side
 */
export default async function NewTicketPage({ params }: PageProps) {
    try {
        // Await params before accessing properties
        const { id } = await params;

        // Validate workspace access server-side
        const { workspace, userRole } = await getWorkspaceAccess(id);

        // Check if user has permission to create tickets
        const canCreateTicket = userRole === 'ADMIN' || userRole === 'MEMBER';

        if (!canCreateTicket) {
            redirect(`/workspace/${id}/tickets?error=${encodeURIComponent('Insufficient permissions to create tickets')}`);
        }

        // Get workspace kiosks for selection
        const { kiosks } = await getWorkspaceKiosks(id);

        // Get workspace users for assignment
        const workspaceUsers = await getWorkspaceUsers(id);

        return (
            <NewTicketClient
                workspace={workspace}
                workspaceId={id}
                kiosks={kiosks}
                workspaceUsers={workspaceUsers}
            />
        );
    } catch (error) {
        console.error('New ticket access error:', error);

        // Await params to get the id for redirect  
        const { id } = await params;

        // Redirect to tickets page with error message
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        redirect(`/workspace/${id}/tickets?error=${encodeURIComponent(errorMessage)}`);
    }
} 