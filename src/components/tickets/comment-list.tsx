'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type TicketComment } from '@/lib/types/comment';
import CommentCard from './comment-card';
import AddCommentForm from './add-comment-form';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/utils/amplify-utils';
import { MessageSquare, CheckCircle } from 'lucide-react';

const client = generateClient<Schema>();

interface CommentListProps {
    initialComments: TicketComment[];
    ticketId: string;
    workspaceId: string;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
    userId: string;
    userName: string;
}

export default function CommentList({
    initialComments,
    ticketId,
    workspaceId,
    userRole,
    userId,
    userName
}: CommentListProps) {
    const [comments, setComments] = useState<TicketComment[]>(initialComments);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const router = useRouter();
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new comments are added
    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (comments.length > initialComments.length) {
            scrollToBottom();
        }
    }, [comments.length, initialComments.length]);

    const handleAddComment = async (content: string) => {
        setIsLoading(true);

        try {
            // Create optimistic comment for immediate UI update
            const optimisticComment: TicketComment = {
                id: `temp-${Date.now()}`,
                userId,
                userName,
                userRole,
                content,
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
            };

            // Add optimistic comment to UI
            setComments(prev => [optimisticComment, ...prev]);

            // Get current ticket data
            const { data: currentTicket, errors: fetchErrors } = await client.models.Ticket.get({
                id: ticketId
            });

            if (fetchErrors || !currentTicket) {
                throw new Error('Failed to fetch current ticket data');
            }

            // Create actual comment
            const newComment: TicketComment = {
                id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId,
                userName,
                userRole,
                content,
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
            };

            // Get existing comments and properly handle JSON serialization
            const existingComments = currentTicket.comments || [];
            
            // Parse existing comments to ensure they're proper objects
            const parsedExistingComments = existingComments.map(comment => {
                if (typeof comment === 'string') {
                    try {
                        return JSON.parse(comment);
                    } catch {
                        return comment;
                    }
                }
                return comment;
            });

            // Add new comment and serialize all comments as JSON strings
            const updatedComments = [...parsedExistingComments, newComment]
                .map(comment => JSON.stringify(comment));

            const { data: updatedTicket, errors } = await client.models.Ticket.update({
                id: ticketId,
                comments: updatedComments,
                updatedDate: new Date().toISOString(),
            });

            if (errors || !updatedTicket) {
                throw new Error(`Failed to add comment: ${errors?.map(e => e.message).join(', ') || 'Unknown error'}`);
            }

            // Replace optimistic comment with real one
            setComments(prev => [
                newComment,
                ...prev.filter(c => c.id !== optimisticComment.id)
            ]);

            // Show success message
            setSuccessMessage('Comment added successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (error) {
            console.error('Error adding comment:', error);

            // Remove optimistic comment on error
            setComments(prev => prev.filter(c => c.id !== `temp-${Date.now()}`));

            // Re-throw error for form to handle
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Comments ({comments.length})
                </h3>
                {successMessage && (
                    <div className="flex items-center space-x-2 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>{successMessage}</span>
                    </div>
                )}
            </div>

            {/* Add comment form */}
            <AddCommentForm
                onSubmit={handleAddComment}
                isLoading={isLoading}
                canComment={true} // All roles can comment
                userRole={userRole}
            />

            {/* Comments list */}
            {comments.length > 0 ? (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}
                        />
                    ))}
                    <div ref={commentsEndRef} />
                </div>
            ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No comments yet</p>
                    <p className="text-gray-500 text-sm mt-1">
                        Be the first to add a comment to this ticket
                    </p>
                </div>
            )}
        </div>
    );
} 