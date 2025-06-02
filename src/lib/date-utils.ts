/**
 * Centralized date utilities for consistent date handling across the application
 * Handles timezone-aware date formatting and range calculations
 */

/**
 * Format a date to YYYY-MM-DD format (local date, no timezone conversion)
 */
export function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Create a date range for the current month
 */
export function getCurrentMonthRange(): { dateFrom: string; dateTo: string } {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
        dateFrom: formatLocalDate(firstDay),
        dateTo: formatLocalDate(lastDay)
    };
}

/**
 * Create a date range for the previous month
 */
export function getLastMonthRange(): { dateFrom: string; dateTo: string } {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return {
        dateFrom: formatLocalDate(firstDay),
        dateTo: formatLocalDate(lastDay)
    };
}

/**
 * Create a date range for the current year
 */
export function getCurrentYearRange(): { dateFrom: string; dateTo: string } {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31);
    
    return {
        dateFrom: formatLocalDate(firstDay),
        dateTo: formatLocalDate(lastDay)
    };
}

/**
 * Convert a date string to end-of-day timestamp for inclusive filtering
 * Input: "2024-01-15" -> Output: "2024-01-15T23:59:59.999Z"
 */
export function toEndOfDay(dateString: string): string {
    if (!dateString) return dateString;
    
    // If already has time component, return as is
    if (dateString.includes('T')) {
        return dateString;
    }
    
    // Add end of day time component
    return `${dateString}T23:59:59.999Z`;
}

/**
 * Convert a date string to start-of-day timestamp for inclusive filtering
 * Input: "2024-01-15" -> Output: "2024-01-15T00:00:00.000Z"
 */
export function toStartOfDay(dateString: string): string {
    if (!dateString) return dateString;
    
    // If already has time component, return as is
    if (dateString.includes('T')) {
        return dateString;
    }
    
    // Add start of day time component
    return `${dateString}T00:00:00.000Z`;
}

/**
 * Get the effective date for ticket filtering
 * Uses maintenanceTime if available, otherwise falls back to reportedDate
 */
export function getEffectiveTicketDate(ticket: {
    maintenanceTime: string | null;
    reportedDate: string;
}): string {
    return ticket.maintenanceTime || ticket.reportedDate;
}

/**
 * Check if a ticket falls within a date range using effective date logic
 */
export function isTicketInDateRange(
    ticket: { maintenanceTime: string | null; reportedDate: string },
    dateFrom?: string,
    dateTo?: string
): boolean {
    const effectiveDate = getEffectiveTicketDate(ticket);
    
    if (!effectiveDate) return false;
    
    const ticketDate = new Date(effectiveDate);
    
    if (dateFrom) {
        const fromDate = new Date(toStartOfDay(dateFrom));
        if (ticketDate < fromDate) return false;
    }
    
    if (dateTo) {
        const toDate = new Date(toEndOfDay(dateTo));
        if (ticketDate > toDate) return false;
    }
    
    return true;
}

/**
 * Normalize date range for server-side filtering
 * Ensures consistent handling of date boundaries
 */
export function normalizeDateRange(dateFrom?: string, dateTo?: string): {
    dateFrom?: string;
    dateTo?: string;
} {
    return {
        dateFrom: dateFrom ? toStartOfDay(dateFrom) : undefined,
        dateTo: dateTo ? toEndOfDay(dateTo) : undefined
    };
} 