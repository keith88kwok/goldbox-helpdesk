'use client';

import { useRouter } from 'next/navigation';
import { type SelectedTicket, type SelectedWorkspace } from '@/lib/server/ticket-utils';
import { type TicketComment } from '@/lib/types/comment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CommentList from '@/components/tickets/comment-list';
import { 
    Ticket, 
    ArrowLeft, 
    Edit,
    MapPin,
    User,
    Calendar,
    Clock,
    FileText
} from 'lucide-react';

interface TicketDetailClientProps {
    ticket: SelectedTicket;
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
    workspaceId: string;
    initialComments: TicketComment[];
    userId: string;
    userName: string;
    canComment: boolean;
}

// Status color mapping
const statusColors = {
    OPEN: 'bg-red-100 text-red-800 border-red-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

export default function TicketDetailClient({ 
    ticket, 
    workspace, 
    userRole,
    workspaceId,
    initialComments,
    userId,
    userName,
    canComment
}: TicketDetailClientProps) {
    const router = useRouter();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const canEdit = userRole === 'ADMIN' || userRole === 'MEMBER';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/workspace/${workspaceId}/tickets`)}
                                className="mr-4"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Tickets
                            </Button>
                            <div className="flex items-center">
                                <Ticket className="h-6 w-6 text-green-600 mr-3" />
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">
                                        {ticket.title}
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        Ticket #{ticket.ticketId} - {workspace.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Badge 
                                variant="secondary" 
                                className={statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN}
                            >
                                {ticket.status || 'OPEN'}
                            </Badge>
                            {canEdit && (
                                <Button
                                    onClick={() => router.push(`/workspace/${workspaceId}/tickets/${ticket.id}/edit`)}
                                    size="sm"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Ticket
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="h-5 w-5 mr-2" />
                                    Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {ticket.description}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Comments Section - now with actual functionality */}
                        <Card>
                            <CardContent className="p-6">
                                <CommentList
                                    initialComments={initialComments}
                                    ticketId={ticket.id}
                                    workspaceId={workspaceId}
                                    userRole={userRole}
                                    userId={userId}
                                    userName={userName}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Ticket Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ticket Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Reported</p>
                                        <p className="text-sm text-gray-600">
                                            {formatDate(ticket.reportedDate)}
                                        </p>
                                    </div>
                                </div>

                                {ticket.updatedDate && (
                                    <div className="flex items-start space-x-3">
                                        <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Last Updated</p>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(ticket.updatedDate)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {ticket.maintenanceTime && (
                                    <div className="flex items-start space-x-3">
                                        <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Scheduled Maintenance</p>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(ticket.maintenanceTime)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start space-x-3">
                                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Assignee</p>
                                        <p className="text-sm text-gray-600">
                                            {ticket.assigneeId ? 'Assigned' : 'Unassigned'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Related Kiosk */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Related Kiosk</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start space-x-3">
                                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Kiosk Location</p>
                                        <p className="text-sm text-gray-600">
                                            Kiosk ID: {ticket.kioskId}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => router.push(`/workspace/${workspaceId}/kiosks/${ticket.kioskId}`)}
                                        >
                                            View Kiosk Details
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {canEdit && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => router.push(`/workspace/${workspaceId}/tickets/${ticket.id}/edit`)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Ticket
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => router.push(`/workspace/${workspaceId}/kiosks/${ticket.kioskId}`)}
                                >
                                    <MapPin className="h-4 w-4 mr-2" />
                                    View Kiosk
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
} 