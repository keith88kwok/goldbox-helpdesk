import { getWorkspaceAccess, validateWorkspaceAccess, type SelectedWorkspace } from './workspace-utils';
import { cookiesClient, type Schema } from '@/utils/amplify-utils';
import { 
    getCurrentMonthRange, 
    isTicketInDateRange, 
    normalizeDateRange 
} from '@/lib/date-utils';

// Re-export SelectedWorkspace for client components
export type { SelectedWorkspace } from './workspace-utils';

type TicketType = Schema['Ticket']['type'];
type UserType = Schema['User']['type'];
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

// Type for ticket data with only safe fields (no functions)
export type SelectedTicket = {
    id: string;
    ticketId: string;
    workspaceId: string;
    kioskId: string;
    reporterId: string;
    assigneeId: string | null;
    status: string | null;
    title: string;
    description: string;
    comments: any[] | null; // eslint-disable-line @typescript-eslint/no-explicit-any
    attachments: string[] | null;
    reportedDate: string;
    updatedDate: string | null;
    maintenanceTime: string | null;
    // Enhanced user information
    reporterName: string | null;
    assigneeName: string | null;
};

export interface TicketWithWorkspace {
    ticket: SelectedTicket;
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

/**
 * Extract safe ticket fields for client components with user information
 */
function extractTicketFields(ticket: TicketType, userMap: Map<string, UserType>): SelectedTicket {
    const reporter = userMap.get(ticket.reporterId);
    const assignee = ticket.assigneeId ? userMap.get(ticket.assigneeId) : null;

    return {
        id: ticket.id,
        ticketId: ticket.ticketId,
        workspaceId: ticket.workspaceId,
        kioskId: ticket.kioskId,
        reporterId: ticket.reporterId,
        assigneeId: ticket.assigneeId || null,
        status: ticket.status || null,
        title: ticket.title,
        description: ticket.description,
        comments: ticket.comments || null,
        attachments: ticket.attachments ? ticket.attachments.filter(att => att !== null) : null,
        reportedDate: ticket.reportedDate,
        updatedDate: ticket.updatedDate || null,
        maintenanceTime: ticket.maintenanceTime || null,
        reporterName: reporter?.name || null,
        assigneeName: assignee?.name || null,
    };
}

/**
 * Get all tickets for a workspace with optional date filtering (defaults to current month)
 */
export async function getWorkspaceTickets(workspaceId: string, options?: {
    dateFrom?: string;
    dateTo?: string;
    useCurrentMonthDefault?: boolean;
}): Promise<{
    tickets: SelectedTicket[];
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
}> {
    // Validate access to workspace
    const access = await getWorkspaceAccess(workspaceId);

    // Set default to current month if useCurrentMonthDefault is true and no dates provided
    let dateFrom = options?.dateFrom;
    let dateTo = options?.dateTo;
    
    if (options?.useCurrentMonthDefault && !dateFrom && !dateTo) {
        const currentMonthRange = getCurrentMonthRange();
        dateFrom = currentMonthRange.dateFrom;
        dateTo = currentMonthRange.dateTo;
    }

    // Normalize date range for consistent filtering
    const normalizedDates = normalizeDateRange(dateFrom, dateTo);

    // Build filter conditions
    const filterConditions: Record<string, unknown>[] = [
        { workspaceId: { eq: workspaceId } }
    ];

    // Get all tickets first
    const { data: tickets, errors } = await cookiesClient.models.Ticket.list({
        filter: {
            and: filterConditions
        }
    });

    if (errors) {
        throw new Error(`Failed to fetch tickets: ${errors.map(e => e.message).join(', ')}`);
    }

    let filteredTickets = tickets || [];

    // Apply date filtering with standardized logic
    if (normalizedDates.dateFrom || normalizedDates.dateTo) {
        filteredTickets = filteredTickets.filter(ticket => 
            isTicketInDateRange(ticket, normalizedDates.dateFrom, normalizedDates.dateTo)
        );
    }

    // Get unique user IDs from tickets
    // const userIds = [...new Set([
    //     ...filteredTickets.map(t => t.reporterId),
    //     ...filteredTickets.map(t => t.assigneeId).filter(Boolean)
    // ])];

    // Fetch user data for all relevant users
    const { data: users } = await cookiesClient.models.User.list();
    const userMap = new Map((users || []).map(u => [u.userId, u]));

    return {
        tickets: filteredTickets.map(ticket => extractTicketFields(ticket, userMap)),
        workspace: access.workspace,
        userRole: access.userRole
    };
}

/**
 * Get specific ticket with access validation
 */
export async function getTicketWithAccess(workspaceId: string, ticketId: string): Promise<TicketWithWorkspace> {
    // Validate access to workspace
    const access = await getWorkspaceAccess(workspaceId);

    // Get the specific ticket
    const { data: ticket, errors } = await cookiesClient.models.Ticket.get({ id: ticketId });

    if (errors || !ticket) {
        throw new Error(`Ticket not found: ${ticketId}`);
    }

    // Verify ticket belongs to the workspace
    if (ticket.workspaceId !== workspaceId) {
        throw new Error(`Ticket ${ticketId} does not belong to workspace ${workspaceId}`);
    }

    // Get user data for reporter and assignee
    // const userIds = [ticket.reporterId, ticket.assigneeId].filter(Boolean);
    const { data: users } = await cookiesClient.models.User.list();
    const userMap = new Map((users || []).map(u => [u.userId, u]));

    return {
        ticket: extractTicketFields(ticket, userMap),
        workspace: access.workspace,
        userRole: access.userRole
    };
}

/**
 * Create a new ticket (requires MEMBER or ADMIN role)
 */
export async function createTicket(
    workspaceId: string,
    ticketData: {
        kioskId: string;
        reporterId: string;
        assigneeId?: string;
        title: string;
        description: string;
        status?: TicketStatus;
        maintenanceTime?: string;
    }
): Promise<TicketType> {
    // Validate access (requires MEMBER or higher)
    await validateWorkspaceAccess(workspaceId, 'MEMBER');

    // Generate unique ticketId
    const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data: ticket, errors } = await cookiesClient.models.Ticket.create({
        ticketId,
        workspaceId,
        kioskId: ticketData.kioskId,
        reporterId: ticketData.reporterId,
        assigneeId: ticketData.assigneeId || null,
        title: ticketData.title,
        description: ticketData.description,
        status: ticketData.status || 'OPEN',
        reportedDate: new Date().toISOString(),
        maintenanceTime: ticketData.maintenanceTime || null,
    });

