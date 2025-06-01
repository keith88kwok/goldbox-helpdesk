import { redirect } from 'next/navigation';
import { getWorkspaceTickets, searchTickets } from '@/lib/server/ticket-utils';
import TicketsClient from './tickets-client';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Server component for tickets page
 * Fetches tickets data server-side for better performance with optional filtering
 */
export default async function TicketsPage({ params, searchParams }: PageProps) {
    try {
        // Await params and searchParams before accessing properties
        const { id } = await params;
        const search = await searchParams;

        // Extract search parameters
        const searchTerm = typeof search.search === 'string' ? search.search : undefined;
        const status = typeof search.status === 'string' ? search.status : undefined;
        const dateFrom = typeof search.dateFrom === 'string' ? search.dateFrom : undefined;
        const dateTo = typeof search.dateTo === 'string' ? search.dateTo : undefined;
        const assigneeId = typeof search.assigneeId === 'string' ? search.assigneeId : undefined;

        // Use searchTickets if any filters are provided, otherwise use getWorkspaceTickets with current month default
        const hasFilters = searchTerm || status || dateFrom || dateTo || assigneeId;
        
        const result = hasFilters 
            ? await searchTickets(id, {
                searchTerm,
                status: status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | undefined,
                dateFrom,
                dateTo,
                assigneeId,
                useMaintenance: true // Use maintenance date priority
            })
            : await getWorkspaceTickets(id, {
                useCurrentMonthDefault: true // Show current month by default
            });

        const { tickets, workspace, userRole } = result;

        return (
            <TicketsClient
                tickets={tickets}
                workspace={workspace}
                userRole={userRole}
                initialFilters={{
                    searchTerm,
                    status,
                    dateFrom,
                    dateTo,
                    assigneeId
                }}
            />
        );
    } catch (error) {
        console.error('Tickets access error:', error);

        // Redirect to workspaces with error message
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        redirect(`/workspaces?error=${encodeURIComponent(errorMessage)}`);
    }
} 