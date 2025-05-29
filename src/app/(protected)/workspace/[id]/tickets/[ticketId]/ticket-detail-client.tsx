'use client';

import { useRouter } from 'next/navigation';
import { type SelectedTicket, type SelectedWorkspace } from '@/lib/server/ticket-utils';
import { type TicketComment } from '@/lib/types/comment';
import { type Attachment } from '@/lib/types/attachment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CommentList from '@/components/tickets/comment-list';
import { AttachmentManager } from '@/components/tickets/attachment-manager';
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
    initialAttachments: Attachment[];
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
    initialAttachments,
    userId,
    userName
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
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 sm:py-0 sm:h-16 gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/workspace/${workspaceId}/tickets`)}
                                className="w-fit sm:w-auto"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Tickets
                            </Button>
                            <div className="flex items-center min-w-0">
                                <Ticket className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3 flex-shrink-0" />
                                <div className="min-w-0">
                                    <h1 className="text-base sm:text-xl font-semibold text-gray-900 line-clamp-1">
                                        {ticket.title}
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                                        Ticket #{ticket.ticketId} - {workspace.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <Badge 
                                variant="secondary" 
                                className={`${statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN} text-xs`}
                            >
                                {ticket.status || 'OPEN'}
                            </Badge>
                            {canEdit && (
                                <Button
                                    onClick={() => router.push(`/workspace/${workspaceId}/tickets/${ticket.id}/edit`)}
                                    size="sm"
                                    className="w-full sm:w-auto"
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                    {/* Main Information */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        {/* Description */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center text-base sm:text-lg">
                                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                    Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">
                                    {ticket.description}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Comments Section - now with actual functionality */}
                        <Card>
                            <CardContent className="p-4 sm:p-6">
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

                        {/* Attachments Section */}
                        <Card>
                            <CardContent className="p-4 sm:p-6">
                                <AttachmentManager
                                    ticketId={ticket.id}
                                    workspaceId={workspaceId}
                                    initialAttachments={initialAttachments}
                                    canUpload={canEdit}
                                    canDelete={canEdit}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Ticket Details */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base sm:text-lg">Ticket Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 sm:space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-gray-900">Reported</p>
                                        <p className="text-xs sm:text-sm text-gray-600 break-words">
                                            {formatDate(ticket.reportedDate)}
                                        </p>
                                    </div>
                                </div>

                                {ticket.updatedDate && (
                                    <div className="flex items-start space-x-3">
                                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-medium text-gray-900">Last Updated</p>
                                            <p className="text-xs sm:text-sm text-gray-600 break-words">
                                                {formatDate(ticket.updatedDate)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {ticket.maintenanceTime && (
                                    <div className="flex items-start space-x-3">
                                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-medium text-gray-900">Scheduled Maintenance</p>
                                            <p className="text-xs sm:text-sm text-gray-600 break-words">
                                                {formatDate(ticket.maintenanceTime)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start space-x-3">
                                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-gray-900">Assignee</p>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            {ticket.assigneeId ? 'Assigned' : 'Unassigned'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Related Kiosk */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base sm:text-lg">Related Kiosk</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start space-x-3">
                                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-gray-900">Kiosk Location</p>
                                        <p className="text-xs sm:text-sm text-gray-600 break-all">
                                            Kiosk ID: {ticket.kioskId}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 w-full sm:w-auto min-h-[44px]"
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
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {canEdit && (
                                    <Button
                                        variant="outline"
                                        className="w-full min-h-[44px]"
                                        onClick={() => router.push(`/workspace/${workspaceId}/tickets/${ticket.id}/edit`)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Ticket
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    className="w-full min-h-[44px]"
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