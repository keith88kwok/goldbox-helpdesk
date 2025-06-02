import { redirect } from 'next/navigation';
import { getAllUserAccessibleTickets } from '@/lib/server/ticket-utils';
import { getServerUserOrNull } from '@/lib/server/auth-utils';
import GlobalTicketsClient from './tickets-client';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Server component for global tickets page
 * Fetches tickets data across all accessible workspaces server-side for better performance
 */
export default async function GlobalTicketsPage({ searchParams }: PageProps) {
    try {
        // Check authentication
        const user = await getServerUserOrNull();
        
        if (!user) {
            redirect('/auth/login?reason=authentication_required');
        }

        // Await searchParams before accessing properties
        const search = await searchParams;

        // Extract search parameters
        const searchTerm = typeof search.search === 'string' ? search.search : undefined;
        const status = typeof search.status === 'string' ? search.status : undefined;
        const dateFrom = typeof search.dateFrom === 'string' ? search.dateFrom : undefined;
        const dateTo = typeof search.dateTo === 'string' ? search.dateTo : undefined;
        const assigneeId = typeof search.assigneeId === 'string' ? search.assigneeId : undefined;
        const workspaceId = typeof search.workspaceId === 'string' ? search.workspaceId : undefined;
        const onlyMyTickets = search.onlyMyTickets === 'true';

        // Get tickets across all accessible workspaces
        const { tickets, workspaces, totalCount } = await getAllUserAccessibleTickets(user.id, {
            searchTerm,
            status: status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | undefined,
            dateFrom,
            dateTo,
            assigneeId,
            workspaceId,
            onlyMyTickets,
            useMaintenance: true
        });

        return (
            <GlobalTicketsClient
                tickets={tickets}
                workspaces={workspaces}
                user={user}
                totalCount={totalCount}
                initialFilters={{
                    searchTerm,
                    status,
                    dateFrom,
                    dateTo,
                    assigneeId,
                    workspaceId,
                    onlyMyTickets
                }}
            />
        );
    } catch (error) {
        console.error('Global tickets access error:', error);

        // Redirect to dashboard with error message
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        redirect(`/dashboard?error=${encodeURIComponent(errorMessage)}`);
    }
} 