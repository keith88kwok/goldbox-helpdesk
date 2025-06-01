'use server';

import { revalidatePath } from 'next/cache';
import { cookiesClient } from '@/utils/amplify-utils';
import { validateWorkspaceAccess } from './workspace-utils';

// Helper function to validate and sanitize datetime input (reused from forms)
const sanitizeMaintenanceTime = (value: string): string | null => {
    // If empty or only whitespace, return null
    if (!value || value.trim() === '') {
        return null;
    }

    // Validate datetime-local format (YYYY-MM-DDTHH:MM)
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!datetimeRegex.test(value)) {
        throw new Error('Invalid maintenance time format. Please use the date picker.');
    }

    try {
        // Convert to ISO string to ensure it's a valid date
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid maintenance time. Please select a valid date and time.');
        }
        return date.toISOString();
    } catch {
        throw new Error('Invalid maintenance time. Please select a valid date and time.');
    }
};

/**
 * Update only the maintenance time for a ticket
 */
export async function updateTicketMaintenanceDateAction(
    workspaceId: string,
    ticketId: string,
    maintenanceTime: string | null
): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate workspace access (requires MEMBER or higher)
        await validateWorkspaceAccess(workspaceId, 'MEMBER');

        // Sanitize maintenance time if provided
        let sanitizedMaintenanceTime: string | null = null;
        if (maintenanceTime) {
            sanitizedMaintenanceTime = sanitizeMaintenanceTime(maintenanceTime);
        }

        // Update the ticket using the cookies client
        const { data: updatedTicket, errors } = await cookiesClient.models.Ticket.update({
            id: ticketId,
            maintenanceTime: sanitizedMaintenanceTime,
            updatedDate: new Date().toISOString(),
        });

        if (errors && errors.length > 0) {
            console.error('Failed to update ticket maintenance date:', errors);
            return {
                success: false,
                error: `Failed to update maintenance date: ${errors.map(e => e.message).join(', ')}`
            };
        }

        if (!updatedTicket) {
            return {
                success: false,
                error: 'Failed to update maintenance date: No data returned'
            };
        }

        // Revalidate the ticket detail page and tickets list
        revalidatePath(`/workspace/${workspaceId}/tickets/${ticketId}`);
        revalidatePath(`/workspace/${workspaceId}/tickets`);

        return { success: true };
    } catch (error) {
        console.error('Error updating ticket maintenance date:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update maintenance date'
        };
    }
}

/**
 * Update only the kiosk for a ticket
 */
export async function updateTicketKioskAction(
    workspaceId: string,
    ticketId: string,
    kioskId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate workspace access (requires MEMBER or higher)
        await validateWorkspaceAccess(workspaceId, 'MEMBER');

        // Validate that the new kiosk ID is provided
        if (!kioskId || kioskId.trim() === '') {
            return {
                success: false,
                error: 'Kiosk selection is required'
            };
        }

        // Update the ticket using the cookies client
        const { data: updatedTicket, errors } = await cookiesClient.models.Ticket.update({
            id: ticketId,
            kioskId: kioskId.trim(),
            updatedDate: new Date().toISOString(),
        });

        if (errors && errors.length > 0) {
            console.error('Failed to update ticket kiosk:', errors);
            return {
                success: false,
                error: `Failed to update kiosk: ${errors.map(e => e.message).join(', ')}`
            };
        }

        if (!updatedTicket) {
            return {
                success: false,
                error: 'Failed to update kiosk: No data returned'
            };
        }

        // Revalidate the ticket detail page and tickets list
        revalidatePath(`/workspace/${workspaceId}/tickets/${ticketId}`);
        revalidatePath(`/workspace/${workspaceId}/tickets`);

        return { success: true };
    } catch (error) {
        console.error('Error updating ticket kiosk:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update kiosk'
        };
    }
}

/**
 * Update only the assignee for a ticket
 */
export async function updateTicketAssigneeAction(
    workspaceId: string,
    ticketId: string,
    assigneeId: string | null
): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate workspace access (requires MEMBER or higher)
        await validateWorkspaceAccess(workspaceId, 'MEMBER');

        // Validate assignee exists if provided
        if (assigneeId && assigneeId.trim() !== '') {
            // Check if the assignee is part of the workspace
            const { data: workspaceUsers } = await cookiesClient.models.WorkspaceUser.list({
                filter: {
                    and: [
                        { workspaceId: { eq: workspaceId } },
                        { userId: { eq: assigneeId.trim() } }
                    ]
                }
            });

            if (!workspaceUsers || workspaceUsers.length === 0) {
                return {
                    success: false,
                    error: 'Selected assignee is not a member of this workspace'
                };
            }
        }

        // Update the ticket using the cookies client
        const { data: updatedTicket, errors } = await cookiesClient.models.Ticket.update({
            id: ticketId,
            assigneeId: assigneeId && assigneeId.trim() !== '' ? assigneeId.trim() : null,
            updatedDate: new Date().toISOString(),
        });

        if (errors && errors.length > 0) {
            console.error('Failed to update ticket assignee:', errors);
            return {
                success: false,
                error: `Failed to update assignee: ${errors.map(e => e.message).join(', ')}`
            };
        }

        if (!updatedTicket) {
            return {
                success: false,
                error: 'Failed to update assignee: No data returned'
            };
        }

        // Revalidate the ticket detail page and tickets list
        revalidatePath(`/workspace/${workspaceId}/tickets/${ticketId}`);
        revalidatePath(`/workspace/${workspaceId}/tickets`);

        return { success: true };
    } catch (error) {
        console.error('Error updating ticket assignee:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update assignee'
        };
    }
} 