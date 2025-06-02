'use server';

import { cookiesClient, type Schema } from '@/utils/amplify-utils';
import { TicketExportData } from '@/lib/csv-utils';
import { validateWorkspaceAccess } from './workspace-utils';
import { isTicketInDateRange, normalizeDateRange } from '@/lib/date-utils';

// Types for better TypeScript support
type TicketType = Schema['Ticket']['type'];
type KioskType = Schema['Kiosk']['type'];
type UserType = Schema['User']['type'];

/**
 * Server action to export tickets data for CSV download
 * Fetches filtered tickets with enhanced information for export
 */
export async function exportTicketsAction(
    workspaceId: string,
    filters: {
        searchTerm?: string;
        status?: string;
        dateFrom?: string;
        dateTo?: string;
        assigneeId?: string;
    } = {}
): Promise<{
    tickets: TicketExportData[];
    workspace: { id: string; name: string };
    totalCount: number;
    filteredCount: number;
}> {
    try {
        // Validate workspace access (requires at least VIEWER role)
        const access = await validateWorkspaceAccess(workspaceId, 'VIEWER');

        // Get workspace data from access validation
        const { data: workspace } = await cookiesClient.models.Workspace.get({ id: workspaceId });
        if (!workspace) {
            throw new Error('Workspace not found');
        }

        // Build filter conditions for database query
        const filterConditions: Record<string, unknown>[] = [
            { workspaceId: { eq: workspaceId } }
        ];

        if (filters.status && filters.status !== 'ALL') {
            filterConditions.push({ status: { eq: filters.status } });
        }

        if (filters.assigneeId) {
            filterConditions.push({ assigneeId: { eq: filters.assigneeId } });
        }

        // Get all tickets for this workspace
        const { data: tickets, errors } = await cookiesClient.models.Ticket.list({
            filter: {
                and: filterConditions
            }
        });

        if (errors) {
            throw new Error(`Failed to fetch tickets: ${errors.map(e => e.message).join(', ')}`);
        }

        const totalCount = tickets?.length || 0;
        let filteredTickets = tickets || [];

        // Apply date filtering with standardized logic
        if (filters.dateFrom || filters.dateTo) {
            const normalizedDates = normalizeDateRange(filters.dateFrom, filters.dateTo);
            filteredTickets = filteredTickets.filter((ticket: TicketType) => 
                isTicketInDateRange(
                    {
                        maintenanceTime: ticket.maintenanceTime || null,
                        reportedDate: ticket.reportedDate
                    }, 
                    normalizedDates.dateFrom, 
                    normalizedDates.dateTo
                )
            );
        }

        // Apply text search if provided
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filteredTickets = filteredTickets.filter((ticket: TicketType) => 
                ticket.title.toLowerCase().includes(searchLower) ||
                ticket.description.toLowerCase().includes(searchLower)
            );
        }

        // Get unique IDs for related data (not used directly but needed for lookups)
        // const kioskIds = [...new Set(filteredTickets.map((t: TicketType) => t.kioskId))];
        // const userIds = [...new Set([
        //     ...filteredTickets.map((t: TicketType) => t.reporterId),
        //     ...filteredTickets.map((t: TicketType) => t.assigneeId).filter(Boolean)
        // ])];

        // Fetch all kiosks for the workspace (simpler approach)
        const { data: allKiosks } = await cookiesClient.models.Kiosk.list({
            filter: {
                workspaceId: { eq: workspaceId }
            }
        });

        // Fetch all users for the workspace
        const { data: allUsers } = await cookiesClient.models.User.list();

        // Create lookup maps
        const kioskMap = new Map((allKiosks || []).map((k: KioskType) => [k.id, k]));
        const userMap = new Map((allUsers || []).map((u: UserType) => [u.userId, u]));

        // Format date helper
        const formatDate = (dateString: string | null | undefined): string => {
            if (!dateString) return 'Not set';
            try {
                return new Date(dateString).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                });
            } catch {
                return 'Invalid date';
            }
        };

        // Transform tickets to export format
        const exportTickets: TicketExportData[] = filteredTickets.map((ticket: TicketType) => {
            const kiosk = kioskMap.get(ticket.kioskId);
            const reporter = userMap.get(ticket.reporterId);
            const assignee = ticket.assigneeId ? userMap.get(ticket.assigneeId) : null;
            const commentsCount = Array.isArray(ticket.comments) ? ticket.comments.length : 0;

            return {
                ticketId: ticket.ticketId,
                title: ticket.title,
                description: ticket.description,
                status: ticket.status || 'OPEN',
                kioskAddress: kiosk?.address || 'Unknown kiosk',
                kioskDescription: kiosk?.description || '',
                reporterName: reporter?.name || 'Unknown user',
                assigneeName: assignee?.name || 'Unassigned',
                reportedDate: formatDate(ticket.reportedDate),
                scheduledDate: formatDate(ticket.maintenanceTime),
                updatedDate: formatDate(ticket.updatedDate),
                commentsCount
            };
        });

        return {
            tickets: exportTickets,
            workspace: { 
                id: access.workspace.id, 
                name: access.workspace.name 
            },
            totalCount,
            filteredCount: filteredTickets.length
        };

    } catch (error) {
        console.error('Error exporting tickets:', error);
        throw new Error('Failed to export tickets. Please try again.');
    }
}

