'use client';

import { useDrag } from 'react-dnd';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Edit, Calendar, User, GripVertical, Loader2 } from 'lucide-react';
import { type SelectedTicket, type SelectedWorkspace } from '@/lib/server/ticket-utils';

interface KanbanCardProps {
    ticket: SelectedTicket;
    workspace: SelectedWorkspace;
    canEditTickets: boolean;
    isUpdating: boolean;
    formatDate: (dateString: string) => string;
    onTicketMove: (ticketId: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => void;
}

// Status color mapping
const statusColors = {
    OPEN: 'bg-red-100 text-red-800 border-red-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

export default function KanbanCard({
    ticket,
    workspace,
    canEditTickets,
    isUpdating,
    formatDate,
}: KanbanCardProps) {
    const router = useRouter();
    
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'ticket',
        item: { id: ticket.id, title: ticket.title },
        canDrag: canEditTickets && !isUpdating,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [canEditTickets, isUpdating, ticket.id, ticket.title]);

    const handleCardClick = (e: React.MouseEvent) => {
        if (isDragging || isUpdating) return;
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.closest('button')) return;
        
        router.push(`/workspace/${workspace.id}/tickets/${ticket.id}`);
    };

    return (
        <div 
            ref={drag as any} // eslint-disable-line @typescript-eslint/no-explicit-any
            className={`
                cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]
                ${isDragging ? 'opacity-50 shadow-lg border-blue-400 bg-blue-50' : ''}
                ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
                ${canEditTickets && !isUpdating ? 'cursor-grab' : ''}
            `}
            onClick={handleCardClick}
        >
            <Card>
                <CardContent className="p-3 space-y-3">
                    {/* Card Header with Status and Drag Handle */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <Badge
                                variant="secondary"
                                className={`${statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN} text-xs mb-2`}
                            >
                                {ticket.status || 'OPEN'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                            {isUpdating && (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            )}
                            {canEditTickets && !isUpdating && (
                                <GripVertical className="h-4 w-4 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* Ticket Title */}
                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight">
                        {ticket.title}
                    </h4>

                    {/* Ticket Description */}
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                        {ticket.description}
                    </p>

                    {/* Ticket Meta Information */}
                    <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                                Reported: {formatDate(ticket.reportedDate)}
                            </span>
                        </div>
                        
                        {ticket.assigneeName && (
                            <div className="flex items-center gap-1">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span>{ticket.assigneeName}</span>
                            </div>
                        )}

                        {ticket.maintenanceTime && (
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                    Scheduled: {formatDate(ticket.maintenanceTime)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {canEditTickets && (
                        <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/workspace/${workspace.id}/tickets/${ticket.id}`);
                                }}
                                className="flex-1 h-8 text-xs"
                                disabled={isUpdating}
                            >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/workspace/${workspace.id}/tickets/${ticket.id}/edit`);
                                }}
                                className="flex-1 h-8 text-xs"
                                disabled={isUpdating}
                            >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 