    if (errors || !ticket) {
        throw new Error(`Failed to create ticket: ${errors?.map(e => e.message).join(', ') || 'Unknown error'}`);
    }

    return ticket;
}

/**
 * Update ticket (requires MEMBER or ADMIN role)
 */
export async function updateTicket(
    workspaceId: string,
    ticketId: string,
    updates: Partial<{
        assigneeId: string;
        status: TicketStatus;
        title: string;
        description: string;
        maintenanceTime: string;
        comments: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        attachments: string[];
    }>
): Promise<TicketType> {
    // Validate access (requires MEMBER or higher)
    await validateWorkspaceAccess(workspaceId, 'MEMBER');

    // Verify ticket exists and belongs to workspace
    const { ticket: existingTicket } = await getTicketWithAccess(workspaceId, ticketId);

    const { data: ticket, errors } = await cookiesClient.models.Ticket.update({
        id: existingTicket.id,
        ...updates,
        updatedDate: new Date().toISOString(),
    });

    if (errors || !ticket) {
        throw new Error(`Failed to update ticket: ${errors?.map(e => e.message).join(', ') || 'Unknown error'}`);
    }

    return ticket;
}

/**
 * Delete ticket (requires ADMIN role)
 */
export async function deleteTicket(workspaceId: string, ticketId: string): Promise<void> {
    // Validate access (requires ADMIN)
    await validateWorkspaceAccess(workspaceId, 'ADMIN');

    // Verify ticket exists and belongs to workspace
    const { ticket: existingTicket } = await getTicketWithAccess(workspaceId, ticketId);

    const { errors } = await cookiesClient.models.Ticket.delete({ id: existingTicket.id });

    if (errors) {
        throw new Error(`Failed to delete ticket: ${errors.map(e => e.message).join(', ')}`);
    }
}

/**
 * Search tickets within a workspace with enhanced date filtering
 */
