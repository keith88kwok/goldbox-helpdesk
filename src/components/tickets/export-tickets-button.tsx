'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadTicketsCSV, type TicketExportOptions } from '@/lib/csv-utils';
import { exportTicketsAction } from '@/lib/server/ticket-export-action';

interface ExportTicketsButtonProps {
    workspaceId: string;
    workspaceName: string;
    filters: {
        searchTerm?: string;
        status?: string;
        dateFrom?: string;
        dateTo?: string;
        assigneeId?: string;
    };
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
    totalCount: number;
    filteredCount: number;
    className?: string;
}

export function ExportTicketsButton({
    workspaceId,
    workspaceName,
    filters,
    userRole,
    totalCount,
    filteredCount,
    className = ''
}: ExportTicketsButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    // Only show export button for ADMIN and MEMBER roles
    const canExport = userRole === 'ADMIN' || userRole === 'MEMBER';

    if (!canExport) {
        return null;
    }

    const handleExport = async () => {
        try {
            setIsExporting(true);

            // Call server action to get export data
            const result = await exportTicketsAction(workspaceId, filters);

            // Prepare export options
            const exportOptions: TicketExportOptions = {
                workspaceName,
                dateRange: {
                    from: filters.dateFrom,
                    to: filters.dateTo
                },
                totalCount: result.totalCount,
                filteredCount: result.filteredCount
            };

            // Trigger CSV download
            downloadTicketsCSV(result.tickets, exportOptions);

            // Optional: Show success feedback
            // Could add a toast notification here if available

        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export tickets. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center gap-1 text-sm whitespace-nowrap ${className}`}
        >
            <Download className={`h-3 w-3 ${isExporting ? 'animate-pulse' : ''}`} />
            {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
    );
} 