import { cookiesClient } from '@/utils/amplify-utils';
import { validateWorkspaceAccess } from './workspace-utils';

// Type for maintenance record data
export type MaintenanceRecord = {
    id: string;
    ticketId: string;
    title: string;
    status: string | null;
    description: string;
    reportedDate: string;
    updatedDate: string | null;
    maintenanceTime: string | null;
    assigneeId: string | null;
    reporterId: string;
};

/**
 * Get maintenance records (tickets) for a specific kiosk
 * Returns tickets associated with the kiosk, sorted by most recent first
 */
export async function getKioskMaintenanceRecords(
    workspaceId: string,
    kioskId: string
): Promise<MaintenanceRecord[]> {
    // Validate workspace access (requires at least VIEWER role)
    await validateWorkspaceAccess(workspaceId, 'VIEWER');

    try {
        // Fetch tickets for this specific kiosk
        const { data: tickets, errors } = await cookiesClient.models.Ticket.list({
            filter: {
                and: [
                    { workspaceId: { eq: workspaceId } },
                    { kioskId: { eq: kioskId } }
                ]
            }
        });

        if (errors && errors.length > 0) {
            console.error('Error fetching kiosk maintenance records:', errors);
            throw new Error(`Failed to fetch maintenance records: ${errors.map(e => e.message).join(', ')}`);
        }

        if (!tickets) {
            return [];
        }

        // Transform and sort tickets
        const maintenanceRecords: MaintenanceRecord[] = tickets
            .map(ticket => ({
                id: ticket.id,
                ticketId: ticket.ticketId,
                title: ticket.title,
                status: ticket.status,
                description: ticket.description,
                reportedDate: ticket.reportedDate,
                updatedDate: ticket.updatedDate,
                maintenanceTime: ticket.maintenanceTime,
                assigneeId: ticket.assigneeId,
                reporterId: ticket.reporterId,
            }))
            .sort((a, b) => {
                // Sort by most recent first (using reportedDate)
                return new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime();
            });

        return maintenanceRecords;
    } catch (error) {
        console.error('Error in getKioskMaintenanceRecords:', error);
        throw error;
    }
}

/**
 * Get maintenance records summary for a kiosk
 * Returns counts and statistics about maintenance records
 */
export async function getKioskMaintenanceSummary(
    workspaceId: string,
    kioskId: string
): Promise<{
    totalRecords: number;
    openRecords: number;
    inProgressRecords: number;
    resolvedRecords: number;
    closedRecords: number;
    lastMaintenanceDate: string | null;
}> {
    const records = await getKioskMaintenanceRecords(workspaceId, kioskId);

    const summary = {
        totalRecords: records.length,
        openRecords: records.filter(r => r.status === 'OPEN').length,
        inProgressRecords: records.filter(r => r.status === 'IN_PROGRESS').length,
        resolvedRecords: records.filter(r => r.status === 'RESOLVED').length,
        closedRecords: records.filter(r => r.status === 'CLOSED').length,
        lastMaintenanceDate: records.length > 0 ? records[0].reportedDate : null,
    };

    return summary;
} 