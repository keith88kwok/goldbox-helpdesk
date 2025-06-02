'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TicketCheck, Clock, AlertCircle, Activity, ArrowRight, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type GlobalDashboardStats } from '@/lib/server/dashboard-utils';

interface GlobalStatsProps {
    stats: GlobalDashboardStats;
}

export default function GlobalStats({ stats }: GlobalStatsProps) {
    const router = useRouter();

    const handleViewAllTickets = () => {
        router.push('/tickets');
    };

    const handleViewWorkspace = (workspaceId: string) => {
        router.push(`/workspace/${workspaceId}/dashboard`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN':
                return 'bg-red-100 text-red-800';
            case 'IN_PROGRESS':
                return 'bg-yellow-100 text-yellow-800';
            case 'RESOLVED':
                return 'bg-green-100 text-green-800';
            case 'CLOSED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                        <TicketCheck className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.totalTickets}</div>
                        <p className="text-xs text-gray-600">Across all workspaces</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Tickets</CardTitle>
                        <Clock className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.myTickets}</div>
                        <p className="text-xs text-gray-600">Assigned to me</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.openTickets}</div>
                        <p className="text-xs text-gray-600">Need attention</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Activity className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.inProgressTickets}</div>
                        <p className="text-xs text-gray-600">Currently active</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleViewAllTickets} className="flex-1 sm:flex-none">
                    <TicketCheck className="h-4 w-4 mr-2" />
                    View All Tickets
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                        <CardDescription>Latest tickets across all workspaces</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p>No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.recentActivity.map((ticket) => (
                                    <div key={ticket.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {ticket.title}
                                                </p>
                                                <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                                                    {ticket.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Building2 className="h-3 w-3" />
                                                <span>{ticket.workspaceName}</span>
                                                <span>•</span>
                                                <span>{formatDate(ticket.reportedDate)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Workspace Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Workspace Overview</CardTitle>
                        <CardDescription>Tickets by workspace</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.workspaceBreakdown.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p>No workspaces found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.workspaceBreakdown.map((item) => (
                                    <div 
                                        key={item.workspace.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                        onClick={() => handleViewWorkspace(item.workspace.id)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {item.workspace.name}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {item.ticketCount} tickets • {item.myTicketCount} assigned to me
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.openTicketCount > 0 && (
                                                <Badge className="bg-red-100 text-red-800 text-xs">
                                                    {item.openTicketCount} open
                                                </Badge>
                                            )}
                                            <ArrowRight className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 