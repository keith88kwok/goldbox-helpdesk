'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Calendar from 'react-calendar';
import { type SelectedWorkspace } from '@/lib/server/workspace-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserMenu } from '@/components/ui/user-menu';
import { 
    ArrowLeft, 
    Search, 
    Download, 
    Calendar as CalendarIcon, 
    X, 
    AlertCircle, 
    CalendarDays, 
    List, 
    Columns3, 
    Building2, 
    User, 
    Eye,
    LayoutGrid,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { 
    getCurrentMonthRange, 
    getLastMonthRange, 
    getCurrentYearRange
} from '@/lib/date-utils';
import 'react-calendar/dist/Calendar.css';

// Enhanced ticket type for global view
interface GlobalTicket {
    id: string;
    ticketId: string;
    workspaceId: string;
    kioskId: string;
    reporterId: string;
    assigneeId: string | null;
    status: string | null;
    title: string;
    description: string;
    comments: { id: string; content: string; createdAt: string; userId: string }[] | null;
    attachments: string[] | null;
    reportedDate: string;
    updatedDate: string | null;
    maintenanceTime: string | null;
    isDeleted: boolean | null;
    deletedAt: string | null;
    deletedBy: string | null;
    reporterName: string | null;
    assigneeName: string | null;
    workspaceName: string;
    kioskAddress: string;
    kioskDescription: string;
}

interface GlobalTicketsClientProps {
    tickets: GlobalTicket[];
    workspaces: SelectedWorkspace[];
    user: {
        id: string;
        email: string;
        username: string;
        name: string;
    };
    totalCount: number;
    initialFilters: {
        searchTerm?: string;
        status?: string;
        dateFrom?: string;
        dateTo?: string;
        assigneeId?: string;
        workspaceId?: string;
        onlyMyTickets?: boolean;
    };
}

// Status color mapping
const statusColors = {
    OPEN: 'bg-red-100 text-red-800 border-red-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

export default function GlobalTicketsClient({ 
    tickets, 
    workspaces, 
    user, 
    totalCount,
    initialFilters 
}: GlobalTicketsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Filter state - matching workspace tickets structure
    const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');
    const [statusFilter, setStatusFilter] = useState<string>(initialFilters.status || 'ALL');
    const [workspaceFilter, setWorkspaceFilter] = useState<string>(initialFilters.workspaceId || 'ALL');
    const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom || '');
    const [dateTo, setDateTo] = useState(initialFilters.dateTo || '');
    const [onlyMyTickets, setOnlyMyTickets] = useState(initialFilters.onlyMyTickets || false);
    const [viewMode, setViewMode] = useState<'list' | 'cards' | 'calendar' | 'kanban'>('list');
    const [showFilters, setShowFilters] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Set current month as default if no date filters are provided
    useEffect(() => {
        if (!initialFilters.dateFrom && !initialFilters.dateTo && !searchParams.get('dateFrom') && !searchParams.get('dateTo')) {
            const currentMonthRange = getCurrentMonthRange();
            setDateFrom(currentMonthRange.dateFrom);
            setDateTo(currentMonthRange.dateTo);
            setShowFilters(true); // Show filters when default is applied
        }
    }, [initialFilters.dateFrom, initialFilters.dateTo, searchParams]);

    // Update URL when filters change
    const updateURL = useCallback((newFilters: {
        searchTerm?: string;
        status?: string;
        workspaceId?: string;
        dateFrom?: string;
        dateTo?: string;
        onlyMyTickets?: boolean;
    }) => {
        const params = new URLSearchParams();
        
        if (newFilters.searchTerm) params.set('search', newFilters.searchTerm);
        if (newFilters.status && newFilters.status !== 'ALL') params.set('status', newFilters.status);
        if (newFilters.workspaceId && newFilters.workspaceId !== 'ALL') params.set('workspaceId', newFilters.workspaceId);
        if (newFilters.dateFrom) params.set('dateFrom', newFilters.dateFrom);
        if (newFilters.dateTo) params.set('dateTo', newFilters.dateTo);
        if (newFilters.onlyMyTickets) params.set('onlyMyTickets', 'true');
        
        const queryString = params.toString();
        const newURL = queryString ? `?${queryString}` : '';
        
        router.push(`/tickets${newURL}`, { scroll: false });
    }, [router]);

    // Apply filters when they change
    const handleFilterChange = (filterType: string, value: string | boolean) => {
        let newSearchTerm = searchTerm;
        let newStatusFilter = statusFilter;
        let newWorkspaceFilter = workspaceFilter;
        let newDateFrom = dateFrom;
        let newDateTo = dateTo;
        let newOnlyMyTickets = onlyMyTickets;

        switch (filterType) {
            case 'search':
                newSearchTerm = value as string;
                setSearchTerm(value as string);
                break;
            case 'status':
                newStatusFilter = value as string;
                setStatusFilter(value as string);
                break;
            case 'workspace':
                newWorkspaceFilter = value as string;
                setWorkspaceFilter(value as string);
                break;
            case 'dateFrom':
                newDateFrom = value as string;
                setDateFrom(value as string);
                break;
            case 'dateTo':
                newDateTo = value as string;
                setDateTo(value as string);
                break;
            case 'onlyMyTickets':
                newOnlyMyTickets = value as boolean;
                setOnlyMyTickets(value as boolean);
                break;
        }

        updateURL({
            searchTerm: newSearchTerm,
            status: newStatusFilter,
            workspaceId: newWorkspaceFilter,
            dateFrom: newDateFrom,
            dateTo: newDateTo,
            onlyMyTickets: newOnlyMyTickets
        });
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('ALL');
        setWorkspaceFilter('ALL');
        setDateFrom('');
        setDateTo('');
        setOnlyMyTickets(false);
        setShowFilters(false);
        
        router.push('/tickets', { scroll: false });
    };

    // Filter tickets based on current filters (client-side filtering for immediate feedback)
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
        const matchesWorkspace = workspaceFilter === 'ALL' || ticket.workspaceId === workspaceFilter;
        const matchesAssignee = !onlyMyTickets || ticket.assigneeId === user.id;
        
        return matchesSearch && matchesStatus && matchesWorkspace && matchesAssignee;
    });

    // Handle export
    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Import export function dynamically
            const { exportGlobalTicketsAction } = await import('@/lib/server/ticket-export-action');
            
            const result = await exportGlobalTicketsAction(user.id, {
                searchTerm: searchTerm || undefined,
                status: statusFilter !== 'ALL' ? statusFilter : undefined,
                workspaceId: workspaceFilter !== 'ALL' ? workspaceFilter : undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                onlyMyTickets
            });

            // Create and download CSV
            const csvContent = [
                // Header
                'Ticket ID,Title,Description,Status,Workspace,Kiosk Address,Reporter,Assignee,Reported Date,Scheduled Date,Updated Date,Comments Count',
                // Data rows
                ...result.tickets.map(ticket =>
                    [
                        ticket.ticketId,
                        `"${ticket.title.replace(/"/g, '""')}"`,
                        `"${ticket.description.replace(/"/g, '""')}"`,
                        ticket.status,
                        `"${ticket.workspaceName.replace(/"/g, '""')}"`,
                        `"${ticket.kioskAddress.replace(/"/g, '""')}"`,
                        `"${ticket.reporterName.replace(/"/g, '""')}"`,
                        `"${ticket.assigneeName.replace(/"/g, '""')}"`,
                        ticket.reportedDate,
                        ticket.scheduledDate,
                        ticket.updatedDate,
                        ticket.commentsCount
                    ].join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `global-tickets-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Multi-View Toggle Component
    const ViewToggle = () => (
        <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1 overflow-x-auto">
            <button
                onClick={() => setViewMode('list')}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap
                    ${viewMode === 'list' 
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }
                `}
            >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
            </button>
            <button
                onClick={() => setViewMode('cards')}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap
                    ${viewMode === 'cards' 
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }
                `}
            >
                <Columns3 className="h-4 w-4" />
                <span className="hidden sm:inline">Cards</span>
            </button>
            <button
                onClick={() => setViewMode('calendar')}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap
                    ${viewMode === 'calendar' 
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }
                `}
            >
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
                onClick={() => setViewMode('kanban')}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap
                    ${viewMode === 'kanban' 
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }
                `}
            >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
            </button>
        </div>
    );

    // List View Component
    const ListView = () => (
        <div className="space-y-3">
            {filteredTickets.map((ticket) => (
                <Card 
                    key={ticket.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/workspace/${ticket.workspaceId}/tickets/${ticket.id}`)}
                >
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                        {ticket.title}
                                    </h3>
                                    <Badge className={`${statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN} text-xs`}>
                                        {ticket.status}
                                    </Badge>
                                </div>
                                
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                    {ticket.description}
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        <span className="font-medium">{ticket.workspaceName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>📍</span>
                                        <span>{ticket.kioskAddress}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span>{ticket.assigneeName || 'Unassigned'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        <span>{formatDate(ticket.reportedDate)}</span>
                                    </div>
                                </div>
                            </div>
                            <Eye className="h-4 w-4 text-gray-400 ml-4 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    // Cards View Component  
    const CardsView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTickets.map((ticket) => (
                <Card 
                    key={ticket.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer h-fit"
                    onClick={() => router.push(`/workspace/${ticket.workspaceId}/tickets/${ticket.id}`)}
                >
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <Badge className={`${statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN} text-xs`}>
                                {ticket.status}
                            </Badge>
                            <span className="text-xs text-gray-500">{ticket.ticketId}</span>
                        </div>
                        <CardTitle className="text-base line-clamp-2">
                            {ticket.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                            {ticket.description}
                        </p>
                        <div className="space-y-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                <span className="font-medium truncate">{ticket.workspaceName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>📍</span>
                                <span className="truncate">{ticket.kioskAddress}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="truncate">{ticket.assigneeName || 'Unassigned'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{formatDate(ticket.reportedDate)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    // Calendar View Implementation
    const CalendarViewComponent = () => {
        const [activeStartDate, setActiveStartDate] = useState(new Date());
        const [selectedDate, setSelectedDate] = useState<Date | null>(null);

        // Group tickets by date for calendar view
        const ticketsByDate = useMemo(() => {
            const dateMap = new Map<string, GlobalTicket[]>();
            
            filteredTickets.forEach(ticket => {
                // Use maintenance date if available, otherwise use today's date for immediate attention
                const targetDate = ticket.maintenanceTime 
                    ? new Date(ticket.maintenanceTime) 
                    : new Date(); // Show on today if no maintenance date
                
                const dateKey = targetDate.toDateString();
                if (!dateMap.has(dateKey)) {
                    dateMap.set(dateKey, []);
                }
                dateMap.get(dateKey)!.push(ticket);
            });
            
            return dateMap;
        }, []);

        // Get tickets for selected date
        const selectedDateTickets = useMemo(() => {
            if (!selectedDate) return [];
            const dateKey = selectedDate.toDateString();
            return ticketsByDate.get(dateKey) || [];
        }, [selectedDate, ticketsByDate]);

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
                            className={`w-2 h-2 rounded-full ${status === 'OPEN' ? 'bg-red-500' : status === 'IN_PROGRESS' ? 'bg-yellow-500' : status === 'RESOLVED' ? 'bg-green-500' : 'bg-gray-500'}`}
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

        const formatDateLong = (date: Date) => {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const formatTime = (dateString: string) => {
            return new Date(dateString).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        return (
            <div className="space-y-6">
                {/* Calendar Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5" />
                            Global Maintenance Calendar
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
                            
                            <div className="react-calendar-container">
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
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <span className="text-gray-600">Open</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                            <span className="text-gray-600">In Progress</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span className="text-gray-600">Resolved</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                                            <span className="text-gray-600">Closed</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        <span className="font-medium">Note:</span> Today&apos;s date shows both scheduled maintenance and tickets requiring immediate attention.
                                    </div>
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
                                Tickets for {formatDateLong(selectedDate)}
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
                                            onClick={() => router.push(`/workspace/${ticket.workspaceId}/tickets/${ticket.id}`)}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge
                                                            variant="secondary"
                                                            className={`${statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN} text-xs`}
                                                        >
                                                            {ticket.status || 'OPEN'}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {ticket.workspaceName}
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
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {ticket.kioskAddress}
                                                    </p>
                                                </div>
                                            </div>
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
                                    {filteredTickets.length}
                                </div>
                                <div className="text-sm text-gray-500">Total Tickets</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-orange-600">
                                    {filteredTickets.filter(t => !t.maintenanceTime).length}
                                </div>
                                <div className="text-sm text-gray-500">Need Attention</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-red-600">
                                    {filteredTickets.filter(t => t.status === 'OPEN').length}
                                </div>
                                <div className="text-sm text-gray-500">Open</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {filteredTickets.filter(t => t.status === 'IN_PROGRESS').length}
                                </div>
                                <div className="text-sm text-gray-500">In Progress</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">
                                    {filteredTickets.filter(t => t.status === 'RESOLVED').length}
                                </div>
                                <div className="text-sm text-gray-500">Resolved</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {filteredTickets.filter(t => t.maintenanceTime).length}
                                </div>
                                <div className="text-sm text-gray-500">Scheduled</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // Kanban View Implementation
    const KanbanViewComponent = () => {
        const STATUSES = [
            { id: 'OPEN', label: 'Open', color: 'bg-red-100 border-red-200 text-red-800' },
            { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-100 border-yellow-200 text-yellow-800' },
            { id: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 border-green-200 text-green-800' },
            { id: 'CLOSED', label: 'Closed', color: 'bg-gray-100 border-gray-200 text-gray-800' },
        ] as const;

        // Group tickets by status for Kanban view
        const ticketsByStatus = useMemo(() => {
            const groups: Record<string, GlobalTicket[]> = {
                'OPEN': [],
                'IN_PROGRESS': [],
                'RESOLVED': [],
                'CLOSED': []
            };

            filteredTickets.forEach(ticket => {
                const status = ticket.status || 'OPEN';
                if (groups[status]) {
                    groups[status].push(ticket);
                } else {
                    groups.OPEN.push(ticket);
                }
            });

            return groups;
        }, []);

        return (
            <div className="space-y-6">
                {/* Kanban Board Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">
                        Global Kanban Board - {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <AlertCircle className="h-4 w-4" />
                        View only - Edit tickets in their respective workspaces
                    </div>
                </div>

                {/* Desktop Kanban Board */}
                <div className="hidden lg:grid lg:grid-cols-4 gap-6">
                    {STATUSES.map(status => {
                        const statusTickets = ticketsByStatus[status.id] || [];
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
                                <CardContent className="p-3 space-y-3 min-h-[200px]">
                                    {statusTickets.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            No {status.label.toLowerCase()} tickets
                                        </div>
                                    ) : (
                                        statusTickets.map(ticket => (
                                            <Card 
                                                key={ticket.id}
                                                className="cursor-pointer transition-all duration-200 hover:shadow-md"
                                                onClick={() => router.push(`/workspace/${ticket.workspaceId}/tickets/${ticket.id}`)}
                                            >
                                                <CardContent className="p-3 space-y-3">
                                                    {/* Card Header with Status */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <Badge
                                                            variant="secondary"
                                                            className={`${statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN} text-xs`}
                                                        >
                                                            {ticket.status || 'OPEN'}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {ticket.workspaceName}
                                                        </Badge>
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
                                                            <Building2 className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">{ticket.kioskAddress}</span>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-1">
                                                            <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">
                                                                Reported: {formatDate(ticket.reportedDate)}
                                                            </span>
                                                        </div>
                                                        
                                                        {ticket.assigneeName && (
                                                            <div className="flex items-center gap-1">
                                                                <User className="h-3 w-3 flex-shrink-0" />
                                                                <span className="truncate">{ticket.assigneeName}</span>
                                                            </div>
                                                        )}

                                                        {ticket.maintenanceTime && (
                                                            <div className="flex items-center gap-1">
                                                                <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                                                                <span className="truncate">
                                                                    Scheduled: {formatDate(ticket.maintenanceTime)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* View Button */}
                                                    <div className="pt-2 border-t border-gray-100">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/workspace/${ticket.workspaceId}/tickets/${ticket.id}`);
                                                            }}
                                                            className="w-full h-8 text-xs"
                                                        >
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            View in Workspace
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Mobile/Tablet Stacked View */}
                <div className="lg:hidden space-y-6">
                    {STATUSES.map(status => {
                        const statusTickets = ticketsByStatus[status.id] || [];
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
                                            <Card 
                                                key={ticket.id}
                                                className="cursor-pointer transition-all hover:shadow-md"
                                                onClick={() => router.push(`/workspace/${ticket.workspaceId}/tickets/${ticket.id}`)}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge
                                                            variant="secondary"
                                                            className={`${statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN} text-xs`}
                                                        >
                                                            {ticket.status || 'OPEN'}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {ticket.workspaceName}
                                                        </Badge>
                                                    </div>
                                                    <h4 className="font-medium text-sm text-gray-900 mb-1">
                                                        {ticket.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                                        {ticket.description}
                                                    </p>
                                                    <div className="text-xs text-gray-500 space-y-1">
                                                        <div>{ticket.kioskAddress}</div>
                                                        <div>{ticket.assigneeName || 'Unassigned'}</div>
                                                    </div>
                                                </CardContent>
                                            </Card>
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
                                const count = ticketsByStatus[status.id]?.length || 0;
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
        );
    };

    // Render appropriate view
    const renderView = () => {
        switch (viewMode) {
            case 'calendar':
                return <CalendarViewComponent />;
            case 'kanban':
                return <KanbanViewComponent />;
            case 'list':
                return <ListView />;
            case 'cards':
                return <CardsView />;
            default:
                return <ListView />;
        }
    };

    return (
        <div className="container mx-auto px-4 py-4 sm:py-8">
            {/* Header - matching workspace tickets style */}
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard')}
                        className="w-fit"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <UserMenu />
                </div>
                
                {/* Title */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Tickets</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        {totalCount} tickets across {workspaces.length} workspaces
                    </p>
                </div>
            </div>

            {/* Search and Filters - matching workspace tickets layout */}
            <div className="space-y-4 mb-6">
                {/* Main Filter Row */}
                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Search Bar */}
                    <div className="relative lg:w-80 xl:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search tickets by title or description..."
                            value={searchTerm}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="pl-10 text-base" /* Prevent iOS zoom */
                        />
                    </div>

                    {/* Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 lg:flex-1">
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>

                        {/* Workspace Filter */}
                        <select
                            value={workspaceFilter}
                            onChange={(e) => handleFilterChange('workspace', e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
                        >
                            <option value="ALL">All Workspaces</option>
                            {workspaces.map((workspace) => (
                                <option key={workspace.id} value={workspace.id}>
                                    {workspace.name}
                                </option>
                            ))}
                        </select>

                        {/* Date Range Inputs - Inline */}
                        <div className="flex items-center gap-2 text-sm">
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                className="text-sm w-[160px]"
                                placeholder="From date"
                            />
                            <span className="text-gray-400 hidden sm:inline">to</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                className="text-sm w-[160px]"
                                placeholder="To date"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 sm:ml-auto">
                            {/* My Tickets Toggle */}
                            <Button
                                variant={onlyMyTickets ? "primary" : "outline"}
                                size="sm"
                                onClick={() => handleFilterChange('onlyMyTickets', !onlyMyTickets)}
                                className="flex items-center gap-1 text-sm whitespace-nowrap"
                            >
                                <User className="h-3 w-3" />
                                My Tickets
                            </Button>

                            {/* Export Button */}
                            <Button
                                onClick={handleExport}
                                disabled={isExporting}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 text-sm whitespace-nowrap"
                            >
                                <Download className="h-3 w-3" />
                                {isExporting ? 'Exporting...' : 'Export'}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-1 text-sm whitespace-nowrap"
                            >
                                <CalendarIcon className="h-3 w-3" />
                                Presets
                            </Button>

                            {/* Clear Filters Button */}
                            {(searchTerm || statusFilter !== 'ALL' || workspaceFilter !== 'ALL' || dateFrom || dateTo || onlyMyTickets) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm"
                                >
                                    <X className="h-3 w-3" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Filter Indicators */}
                {(dateFrom || dateTo || searchTerm || statusFilter !== 'ALL' || workspaceFilter !== 'ALL' || onlyMyTickets) && (
                    <div className="flex flex-wrap gap-2 text-xs">
                        {searchTerm && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                Search: &quot;{searchTerm}&quot;
                            </Badge>
                        )}
                        {statusFilter !== 'ALL' && (
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                Status: {statusFilter}
                            </Badge>
                        )}
                        {workspaceFilter !== 'ALL' && (
                            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                                Workspace: {workspaces.find(w => w.id === workspaceFilter)?.name}
                            </Badge>
                        )}
                        {onlyMyTickets && (
                            <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                                My Tickets Only
                            </Badge>
                        )}
                        {(dateFrom || dateTo) && (
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                {dateFrom && dateTo
                                    ? `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`
                                    : dateFrom
                                    ? `From: ${new Date(dateFrom).toLocaleDateString()}`
                                    : `Until: ${new Date(dateTo).toLocaleDateString()}`
                                }
                            </Badge>
                        )}
                    </div>
                )}

                {/* Quick Date Presets - Collapsible */}
                {showFilters && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700">Quick Date Presets</h4>
                            <p className="text-xs text-gray-500">
                                Based on maintenance date (fallback to reported date)
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const currentMonthRange = getCurrentMonthRange();
                                    handleFilterChange('dateFrom', currentMonthRange.dateFrom);
                                    handleFilterChange('dateTo', currentMonthRange.dateTo);
                                }}
                                className="text-xs"
                            >
                                Current Month
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const lastMonthRange = getLastMonthRange();
                                    handleFilterChange('dateFrom', lastMonthRange.dateFrom);
                                    handleFilterChange('dateTo', lastMonthRange.dateTo);
                                }}
                                className="text-xs"
                            >
                                Last Month
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const currentYearRange = getCurrentYearRange();
                                    handleFilterChange('dateFrom', currentYearRange.dateFrom);
                                    handleFilterChange('dateTo', currentYearRange.dateTo);
                                }}
                                className="text-xs"
                            >
                                This Year
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    handleFilterChange('dateFrom', '');
                                    handleFilterChange('dateTo', '');
                                }}
                                className="text-xs text-gray-600"
                            >
                                Clear Dates
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {filteredTickets.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                        <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 text-center">
                            {searchTerm || statusFilter !== 'ALL' || workspaceFilter !== 'ALL' || onlyMyTickets ? 'No matching tickets' : 'No tickets found'}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 text-center mb-4 max-w-md">
                            {searchTerm || statusFilter !== 'ALL' || workspaceFilter !== 'ALL' || onlyMyTickets
                                ? 'Try adjusting your search or filters'
                                : 'No tickets have been created across your workspaces yet'
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Results Header with View Toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                        <h2 className="text-base sm:text-lg font-medium text-gray-900">
                            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} found
                        </h2>
                        <ViewToggle />
                    </div>

                    {/* View Rendering */}
                    {renderView()}
                </>
            )}

            {/* Summary */}
            {filteredTickets.length > 0 && (
                <div className="mt-6 sm:mt-8 text-center text-gray-500 px-4">
                    <p className="text-sm">
                        Showing {filteredTickets.length} of {tickets.length} tickets across {workspaces.length} workspaces
                    </p>
                </div>
            )}
        </div>
    );
} 