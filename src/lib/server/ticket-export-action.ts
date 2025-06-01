'use server';

import { cookiesClient, type Schema } from '@/utils/amplify-utils';
import { TicketExportData } from '@/lib/csv-utils';
import { getWorkspaceAccess } from './workspace-utils';

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
        // Validate access to workspace
        const access = await getWorkspaceAccess(workspaceId);
        
        // Build basic filter conditions for database query
        const filterConditions: Record<string, unknown>[] = [
            { workspaceId: { eq: workspaceId } }
        ];

        // Add simple status filter if provided
        if (filters.status && filters.status !== 'ALL') {
            filterConditions.push({ status: { eq: filters.status } });
        }

        // Add assignee filter if provided
        if (filters.assigneeId) {
            filterConditions.push({ assigneeId: { eq: filters.assigneeId } });
        }

        // Get all tickets for the workspace
        const { data: tickets, errors } = await cookiesClient.models.Ticket.list({
            filter: {
                and: filterConditions
            }
        });

        if (errors) {
            throw new Error(`Failed to fetch tickets: ${errors.map((e: any) => e.message).join(', ')}`);
        }

        let filteredTickets = tickets || [];
        const totalCount = filteredTickets.length;

        // Apply date filtering with maintenance date logic
        if (filters.dateFrom || filters.dateTo) {
            filteredTickets = filteredTickets.filter((ticket: TicketType) => {
                // Use maintenanceTime if available, otherwise fall back to reportedDate
                const effectiveDate = ticket.maintenanceTime || ticket.reportedDate;
                
                if (!effectiveDate) return false;
                
                const ticketDate = new Date(effectiveDate);
                
                if (filters.dateFrom) {
                    const fromDate = new Date(filters.dateFrom);
                    if (ticketDate < fromDate) return false;
                }
                
                if (filters.dateTo) {
                    const toDate = new Date(filters.dateTo);
                    if (ticketDate > toDate) return false;
                }
                
                return true;
            });
        }

        // Apply text search if provided
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filteredTickets = filteredTickets.filter((ticket: TicketType) => 
                ticket.title.toLowerCase().includes(searchLower) ||
                ticket.description.toLowerCase().includes(searchLower)
            );
        }

        // Get unique IDs for related data
        const kioskIds = [...new Set(filteredTickets.map((t: TicketType) => t.kioskId))];
        const userIds = [...new Set([
            ...filteredTickets.map((t: TicketType) => t.reporterId),
            ...filteredTickets.map((t: TicketType) => t.assigneeId).filter(Boolean)
        ])];

        // Fetch all kiosks for the workspace (simpler approach)
        const { data: allKiosks } = await cookiesClient.models.Kiosk.list({
            filter: {
                workspaceId: { eq: workspaceId }
            }
        });

        // Fetch all users for the workspace
        const { data: allUsers } = await cookiesClient.models.User.list();

        // Create lookup maps
        const kioskMap = new Map((allKiosks || []).map((k: KioskType) => [k.kioskId, k]));
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