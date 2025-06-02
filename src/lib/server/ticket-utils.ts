import { getWorkspaceAccess, validateWorkspaceAccess, getUserWorkspaces } from './workspace-utils';
import type { SelectedWorkspace } from './workspace-utils';
import { cookiesClient, type Schema } from '@/utils/amplify-utils';
import { 
    normalizeDateRange, 
    isTicketInDateRange, 
    getCurrentMonthRange 
} from '@/lib/date-utils';

// Re-export SelectedWorkspace for other modules
export { type SelectedWorkspace };

// Schema types
type TicketType = Schema['Ticket']['type'];
type UserType = Schema['User']['type'];
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type WorkspaceRole = 'ADMIN' | 'MEMBER' | 'VIEWER';

// Types for workspace user data
type UserWorkspaceData = {
    workspace: SelectedWorkspace;
    role: WorkspaceRole;
    joinedAt: string;
};

// Types for kiosk data
type KioskData = {
    id: string;
    address: string;
    description: string | null;
    [key: string]: unknown;
};

type WorkspaceKiosks = {
    workspaceId: string;
    kiosks: KioskData[];
};

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
    comments: { id: string; content: string; createdAt: string; userId: string }[] | null;
    attachments: string[] | null;
    reportedDate: string;
    updatedDate: string | null;
    maintenanceTime: string | null;
    // Soft delete fields
    isDeleted: boolean | null;
    deletedAt: string | null;
    deletedBy: string | null;
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

    // Handle comments - convert from database format to expected format
    let comments: { id: string; content: string; createdAt: string; userId: string }[] | null = null;
    if (ticket.comments && Array.isArray(ticket.comments)) {
        comments = ticket.comments
            .filter((comment): comment is Record<string, unknown> => typeof comment === 'object' && comment !== null)
            .map((comment) => ({
                id: String(comment.id || ''),
                content: String(comment.content || ''),
                createdAt: String(comment.createdAt || ''),
                userId: String(comment.userId || '')
            }));
    }

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
        comments,
        attachments: ticket.attachments ? ticket.attachments.filter(att => att !== null) : null,
        reportedDate: ticket.reportedDate,
        updatedDate: ticket.updatedDate || null,
        maintenanceTime: ticket.maintenanceTime || null,
        // Soft delete fields
        isDeleted: ticket.isDeleted || null,
        deletedAt: ticket.deletedAt || null,
        deletedBy: ticket.deletedBy || null,
        // Enhanced user information
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
        { workspaceId: { eq: workspaceId } },
        // Exclude soft-deleted tickets
        { 
            or: [
                { isDeleted: { ne: true } },
                { isDeleted: { attributeExists: false } }
            ]
        }
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
        comments: (string | number | boolean | object | unknown[] | null)[] | null;
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
 * Soft delete ticket (requires ADMIN role)
 */
export async function softDeleteTicket(workspaceId: string, ticketId: string, deletedBy: string): Promise<void> {
    // Validate access (requires ADMIN)
    await validateWorkspaceAccess(workspaceId, 'ADMIN');

    // Verify ticket exists and belongs to workspace
    const { ticket: existingTicket } = await getTicketWithAccess(workspaceId, ticketId);

    // Check if ticket is already deleted
    if (existingTicket.isDeleted) {
        throw new Error('Ticket is already deleted');
    }

    const { errors } = await cookiesClient.models.Ticket.update({
        id: existingTicket.id,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy,
        updatedDate: new Date().toISOString(),
    });

    if (errors) {
        throw new Error(`Failed to delete ticket: ${errors.map(e => e.message).join(', ')}`);
    }
}

/**
 * Restore soft-deleted ticket (requires ADMIN role)
 */
