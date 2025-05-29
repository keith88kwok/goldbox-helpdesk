import { getWorkspaceKiosks } from './kiosk-utils';
import { getWorkspaceTickets } from './ticket-utils';
import { getWorkspaceUsers } from './ticket-utils';

export interface WorkspaceStats {
    totalKiosks: number;
    openTickets: number;
    teamMembers: number;
}

/**
 * Get aggregated statistics for a workspace dashboard
 * Fetches counts of kiosks, open tickets, and team members
 */
export async function getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
    try {
        // Fetch all data in parallel for better performance
        const [kiosksData, ticketsData, usersData] = await Promise.all([
            getWorkspaceKiosks(workspaceId),
            getWorkspaceTickets(workspaceId),
            getWorkspaceUsers(workspaceId)
        ]);

        // Count total kiosks
        const totalKiosks = kiosksData.kiosks.length;

        // Count open tickets (OPEN or IN_PROGRESS status)
        const openTickets = ticketsData.tickets.filter(ticket => 
            ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'
        ).length;

        // Count team members
        const teamMembers = usersData.length;

        return {
            totalKiosks,
            openTickets,
            teamMembers
        };
    } catch (error) {
        console.error('Error fetching workspace stats:', error);
        // Return zeros if there's an error to prevent dashboard from breaking
        return {
            totalKiosks: 0,
            openTickets: 0,
            teamMembers: 0
        };
    }
} 