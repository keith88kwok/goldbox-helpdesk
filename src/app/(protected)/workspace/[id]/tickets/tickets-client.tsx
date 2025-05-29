'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, AlertCircle, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type SelectedTicket, type SelectedWorkspace } from '@/lib/server/ticket-utils';

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

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
                    <p className="text-gray-600 mt-1">Manage maintenance tickets for {workspace.name}</p>
                </div>
                {canCreateTicket && (
                    <Link href={`/workspace/${workspace.id}/tickets/new`}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Ticket
                        </Button>
                    </Link>
                )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search tickets by title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
            </div>

            {/* Tickets Grid */}
            {filteredTickets.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchTerm || statusFilter !== 'ALL' ? 'No matching tickets' : 'No tickets found'}
                        </h3>
                        <p className="text-gray-500 text-center mb-4">
                            {searchTerm || statusFilter !== 'ALL'
                                ? 'Try adjusting your search or filters'
                                : 'Get started by creating your first maintenance ticket'
                            }
                        </p>
                        {canCreateTicket && !searchTerm && statusFilter === 'ALL' && (
                            <Link href={`/workspace/${workspace.id}/tickets/new`}>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create First Ticket
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTickets.map((ticket) => (
                        <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <Badge
                                            variant="secondary"
                                            className={`${statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN} mb-2`}
                                        >
                                            {ticket.status || 'OPEN'}
                                        </Badge>
                                        <h3 className="font-semibold text-lg line-clamp-2">
                                            {ticket.title}
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <Link
                                            href={`/workspace/${workspace.id}/tickets/${ticket.id}`}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            View
                                        </Link>
                                        {(userRole === 'ADMIN' || userRole === 'MEMBER') && (
                                            <div className="mt-1">
                                                <Link
                                                    href={`/workspace/${workspace.id}/tickets/${ticket.id}/edit`}
                                                    className="text-gray-600 hover:text-gray-800 text-sm"
                                                >
                                                    Edit
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                    {ticket.description}
                                </p>

                                <div className="space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Reported: {formatDate(ticket.reportedDate)}</span>
                                    </div>

                                    {ticket.assigneeId && (
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            <span>Assigned</span>
                                        </div>
                                    )}

                                    {ticket.updatedDate && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>Updated: {formatDate(ticket.updatedDate)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t">
                                    <Link
                                        href={`/workspace/${workspace.id}/tickets/${ticket.id}`}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        View Details →
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Summary */}
            <div className="mt-8 text-center text-gray-500">
                <p>
                    Showing {filteredTickets.length} of {tickets.length} tickets
                </p>
            </div>
        </div>
    );
} 