export async function restoreTicket(workspaceId: string, ticketId: string): Promise<void> {
    // Validate access (requires ADMIN)
    await validateWorkspaceAccess(workspaceId, 'ADMIN');

    // Get the specific ticket (including deleted ones)
    const { data: ticket, errors } = await cookiesClient.models.Ticket.get({ id: ticketId });

    if (errors || !ticket) {
        throw new Error(`Ticket not found: ${ticketId}`);
    }

    // Verify ticket belongs to the workspace
    if (ticket.workspaceId !== workspaceId) {
        throw new Error(`Ticket ${ticketId} does not belong to workspace ${workspaceId}`);
    }

    // Check if ticket is actually deleted
    if (!ticket.isDeleted) {
        throw new Error('Ticket is not deleted');
    }

    const { errors: updateErrors } = await cookiesClient.models.Ticket.update({
        id: ticket.id,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        updatedDate: new Date().toISOString(),
    });

    if (updateErrors) {
        throw new Error(`Failed to restore ticket: ${updateErrors.map(e => e.message).join(', ')}`);
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
        { workspaceId: { eq: workspaceId } },
        // Exclude soft-deleted tickets
        { 
            or: [
                { isDeleted: { ne: true } },
                { isDeleted: { attributeExists: false } }
            ]
        }
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
            and: [
                { assigneeId: { eq: userId } },
                // Exclude soft-deleted tickets
                { 
                    or: [
                        { isDeleted: { ne: true } },
                        { isDeleted: { attributeExists: false } }
                    ]
                }
            ]
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

/**
 * Get tickets across all accessible workspaces with enhanced filtering
 */
export async function getAllUserAccessibleTickets(
    userId: string,
    filters?: {
        searchTerm?: string;
        status?: TicketStatus;
        assigneeId?: string;
        workspaceId?: string;
        dateFrom?: string;
        dateTo?: string;
        onlyMyTickets?: boolean;
        useMaintenance?: boolean;
    }
): Promise<{
    tickets: (SelectedTicket & { 
        workspaceName: string; 
        kioskAddress: string; 
        kioskDescription: string;
    })[];
    workspaces: SelectedWorkspace[];
    totalCount: number;
}> {
    // Get all user's accessible workspaces
    const userWorkspaces = await getUserWorkspaces();
    
    if (userWorkspaces.length === 0) {
        return {
            tickets: [],
            workspaces: [],
            totalCount: 0
        };
    }

    // Filter workspaces if specific workspace requested
    const targetWorkspaces = filters?.workspaceId 
        ? userWorkspaces.filter((uw: UserWorkspaceData) => uw.workspace.id === filters.workspaceId)
        : userWorkspaces;

    if (targetWorkspaces.length === 0) {
        return {
            tickets: [],
            workspaces: userWorkspaces.map((uw: UserWorkspaceData) => uw.workspace),
            totalCount: 0
        };
    }

    // Get tickets from all target workspaces in parallel
    const workspaceTicketsPromises = targetWorkspaces.map(async (userWorkspace: UserWorkspaceData) => {
        try {
            // Build filter conditions for each workspace
            const workspaceFilters: Parameters<typeof searchTickets>[1] = {
                useMaintenance: filters?.useMaintenance || true
            };

            // Apply filters
            if (filters?.searchTerm) workspaceFilters.searchTerm = filters.searchTerm;
            if (filters?.status) workspaceFilters.status = filters.status;
            if (filters?.assigneeId) workspaceFilters.assigneeId = filters.assigneeId;
            if (filters?.dateFrom) workspaceFilters.dateFrom = filters.dateFrom;
            if (filters?.dateTo) workspaceFilters.dateTo = filters.dateTo;
            if (filters?.onlyMyTickets) workspaceFilters.assigneeId = userId;

            const { tickets } = await searchTickets(userWorkspace.workspace.id, workspaceFilters);
            
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

    // Get all kiosks for address mapping
    const allKiosksPromises = targetWorkspaces.map(async (userWorkspace: UserWorkspaceData) => {
        try {
            const { data: kiosks } = await cookiesClient.models.Kiosk.list({
                filter: {
                    workspaceId: { eq: userWorkspace.workspace.id }
                }
            });
            return {
                workspaceId: userWorkspace.workspace.id,
                kiosks: kiosks || []
            };
        } catch (error) {
            console.error(`Error fetching kiosks for workspace ${userWorkspace.workspace.id}:`, error);
            return {
                workspaceId: userWorkspace.workspace.id,
                kiosks: []
            };
        }
    });

    const workspaceKiosks = await Promise.all(allKiosksPromises);
    
    // Create kiosk lookup map
    const kioskMap = new Map<string, { address: string; description: string }>();
    workspaceKiosks.forEach((wk: WorkspaceKiosks) => {
        wk.kiosks.forEach((kiosk: KioskData) => {
            kioskMap.set(kiosk.id, {
                address: kiosk.address || 'Unknown address',
                description: kiosk.description || ''
            });
        });
    });

    // Combine all tickets with workspace and kiosk information
    const enhancedTickets = workspaceTickets.flatMap((wt: { workspace: SelectedWorkspace; tickets: SelectedTicket[] }) => 
        wt.tickets.map((ticket: SelectedTicket) => {
            const kioskInfo = kioskMap.get(ticket.kioskId) || { 
                address: 'Unknown kiosk', 
                description: '' 
            };
            
            return {
                ...ticket,
                workspaceName: wt.workspace.name,
                kioskAddress: kioskInfo.address,
                kioskDescription: kioskInfo.description
            };
        })
    );

    // Sort by reported date (most recent first)
    enhancedTickets.sort((a, b) => 
        new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime()
    );

    return {
        tickets: enhancedTickets,
        workspaces: userWorkspaces.map((uw: UserWorkspaceData) => uw.workspace),
        totalCount: enhancedTickets.length
    };
} 