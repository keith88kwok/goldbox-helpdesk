import { getWorkspaceTickets, getWorkspaceUsers } from './ticket-utils';
import { getUserWorkspaces, type SelectedWorkspace } from './workspace-utils';
import { cookiesClient } from '@/utils/amplify-utils';

export interface WorkspaceStats {
    totalKiosks: number;
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    teamMembers: number;
    recentTickets: Array<{
        id: string;
        ticketId: string;
        title: string;
        status: string;
        reportedDate: string;
        reporterName: string | null;
    }>;
}

export interface GlobalDashboardStats {
    totalTickets: number;
    myTickets: number;
    openTickets: number;
    inProgressTickets: number;
    recentActivity: Array<{
        id: string;
        ticketId: string;
        title: string;
        status: string;
        reportedDate: string;
        reporterName: string | null;
        workspaceName: string;
        workspaceId: string;
    }>;
    workspaceBreakdown: Array<{
        workspace: SelectedWorkspace;
        ticketCount: number;
        myTicketCount: number;
        openTicketCount: number;
    }>;
}

/**
 * Get enhanced workspace statistics including recent tickets
 */
export async function getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
    // Get all data in parallel
    const [{ tickets }, kiosksData, usersData] = await Promise.all([
        getWorkspaceTickets(workspaceId),
        cookiesClient.models.Kiosk.list({
            filter: {
                workspaceId: { eq: workspaceId }
            }
        }),
        getWorkspaceUsers(workspaceId)
    ]);
    
    // Calculate stats
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'OPEN').length;
    const inProgressTickets = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED').length;
    const closedTickets = tickets.filter(t => t.status === 'CLOSED').length;
    
    // Get recent tickets (last 10)
    const recentTickets = tickets
        .sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime())
        .slice(0, 10)
        .map(ticket => ({
            id: ticket.id,
            ticketId: ticket.ticketId,
            title: ticket.title,
            status: ticket.status || 'OPEN',
            reportedDate: ticket.reportedDate,
            reporterName: ticket.reporterName
        }));
    
    return {
        totalKiosks: kiosksData.data?.length || 0,
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        teamMembers: usersData.length,
        recentTickets
    };
}

/**
 * Get global dashboard statistics across all user's accessible workspaces
 */
export async function getGlobalDashboardStats(userId: string): Promise<GlobalDashboardStats> {
    // Get all user's workspaces
    const userWorkspaces = await getUserWorkspaces();
    
    if (userWorkspaces.length === 0) {
        return {
            totalTickets: 0,
            myTickets: 0,
            openTickets: 0,
            inProgressTickets: 0,
            recentActivity: [],
            workspaceBreakdown: []
        };
    }
    
    // Get tickets for each workspace in parallel
    const workspaceTicketsPromises = userWorkspaces.map(async (userWorkspace) => {
        try {
            const { tickets } = await getWorkspaceTickets(userWorkspace.workspace.id);
            return {
                workspace: userWorkspace.workspace,
                tickets
            };
        } catch (error) {
            console.error(`Error fetching tickets for workspace ${userWorkspace.workspace.id}:`, error);
            return {
                workspace: userWorkspace.workspace,
                tickets: []
            };
        }
    });
    
    const workspaceTickets = await Promise.all(workspaceTicketsPromises);
    
    // Aggregate all tickets
    const allTickets = workspaceTickets.flatMap(wt => 
        wt.tickets.map(ticket => ({
            ...ticket,
            workspaceName: wt.workspace.name,
            workspaceId: wt.workspace.id
        }))
    );
    
    // Calculate global stats
    const totalTickets = allTickets.length;
    const myTickets = allTickets.filter(t => t.assigneeId === userId).length;
    const openTickets = allTickets.filter(t => t.status === 'OPEN').length;
    const inProgressTickets = allTickets.filter(t => t.status === 'IN_PROGRESS').length;
    
    // Get recent activity (last 10 tickets across all workspaces)
    const recentActivity = allTickets
        .sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime())
        .slice(0, 10)
        .map(ticket => ({
            id: ticket.id,
            ticketId: ticket.ticketId,
            title: ticket.title,
            status: ticket.status || 'OPEN',
            reportedDate: ticket.reportedDate,
            reporterName: ticket.reporterName,
            workspaceName: ticket.workspaceName,
            workspaceId: ticket.workspaceId
        }));
    
    // Calculate workspace breakdown
    const workspaceBreakdown = workspaceTickets.map(wt => ({
        workspace: wt.workspace,
        ticketCount: wt.tickets.length,
        myTicketCount: wt.tickets.filter(t => t.assigneeId === userId).length,
        openTicketCount: wt.tickets.filter(t => t.status === 'OPEN').length
    }));
    
    return {
        totalTickets,
        myTickets,
        openTickets,
        inProgressTickets,
        recentActivity,
        workspaceBreakdown
    };
} 