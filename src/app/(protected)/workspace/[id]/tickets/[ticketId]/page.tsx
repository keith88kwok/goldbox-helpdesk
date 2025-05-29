import { redirect } from 'next/navigation';
import { getTicketWithAccess } from '@/lib/server/ticket-utils';
import { getTicketComments, validateCommentAccess } from '@/lib/server/comment-utils';
import TicketDetailClient from './ticket-detail-client';

interface PageProps {
    params: Promise<{ id: string; ticketId: string }>;
}

/**
 * Server component for ticket detail page
 * Fetches ticket data server-side with access validation
 */
export default async function TicketDetailPage({ params }: PageProps) {
    try {
        // Await params before accessing properties
        const { id, ticketId } = await params;

        // Fetch ticket data server-side with access validation
        const { ticket, workspace, userRole } = await getTicketWithAccess(id, ticketId);

        // Fetch comment data and user access info
        const [comments, commentAccess] = await Promise.all([
            getTicketComments(id, ticketId),
            validateCommentAccess(id)
        ]);

        return (
            <TicketDetailClient
                ticket={ticket}
                workspace={workspace}
                userRole={userRole}
                workspaceId={id}
                initialComments={comments}
                userId={commentAccess.userId}
                userName={commentAccess.userName}
                canComment={commentAccess.canComment}
            />
        );
    } catch (error) {
        console.error('Ticket access error:', error);

        // Await params to get the id for redirect
        const { id } = await params;

        // Redirect to tickets page with error message
        const errorMessage = error instanceof Error ? error.message : 'Ticket not found';
        redirect(`/workspace/${id}/tickets?error=${encodeURIComponent(errorMessage)}`);
    }
} 