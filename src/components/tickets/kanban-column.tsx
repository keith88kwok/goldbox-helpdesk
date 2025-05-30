'use client';

import { useDrop } from 'react-dnd';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type SelectedTicket, type SelectedWorkspace } from '@/lib/server/ticket-utils';
import KanbanCard from './kanban-card';

interface StatusDefinition {
    id: string;
    label: string;
    color: string;
}

interface KanbanColumnProps {
    status: StatusDefinition;
    tickets: SelectedTicket[];
    workspace: SelectedWorkspace;
    canEditTickets: boolean;
    isUpdating: string | null;
    formatDate: (dateString: string) => string;
    onTicketMove: (ticketId: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => void;
}

export default function KanbanColumn({
    status,
    tickets,
    workspace,
    canEditTickets,
    isUpdating,
    formatDate,
    onTicketMove
}: KanbanColumnProps) {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'ticket',
        drop: (item: { id: string; title: string }) => {
            onTicketMove(item.id, status.id as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED');
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }), [status.id, onTicketMove]);

    return (
        <Card 
            ref={drop as any} // eslint-disable-line @typescript-eslint/no-explicit-any
            className={`h-fit transition-all duration-200 ${
                isOver ? 'border-blue-400 shadow-lg bg-blue-50' : ''
            }`}
        >
            <CardHeader className={`${status.color} py-3`}>
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                    <span>{status.label}</span>
                    <Badge variant="secondary" className="bg-white/50 text-current">
                        {tickets.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3 min-h-[200px]">
                {tickets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        {canEditTickets ? (
                            <>Drop tickets here or<br />no {status.label.toLowerCase()} tickets</>
                        ) : (
                            <>No {status.label.toLowerCase()} tickets</>
                        )}
                    </div>
                ) : (
                    tickets.map(ticket => (
                        <KanbanCard
                            key={ticket.id}
                            ticket={ticket}
                            workspace={workspace}
                            canEditTickets={canEditTickets}
                            isUpdating={isUpdating === ticket.id}
                            formatDate={formatDate}
                            onTicketMove={onTicketMove}
                        />
                    ))
                )}
            </CardContent>
        </Card>
    );
} 