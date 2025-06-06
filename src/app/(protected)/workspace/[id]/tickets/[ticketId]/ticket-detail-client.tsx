'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { type SelectedTicket, type SelectedWorkspace } from '@/lib/server/ticket-utils';
import { type SelectedKiosk } from '@/lib/server/kiosk-utils';
import { type TicketComment } from '@/lib/types/comment';
import { type Attachment } from '@/lib/types/attachment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CommentList from '@/components/tickets/comment-list';
import { AttachmentManager } from '@/components/tickets/attachment-manager';
import { DeleteTicketDialog } from '@/components/tickets/delete-ticket-dialog';
import { 
    Ticket, 
    ArrowLeft, 
    Edit,
    MapPin,
    Calendar,
    Clock,
    FileText,
    Trash2
} from 'lucide-react';
import { InlineMaintenanceDateEditor, AddMaintenanceDateButton } from '@/components/tickets/inline-maintenance-date-editor';
import { InlineKioskEditor } from '@/components/kiosks/inline-kiosk-editor';
import { InlineAssigneeEditor, AddAssigneeButton } from '@/components/tickets/inline-assignee-editor';
import { updateTicketMaintenanceDateAction, updateTicketAssigneeAction, softDeleteTicketAction } from '@/lib/server/ticket-actions';

interface WorkspaceUser {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
}

interface TicketDetailClientProps {
    ticket: SelectedTicket;
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
    workspaceId: string;
    userId: string;
    initialComments: TicketComment[];
    initialAttachments: Attachment[];
    currentKiosk: SelectedKiosk;
    workspaceKiosks: SelectedKiosk[];
    workspaceUsers: WorkspaceUser[];
}

// Status color mapping
const statusColors = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
} as const;

export default function TicketDetailClient({ 
    ticket, 
    workspace, 
    userRole,
    workspaceId,
    userId,
    initialComments,
    initialAttachments,
    currentKiosk,
    workspaceKiosks,
    workspaceUsers
}: TicketDetailClientProps) {
    const router = useRouter();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Permission checks
    const canEdit = userRole === 'ADMIN' || userRole === 'MEMBER';
    const canDelete = userRole === 'ADMIN';

    // Handle maintenance date updates
    const handleMaintenanceDateUpdate = async (newDate: string | null): Promise<boolean> => {
        try {
            const result = await updateTicketMaintenanceDateAction(
                workspaceId,
                ticket.id,
                newDate
            );

            if (result.success) {
                // Refresh the page to show updated data
                router.refresh();
                return true;
            } else {
                console.error('Failed to update maintenance date:', result.error);
                return false;
            }
        } catch (error) {
            console.error('Error updating maintenance date:', error);
            return false;
        }
    };

    // Handle assignee updates
    const handleAssigneeUpdate = async (newAssigneeId: string | null): Promise<boolean> => {
        try {
            const result = await updateTicketAssigneeAction(
                workspaceId,
                ticket.id,
                newAssigneeId
            );

            if (result.success) {
                // Refresh the page to show updated data
                router.refresh();
                return true;
            } else {
                console.error('Failed to update assignee:', result.error);
                return false;
            }
        } catch (error) {
            console.error('Error updating assignee:', error);
            return false;
        }
    };

    // Handle kiosk updates
    const handleKioskUpdate = (success: boolean) => {
        if (success) {
            // Page will be revalidated by the server action
            router.refresh();
        }
    };

    // Handle ticket deletion
    const handleDeleteTicket = async () => {
        const result = await softDeleteTicketAction(workspaceId, ticket.id, userId);
        
        if (result.success) {
            // Redirect to tickets list after successful deletion
            router.push(`/workspace/${workspaceId}/tickets`);
        } else {
            // Error will be handled by the dialog component
            throw new Error(result.error || 'Failed to delete ticket');
        }
    };

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
                                    comments={initialComments}
                                    ticketId={ticket.id}
                                    userRole={userRole}
                                    currentUserId={userId}
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

                                {ticket.maintenanceTime ? (
                                    <InlineMaintenanceDateEditor
                                        ticket={ticket}
                                        workspaceId={workspaceId}
                                        canEdit={canEdit}
                                        onUpdate={handleMaintenanceDateUpdate}
                                    />
                                ) : (
                                    <AddMaintenanceDateButton
                                        ticket={ticket}
                                        workspaceId={workspaceId}
                                        canEdit={canEdit}
                                        onAdd={handleMaintenanceDateUpdate}
                                    />
                                )}

                                {ticket.assigneeId ? (
                                    <InlineAssigneeEditor
                                        ticket={ticket}
                                        workspaceId={workspaceId}
                                        canEdit={canEdit}
                                        workspaceUsers={workspaceUsers}
                                        onUpdate={handleAssigneeUpdate}
                                    />
                                ) : (
                                    <AddAssigneeButton
                                        ticket={ticket}
                                        workspaceId={workspaceId}
                                        canEdit={canEdit}
                                        workspaceUsers={workspaceUsers}
                                        onAdd={handleAssigneeUpdate}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        {/* Related Kiosk */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base sm:text-lg">Related Kiosk</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <InlineKioskEditor
                                    ticket={ticket}
                                    currentKiosk={currentKiosk}
                                    workspaceKiosks={workspaceKiosks}
                                    workspaceId={workspaceId}
                                    canEdit={canEdit}
                                    onUpdate={handleKioskUpdate}
                                />
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
                                {canDelete && (
                                    <Button
                                        variant="destructive"
                                        className="w-full min-h-[44px]"
                                        onClick={() => setShowDeleteDialog(true)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Ticket
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteTicketDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDeleteTicket}
                ticketTitle={ticket.title}
                ticketId={ticket.ticketId}
            />
        </div>
    );
} 