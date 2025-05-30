'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type SelectedTicket, type SelectedWorkspace } from '@/lib/server/ticket-utils';
import CalendarView from '@/components/tickets/calendar-view';
import KanbanView from '@/components/tickets/kanban-view';

interface TicketsClientProps {
    tickets: SelectedTicket[];
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
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
    userRole
}: TicketsClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'kanban' | 'cards'>('list'); // Default to list view
    const router = useRouter();

    // Filter tickets based on search and status
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
                            <span>Reported: {formatDate(ticket.reportedDate)}</span>
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
            <div className="flex flex-col gap-3 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search tickets by title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-base" /* Prevent iOS zoom */
                    />
                </div>
                <div className="w-full">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
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
                            {searchTerm && ` for "${searchTerm}"`}
                            {statusFilter !== 'ALL' && ` with status "${statusFilter}"`}
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