export async function searchTickets(
    workspaceId: string,
    filters: {
        searchTerm?: string;
        status?: TicketStatus;
        assigneeId?: string;
        kioskId?: string;
        dateFrom?: string;
        dateTo?: string;
        useMaintenance?: boolean; // If true, filter by maintenanceTime, otherwise reportedDate
    }
): Promise<{
    tickets: SelectedTicket[];
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
}> {
    // Validate access to workspace
    const access = await getWorkspaceAccess(workspaceId);

    // Build filter conditions for database query
    const filterConditions: Record<string, unknown>[] = [
        { workspaceId: { eq: workspaceId } }
    ];

    if (filters.status) {
        filterConditions.push({ status: { eq: filters.status } });
    }

    if (filters.assigneeId) {
        filterConditions.push({ assigneeId: { eq: filters.assigneeId } });
    }

    if (filters.kioskId) {
        filterConditions.push({ kioskId: { eq: filters.kioskId } });
    }

    // Get all tickets first, then apply complex date filtering
    const { data: tickets, errors } = await cookiesClient.models.Ticket.list({
        filter: {
            and: filterConditions
        }
    });

    if (errors) {
        throw new Error(`Failed to search tickets: ${errors.map(e => e.message).join(', ')}`);
    }

    let filteredTickets = tickets || [];

    // Apply date filtering with standardized logic
    if (filters.dateFrom || filters.dateTo) {
        const normalizedDates = normalizeDateRange(filters.dateFrom, filters.dateTo);
        filteredTickets = filteredTickets.filter(ticket => 
            isTicketInDateRange(ticket, normalizedDates.dateFrom, normalizedDates.dateTo)
        );
    }

    // Apply text search if provided (description and title search)
    if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredTickets = filteredTickets.filter(ticket => 
            ticket.title.toLowerCase().includes(searchLower) ||
            ticket.description.toLowerCase().includes(searchLower)
        );
    }

    // Get unique user IDs from tickets
    // const userIds = [...new Set([
    //     ...filteredTickets.map(t => t.reporterId),
    //     ...filteredTickets.map(t => t.assigneeId).filter(Boolean)
    // ])];

    // Fetch user data for all relevant users
    const { data: users } = await cookiesClient.models.User.list();
    const userMap = new Map((users || []).map(u => [u.userId, u]));

    return {
        tickets: filteredTickets.map(ticket => extractTicketFields(ticket, userMap)),
        workspace: access.workspace,
        userRole: access.userRole
    };
}

/**
 * Get tickets assigned to a user across all accessible workspaces
 */
export async function getUserTickets(userId: string): Promise<SelectedTicket[]> {
    // Get tickets assigned to this user
    const { data: tickets, errors } = await cookiesClient.models.Ticket.list({
        filter: {
            assigneeId: { eq: userId }
        }
    });

    if (errors) {
        throw new Error(`Failed to fetch user tickets: ${errors.map(e => e.message).join(', ')}`);
    }

    // Get user data for tickets
    const { data: users } = await cookiesClient.models.User.list();
    const userMap = new Map((users || []).map(u => [u.userId, u]));

    return (tickets || []).map(ticket => extractTicketFields(ticket, userMap));
}

/**
 * Get workspace users for ticket assignment
 */
export async function getWorkspaceUsers(workspaceId: string): Promise<{
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
}[]> {
    // Validate access to workspace
    await getWorkspaceAccess(workspaceId);

    // Get workspace users
    const { data: workspaceUsers, errors } = await cookiesClient.models.WorkspaceUser.list({
        filter: {
            workspaceId: { eq: workspaceId }
        }
    });

    if (errors) {
        throw new Error(`Failed to fetch workspace users: ${errors.map(e => e.message).join(', ')}`);
    }

    // Get user details for each workspace user
    const userPromises = (workspaceUsers || []).map(async (wu) => {
        const { data: user } = await cookiesClient.models.User.get({ id: wu.userId });
        return user ? {
            id: user.id,
            userId: user.userId,
            name: user.name,
            email: user.email,
            role: wu.role || 'VIEWER'
        } : null;
    });

    const users = await Promise.all(userPromises);
    return users.filter(user => user !== null) as {
        id: string;
        userId: string;
        name: string;
        email: string;
        role: string;
    }[];
} 