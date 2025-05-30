'use client';

import { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CalendarDays, Eye, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type SelectedTicket, type SelectedWorkspace } from '@/lib/server/ticket-utils';
import 'react-calendar/dist/Calendar.css';

interface CalendarViewProps {
    tickets: SelectedTicket[];
    workspace: SelectedWorkspace;
    canEditTickets: boolean;
}

// Status color mapping for calendar indicators
const statusColors = {
    OPEN: 'bg-red-500',
    IN_PROGRESS: 'bg-yellow-500', 
    RESOLVED: 'bg-green-500',
    CLOSED: 'bg-gray-500',
} as const;

// Status colors for ticket cards
const statusCardColors = {
    OPEN: 'bg-red-100 text-red-800 border-red-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

export default function CalendarView({ tickets, workspace, canEditTickets }: CalendarViewProps) {
    const [activeStartDate, setActiveStartDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const router = useRouter();

    // Map tickets to dates for calendar indicators
    const ticketsByDate = useMemo(() => {
        const dateMap = new Map<string, SelectedTicket[]>();
        const today = new Date();
        
        tickets.forEach(ticket => {
            // Use maintenanceTime if available, otherwise use today's date
            const dateToUse = ticket.maintenanceTime || today.toISOString();
            const dateKey = new Date(dateToUse).toDateString();
            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, []);
            }
            dateMap.get(dateKey)!.push(ticket);
        });
        
        return dateMap;
    }, [tickets]);

    // Get tickets for selected date
    const selectedDateTickets = useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = selectedDate.toDateString();
        return ticketsByDate.get(dateKey) || [];
    }, [selectedDate, ticketsByDate]);

    // Format date for display
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format time for ticket display
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Custom tile content to show ticket indicators
    const tileContent = ({ date }: { date: Date }) => {
        const dateKey = date.toDateString();
        const dateTickets = ticketsByDate.get(dateKey);
        
        if (!dateTickets || dateTickets.length === 0) {
            return null;
        }

        // Count tickets by status
        const statusCounts = dateTickets.reduce((acc, ticket) => {
            const status = (ticket.status as keyof typeof statusColors) || 'OPEN';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<keyof typeof statusColors, number>);

        return (
            <div className="flex flex-wrap gap-1 mt-1 justify-center">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <div
                        key={status}
                        className={`w-2 h-2 rounded-full ${statusColors[status as keyof typeof statusColors]}`}
                        title={`${count} ${status.toLowerCase()} ticket${count > 1 ? 's' : ''}`}
                    />
                ))}
                {dateTickets.length > 4 && (
                    <div 
                        className="text-xs text-gray-600 font-bold"
                        title={`${dateTickets.length} total tickets`}
                    >
                        +{dateTickets.length - 4}
                    </div>
                )}
            </div>
        );
    };

    // Custom tile class names for styling
    const tileClassName = ({ date }: { date: Date }) => {
        const dateKey = date.toDateString();
        const dateTickets = ticketsByDate.get(dateKey);
        const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
        
        let className = '';
        
        if (dateTickets && dateTickets.length > 0) {
            className += ' has-tickets';
        }
        
        if (isSelected) {
            className += ' selected-date';
        }
        
        return className;
    };

    return (
        <div className="space-y-6">
            {/* Calendar Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Maintenance Calendar
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                        Tickets with scheduled maintenance dates appear on their scheduled dates. 
                        Tickets without scheduled maintenance appear on today&apos;s date for immediate attention.
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="calendar-container">
                        <style jsx global>{`
                            .react-calendar {
                                width: 100%;
                                background: white;
                                border: 1px solid #e5e7eb;
                                border-radius: 0.5rem;
                                font-family: inherit;
                            }
                            
                            .react-calendar__navigation {
                                height: 44px;
                                margin-bottom: 1rem;
                                border-bottom: 1px solid #e5e7eb;
                                background: #f9fafb;
                                border-radius: 0.5rem 0.5rem 0 0;
                            }
                            
                            .react-calendar__navigation button {
                                color: #374151;
                                font-weight: 500;
                                font-size: 1rem;
                                background: none;
                                border: none;
                                padding: 0.5rem;
                                margin: 0.25rem;
                                border-radius: 0.375rem;
                                min-height: 44px;
                            }
                            
                            .react-calendar__navigation button:hover {
                                background: #e5e7eb;
                            }
                            
                            .react-calendar__month-view__weekdays {
                                text-align: center;
                                font-weight: 600;
                                font-size: 0.875rem;
                                color: #6b7280;
                                margin-bottom: 0.5rem;
                            }
                            
                            .react-calendar__month-view__weekdays__weekday {
                                padding: 0.5rem;
                            }
                            
                            .react-calendar__tile {
                                background: none;
                                border: none;
                                color: #374151;
                                font-size: 0.875rem;
                                padding: 0.5rem;
                                min-height: 60px;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: flex-start;
                                position: relative;
                                border-radius: 0.375rem;
                                margin: 1px;
                            }
                            
                            .react-calendar__tile:hover {
                                background: #f3f4f6;
                            }
                            
                            .react-calendar__tile.has-tickets {
                                background: #fef3c7;
                                border: 1px solid #f59e0b;
                            }
                            
                            .react-calendar__tile.has-tickets:hover {
                                background: #fed7aa;
                            }
                            
                            .react-calendar__tile.selected-date {
                                background: #dbeafe !important;
                                border: 2px solid #3b82f6 !important;
                            }
                            
                            .react-calendar__tile--now {
                                background: #eff6ff;
                                border: 1px solid #60a5fa;
                            }
                            
                            .react-calendar__tile--now.has-tickets {
                                background: #fbbf24;
                                border: 2px solid #d97706;
                            }
                            
                            @media (max-width: 768px) {
                                .react-calendar__tile {
                                    min-height: 50px;
                                    font-size: 0.75rem;
                                }
                                
                                .react-calendar__navigation button {
                                    font-size: 0.875rem;
                                }
                            }
                        `}</style>
                        
                        <Calendar
                            activeStartDate={activeStartDate}
                            onActiveStartDateChange={({ activeStartDate }) => {
                                if (activeStartDate) setActiveStartDate(activeStartDate);
                            }}
                            onClickDay={(date) => setSelectedDate(date)}
                            tileContent={tileContent}
                            tileClassName={tileClassName}
                            showNeighboringMonth={false}
                            navigationLabel={({ date }) => 
                                date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            }
                            prevLabel={<ChevronLeft className="h-4 w-4" />}
                            nextLabel={<ChevronRight className="h-4 w-4" />}
                            prev2Label={null}
                            next2Label={null}
                        />
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                <span className="font-medium text-gray-700">Status indicators:</span>
                                {Object.entries(statusColors).map(([status, color]) => (
                                    <div key={status} className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                        <span className="text-gray-600 capitalize">
                                            {status.toLowerCase().replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="text-xs text-gray-500">
                                <span className="font-medium">Note:</span> Today&apos;s date shows both scheduled maintenance and tickets requiring immediate attention.
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Selected Date Details */}
            {selectedDate && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Tickets for {formatDate(selectedDate)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedDateTickets.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                                No tickets scheduled for this date
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {selectedDateTickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/workspace/${workspace.id}/tickets/${ticket.id}`)}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge
                                                        variant="secondary"
                                                        className={`${statusCardColors[ticket.status as keyof typeof statusCardColors] || statusCardColors.OPEN} text-xs`}
                                                    >
                                                        {ticket.status || 'OPEN'}
                                                    </Badge>
                                                    {ticket.maintenanceTime ? (
                                                        <span className="text-sm text-gray-500">
                                                            Scheduled: {formatTime(ticket.maintenanceTime)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                            Needs Attention
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="font-medium text-gray-900 line-clamp-1">
                                                    {ticket.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                                    {ticket.description}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {canEditTickets && (
                                            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/workspace/${workspace.id}/tickets/${ticket.id}`);
                                                    }}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/workspace/${workspace.id}/tickets/${ticket.id}/edit`);
                                                    }}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                    Edit
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Calendar Summary */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-gray-900">
                                {tickets.length}
                            </div>
                            <div className="text-sm text-gray-500">Total Tickets</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-orange-600">
                                {tickets.filter(t => !t.maintenanceTime).length}
                            </div>
                            <div className="text-sm text-gray-500">Need Attention</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">
                                {tickets.filter(t => t.status === 'OPEN').length}
                            </div>
                            <div className="text-sm text-gray-500">Open</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-600">
                                {tickets.filter(t => t.status === 'IN_PROGRESS').length}
                            </div>
                            <div className="text-sm text-gray-500">In Progress</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">
                                {tickets.filter(t => t.status === 'RESOLVED').length}
                            </div>
                            <div className="text-sm text-gray-500">Resolved</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-600">
                                {tickets.filter(t => t.maintenanceTime).length}
                            </div>
                            <div className="text-sm text-gray-500">Scheduled</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 