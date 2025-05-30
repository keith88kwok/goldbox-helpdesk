'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { type SelectedTicket, type SelectedWorkspace } from '@/lib/server/ticket-utils';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/utils/amplify-utils';
import KanbanCard from './kanban-card';
import KanbanColumn from './kanban-column';

const client = generateClient<Schema>();

interface KanbanViewProps {
    tickets: SelectedTicket[];
    workspace: SelectedWorkspace;
    canEditTickets: boolean;
}

// Status definitions for columns
const STATUSES = [
    { id: 'OPEN', label: 'Open', color: 'bg-red-100 border-red-200 text-red-800' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-100 border-yellow-200 text-yellow-800' },
    { id: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 border-green-200 text-green-800' },
    { id: 'CLOSED', label: 'Closed', color: 'bg-gray-100 border-gray-200 text-gray-800' },
] as const;

type TicketStatus = typeof STATUSES[number]['id'];

export default function KanbanView({ tickets, workspace, canEditTickets }: KanbanViewProps) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const router = useRouter();

    // Group tickets by status
    const ticketsByStatus = useMemo(() => {
        const groups: Record<TicketStatus, SelectedTicket[]> = {
            OPEN: [],
            IN_PROGRESS: [],
            RESOLVED: [],
            CLOSED: [],
        };

        tickets.forEach(ticket => {
            const status = (ticket.status || 'OPEN') as TicketStatus;
            if (groups[status]) {
                groups[status].push(ticket);
            } else {
                groups.OPEN.push(ticket);
            }
        });

        return groups;
    }, [tickets]);

    // Handle ticket move
    const handleTicketMove = async (ticketId: string, newStatus: TicketStatus) => {
        if (!canEditTickets) return;

        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket || ticket.status === newStatus) return;

        setIsUpdating(ticketId);

        try {
            await client.models.Ticket.update({
                id: ticketId,
                status: newStatus,
                updatedDate: new Date().toISOString(),
            });

            router.refresh();
        } catch (error) {
            console.error('Failed to update ticket status:', error);
        } finally {
            setIsUpdating(null);
        }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="space-y-6">
                {/* Kanban Board Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">
                        Kanban Board - {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                    </h2>
                    {!canEditTickets && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <AlertCircle className="h-4 w-4" />
                            View only - Contact admin to edit tickets
                        </div>
                    )}
                </div>

                {/* Desktop Kanban Board */}
                <div className="hidden lg:grid lg:grid-cols-4 gap-6">
                    {STATUSES.map(status => {
                        const statusTickets = ticketsByStatus[status.id];
                        return (
                            <KanbanColumn
                                key={status.id}
                                status={status}
                                tickets={statusTickets}
                                workspace={workspace}
                                canEditTickets={canEditTickets}
                                isUpdating={isUpdating}
                                formatDate={formatDate}
                                onTicketMove={handleTicketMove}
                            />
                        );
                    })}
                </div>

                {/* Mobile/Tablet Stacked View */}
                <div className="lg:hidden space-y-6">
                    {STATUSES.map(status => {
                        const statusTickets = ticketsByStatus[status.id];
                        return (
                            <Card key={status.id} className="overflow-hidden">
                                <CardHeader className={`${status.color} py-3`}>
                                    <CardTitle className="flex items-center justify-between text-sm font-medium">
                                        <span>{status.label}</span>
                                        <Badge variant="secondary" className="bg-white/50 text-current">
                                            {statusTickets.length}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 space-y-3">
                                    {statusTickets.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            No {status.label.toLowerCase()} tickets
                                        </div>
                                    ) : (
                                        statusTickets.map(ticket => (
                                            <KanbanCard
                                                key={ticket.id}
                                                ticket={ticket}
                                                workspace={workspace}
                                                canEditTickets={canEditTickets}
                                                isUpdating={isUpdating === ticket.id}
                                                formatDate={formatDate}
                                                onTicketMove={handleTicketMove}
                                            />
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Kanban Board Summary */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            {STATUSES.map(status => {
                                const count = ticketsByStatus[status.id].length;
                                return (
                                    <div key={status.id}>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {count}
                                        </div>
                                        <div className="text-sm text-gray-500">{status.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DndProvider>
    );
} 