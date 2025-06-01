'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    Plus, 
    Search, 
    AlertCircle, 
    Calendar, 
    User, 
    ArrowLeft,
    Grid3X3,
    List,
    Columns3,
    CalendarDays,
    Edit,
    Eye,
    Filter,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type SelectedTicket, type SelectedWorkspace } from '@/lib/server/ticket-utils';
import CalendarView from '@/components/tickets/calendar-view';
import KanbanView from '@/components/tickets/kanban-view';
import { ExportTicketsButton } from '@/components/tickets/export-tickets-button';

interface TicketsClientProps {
    tickets: SelectedTicket[];
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
    initialFilters?: {
        searchTerm?: string;
        status?: string;
        dateFrom?: string;
        dateTo?: string;
        assigneeId?: string;
    };
}

// Status color mapping
const statusColors = {
    OPEN: 'bg-red-100 text-red-800 border-red-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

export default function TicketsClient({
    tickets,
    workspace,
    userRole,
    initialFilters = {}
}: TicketsClientProps) {
    const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');
    const [statusFilter, setStatusFilter] = useState<string>(initialFilters.status || 'ALL');
    const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom || '');
    const [dateTo, setDateTo] = useState(initialFilters.dateTo || '');
    const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'kanban' | 'cards'>('list');
    const [showFilters, setShowFilters] = useState(false);
    
    const router = useRouter();
    const searchParams = useSearchParams();

    // Set current month as default if no date filters are provided
    useEffect(() => {
        if (!initialFilters.dateFrom && !initialFilters.dateTo && !searchParams.get('dateFrom') && !searchParams.get('dateTo')) {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            // Format dates properly without timezone conversion
            const formatLocalDate = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
            setDateFrom(formatLocalDate(firstDay));
            setDateTo(formatLocalDate(lastDay));
            setShowFilters(true); // Show filters when default is applied
        }
    }, [initialFilters.dateFrom, initialFilters.dateTo, searchParams]);

    // Update URL when filters change
    const updateURL = (newFilters: {
        searchTerm?: string;
        status?: string;
        dateFrom?: string;
        dateTo?: string;
    }) => {
        const params = new URLSearchParams();
        
        if (newFilters.searchTerm) params.set('search', newFilters.searchTerm);
        if (newFilters.status && newFilters.status !== 'ALL') params.set('status', newFilters.status);
        if (newFilters.dateFrom) params.set('dateFrom', newFilters.dateFrom);
        if (newFilters.dateTo) params.set('dateTo', newFilters.dateTo);
        
        const queryString = params.toString();
        const newURL = queryString ? `?${queryString}` : '';
        
        router.push(`/workspace/${workspace.id}/tickets${newURL}`, { scroll: false });
    };

    // Apply filters when they change
    const handleFilterChange = (filterType: string, value: string) => {
        let newSearchTerm = searchTerm;
        let newStatusFilter = statusFilter;
        let newDateFrom = dateFrom;
        let newDateTo = dateTo;

        switch (filterType) {
            case 'search':
                newSearchTerm = value;
                setSearchTerm(value);
                break;
            case 'status':
                newStatusFilter = value;
                setStatusFilter(value);
                break;
            case 'dateFrom':
                newDateFrom = value;
                setDateFrom(value);
                break;
            case 'dateTo':
                newDateTo = value;
                setDateTo(value);
                break;
        }

        updateURL({
            searchTerm: newSearchTerm,
            status: newStatusFilter,
            dateFrom: newDateFrom,
            dateTo: newDateTo
        });
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('ALL');
        setDateFrom('');
        setDateTo('');
        setShowFilters(false);
        
        router.push(`/workspace/${workspace.id}/tickets`, { scroll: false });
    };

    // Filter tickets based on search and status (client-side filtering for immediate feedback)
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const canCreateTicket = userRole === 'ADMIN' || userRole === 'MEMBER';
    const canEditTickets = userRole === 'ADMIN' || userRole === 'MEMBER';

    // Multi-View Toggle Component
    const ViewToggle = () => (
        <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1 overflow-x-auto">
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
                onClick={() => setViewMode('kanban')}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap
                    ${viewMode === 'kanban' 
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }
                `}
            >
                <Columns3 className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
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
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline">Cards</span>
            </button>
        </div>
    );

    // List View Component
    const ListView = () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ticket
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reported
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Scheduled
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Assignee
                            </th>
                            {canEditTickets && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTickets.map((ticket) => (
                            <tr
                                key={ticket.id}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => router.push(`/workspace/${workspace.id}/tickets/${ticket.id}`)}
                            >
                                <td className="px-6 py-4">
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                            {ticket.title}
                                        </div>
                                        <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                                            {ticket.description}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge
                                        variant="secondary"
                                        className={`${statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN} text-xs`}
                                    >
                                        {ticket.status || 'OPEN'}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">
                                        {formatDate(ticket.reportedDate)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm">
                                        {ticket.maintenanceTime ? (
                                            <span className="text-blue-600 font-medium">
                                                {formatDate(ticket.maintenanceTime)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">
                                                Not scheduled
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">
                                        {ticket.assigneeId ? 'Assigned' : 'Unassigned'}
                                    </div>
                                </td>
                                {canEditTickets && (
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
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
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                    <div
                        key={ticket.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/workspace/${workspace.id}/tickets/${ticket.id}`)}
                    >
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                    {ticket.title}
                                </div>
                                <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                                    {ticket.description}
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <Badge
                                    variant="secondary"
                                    className={`${statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN} text-xs`}
                                >
                                    {ticket.status || 'OPEN'}
                                </Badge>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <div className="flex flex-col gap-1">
                                <span>Reported: {formatDate(ticket.reportedDate)}</span>
                                {ticket.maintenanceTime && (
                                    <span className="text-blue-600 font-medium">
                                        Scheduled: {formatDate(ticket.maintenanceTime)}
                                    </span>
                                )}
                            </div>
                            <span>{ticket.assigneeId ? 'Assigned' : 'Unassigned'}</span>
                        </div>
                        
                        {canEditTickets && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/workspace/${workspace.id}/tickets/${ticket.id}`);
                                    }}
                                    className="flex-1 min-h-[44px] flex items-center justify-center gap-1"
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
                                    className="flex-1 min-h-[44px] flex items-center justify-center gap-1"
                                >
                                    <Edit className="h-3 w-3" />
                                    Edit
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    // Cards View Component (existing implementation)
    const CardsView = () => (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-lg transition-all active:scale-[0.98]">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <Badge
                                    variant="secondary"
                                    className={`${statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN} mb-2 text-xs`}
                                >
                                    {ticket.status || 'OPEN'}
                                </Badge>
                                <h3 className="font-semibold text-base sm:text-lg line-clamp-2">
                                    {ticket.title}
                                </h3>
                            </div>
                            <div className="flex flex-col gap-1 flex-shrink-0">
                                <Link
                                    href={`/workspace/${workspace.id}/tickets/${ticket.id}`}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium min-h-[44px] flex items-center justify-center px-2"
                                >
                                    View
                                </Link>
                                {canEditTickets && (
                                    <Link
                                        href={`/workspace/${workspace.id}/tickets/${ticket.id}/edit`}
                                        className="text-gray-600 hover:text-gray-800 text-sm min-h-[44px] flex items-center justify-center px-2"
                                    >
                                        Edit
                                    </Link>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {ticket.description}
                        </p>

                        <div className="space-y-2 text-xs sm:text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">Reported: {formatDate(ticket.reportedDate)}</span>
                            </div>

                            {ticket.assigneeId && (
                                <div className="flex items-center gap-2">
                                    <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                    <span>Assigned</span>
                                </div>
                            )}

                            {ticket.updatedDate && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                    <span className="truncate">Updated: {formatDate(ticket.updatedDate)}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t">
                            <Link
                                href={`/workspace/${workspace.id}/tickets/${ticket.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium min-h-[44px] flex items-center"
                            >
                                View Details →
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    // Calendar View Component
    const CalendarViewComponent = () => (
        <CalendarView 
            tickets={filteredTickets}
            workspace={workspace}
            canEditTickets={canEditTickets}
        />
    );

    // Kanban View Component
    const KanbanViewComponent = () => (
        <KanbanView 
            tickets={filteredTickets}
            workspace={workspace}
            canEditTickets={canEditTickets}
        />
    );

    // Render appropriate view
    const renderView = () => {
        switch (viewMode) {
            case 'calendar':
                return <CalendarViewComponent />;
            case 'list':
                return <ListView />;
            case 'kanban':
                return <KanbanViewComponent />;
            case 'cards':
                return <CardsView />;
            default:
                return <ListView />;
        }
    };

    return (
        <div className="container mx-auto px-4 py-4 sm:py-8">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                {/* Navigation */}
                <div className="flex items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/workspace/${workspace.id}/dashboard`)}
                        className="w-fit"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>
                
                {/* Title and Create Button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tickets</h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage maintenance tickets for {workspace.name}</p>
                    </div>
                    {canCreateTicket && (
                        <Link href={`/workspace/${workspace.id}/tickets/new`} className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Ticket
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Search and Filters */}
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
                            <ExportTicketsButton
                                workspaceId={workspace.id}
                                workspaceName={workspace.name}
                                filters={{
                                    searchTerm,
                                    status: statusFilter,
                                    dateFrom,
                                    dateTo
                                }}
                                userRole={userRole}
                                totalCount={tickets.length}
                                filteredCount={filteredTickets.length}
                            />

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-1 text-sm whitespace-nowrap"
                            >
                                <Calendar className="h-3 w-3" />
                                Presets
                            </Button>

                            {/* Clear Filters Button */}
                            {(searchTerm || statusFilter !== 'ALL' || dateFrom || dateTo) && (
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
                {(dateFrom || dateTo || searchTerm || statusFilter !== 'ALL') && (
                    <div className="flex flex-wrap gap-2 text-xs">
                        {searchTerm && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                Search: "{searchTerm}"
                            </Badge>
                        )}
                        {statusFilter !== 'ALL' && (
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                Status: {statusFilter}
                            </Badge>
                        )}
                        {(dateFrom || dateTo) && (
                            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
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
                                    const now = new Date();
                                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                                    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                                    
                                    const formatLocalDate = (date: Date) => {
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        return `${year}-${month}-${day}`;
                                    };
                                    
                                    handleFilterChange('dateFrom', formatLocalDate(firstDay));
                                    handleFilterChange('dateTo', formatLocalDate(lastDay));
                                }}
                                className="text-xs"
                            >
                                Current Month
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const now = new Date();
                                    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                                    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
                                    
                                    const formatLocalDate = (date: Date) => {
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        return `${year}-${month}-${day}`;
                                    };
                                    
                                    handleFilterChange('dateFrom', formatLocalDate(firstDay));
                                    handleFilterChange('dateTo', formatLocalDate(lastDay));
                                }}
                                className="text-xs"
                            >
                                Last Month
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const now = new Date();
                                    const firstDay = new Date(now.getFullYear(), 0, 1);
                                    const lastDay = new Date(now.getFullYear(), 11, 31);
                                    
                                    const formatLocalDate = (date: Date) => {
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        return `${year}-${month}-${day}`;
                                    };
                                    
                                    handleFilterChange('dateFrom', formatLocalDate(firstDay));
                                    handleFilterChange('dateTo', formatLocalDate(lastDay));
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
                            {searchTerm || statusFilter !== 'ALL' ? 'No matching tickets' : 'No tickets found'}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 text-center mb-4 max-w-md">
                            {searchTerm || statusFilter !== 'ALL'
                                ? 'Try adjusting your search or filters'
                                : 'Get started by creating your first maintenance ticket'
                            }
                        </p>
                        {canCreateTicket && !searchTerm && statusFilter === 'ALL' && (
                            <Link href={`/workspace/${workspace.id}/tickets/new`} className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create First Ticket
                                </Button>
                            </Link>
                        )}
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
                        Showing {filteredTickets.length} of {tickets.length} tickets
                    </p>
                </div>
            )}
        </div>
    );
} 