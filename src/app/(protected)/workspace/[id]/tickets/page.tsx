import { redirect } from 'next/navigation';
import { getWorkspaceTickets } from '@/lib/server/ticket-utils';
import TicketsClient from './tickets-client';

interface PageProps {
    params: Promise<{ id: string }>;
}

/**
 * Server component for tickets page
 * Fetches tickets data server-side for better performance
 */
export default async function TicketsPage({ params }: PageProps) {
    try {
        // Await params before accessing properties
        const { id } = await params;

        // Fetch tickets data server-side with access validation
        const { tickets, workspace, userRole } = await getWorkspaceTickets(id);

        return (
            <TicketsClient
                tickets={tickets}
                workspace={workspace}
                userRole={userRole}
            />
        );
    } catch (error) {
        console.error('Tickets access error:', error);

        // Redirect to workspaces with error message
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        redirect(`/workspaces?error=${encodeURIComponent(errorMessage)}`);
    }
} 