/**
 * Server action to export tickets data from all accessible workspaces for CSV download
 * Fetches filtered tickets across workspaces with enhanced information for export
 */
export async function exportGlobalTicketsAction(
    userId: string,
    filters: {
        searchTerm?: string;
        status?: string;
        dateFrom?: string;
        dateTo?: string;
        assigneeId?: string;
        workspaceId?: string;
        onlyMyTickets?: boolean;
    } = {}
): Promise<{
    tickets: (TicketExportData & { workspaceName: string })[];
    workspaces: { id: string; name: string }[];
    totalCount: number;
    filteredCount: number;
}> {
    try {
        // Import here to avoid circular dependencies
        const { getAllUserAccessibleTickets } = await import('./ticket-utils');

        // Get filtered tickets across all workspaces
        const { tickets: globalTickets, workspaces } = await getAllUserAccessibleTickets(userId, {
            searchTerm: filters.searchTerm,
            status: filters.status as any,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            assigneeId: filters.assigneeId,
            workspaceId: filters.workspaceId,
            onlyMyTickets: filters.onlyMyTickets,
            useMaintenance: true
        });

        const totalCount = globalTickets.length;

        // Format date helper
        const formatDate = (dateString: string | null | undefined): string => {
            if (!dateString) return 'Not set';
            try {
                return new Date(dateString).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                });
            } catch {
                return 'Invalid date';
            }
        };

        // Transform tickets to export format with workspace information
        const exportTickets = globalTickets.map((ticket) => {
            const commentsCount = Array.isArray(ticket.comments) ? ticket.comments.length : 0;

            return {
                ticketId: ticket.ticketId,
                title: ticket.title,
                description: ticket.description,
                status: ticket.status || 'OPEN',
                workspaceName: ticket.workspaceName,
                kioskAddress: ticket.kioskAddress,
                kioskDescription: ticket.kioskDescription,
                reporterName: ticket.reporterName || 'Unknown user',
                assigneeName: ticket.assigneeName || 'Unassigned',
                reportedDate: formatDate(ticket.reportedDate),
                scheduledDate: formatDate(ticket.maintenanceTime),
                updatedDate: formatDate(ticket.updatedDate),
                commentsCount
            };
        });

        return {
            tickets: exportTickets,
            workspaces: workspaces.map(w => ({ 
                id: w.id, 
                name: w.name 
            })),
            totalCount,
            filteredCount: totalCount
        };

    } catch (error) {
        console.error('Error exporting global tickets:', error);
        throw new Error('Failed to export tickets. Please try again.');
    }
} 