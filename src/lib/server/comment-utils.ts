import { getWorkspaceAccess } from './workspace-utils';
import { getTicketWithAccess } from './ticket-utils';
import { getServerUser } from './auth-utils';
import { cookiesClient } from '@/utils/amplify-utils';
import {
    type TicketComment,
    type CreateCommentData,
    type CommentValidationResult,
    COMMENT_CONSTRAINTS
} from '@/lib/types/comment';

/**
 * Validate comment content and data
 */
export function validateCommentContent(content: string): CommentValidationResult {
    const errors: string[] = [];

    if (!content || typeof content !== 'string') {
        errors.push('Comment content is required');
    } else {
        const trimmedContent = content.trim();

        if (trimmedContent.length < COMMENT_CONSTRAINTS.MIN_LENGTH) {
            errors.push('Comment cannot be empty');
        }

        if (trimmedContent.length > COMMENT_CONSTRAINTS.MAX_LENGTH) {
            errors.push(`Comment cannot exceed ${COMMENT_CONSTRAINTS.MAX_LENGTH} characters`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate comment data structure
 */
export function validateCommentData(data: CreateCommentData): CommentValidationResult {
    const errors: string[] = [];

    // Validate required fields
    for (const field of COMMENT_CONSTRAINTS.REQUIRED_FIELDS) {
        if (!data[field] || typeof data[field] !== 'string') {
            errors.push(`${field} is required`);
        }
    }

    // Validate content specifically
    const contentValidation = validateCommentContent(data.content);
    errors.push(...contentValidation.errors);

    // Validate user role
    if (data.userRole && !['ADMIN', 'MEMBER', 'VIEWER'].includes(data.userRole)) {
        errors.push('Invalid user role');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Check if user has permission to comment (ALL roles can comment)
 */
export async function validateCommentAccess(workspaceId: string): Promise<{
    canComment: boolean;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
    userId: string;
    userName: string;
}> {
    try {
        // Get workspace access - this validates the user is a member
        const access = await getWorkspaceAccess(workspaceId);

        // Get user information
        const user = await getServerUser();

        return {
            canComment: true, // ALL authenticated workspace members can comment
            userRole: access.userRole,
            userId: user.id,
            userName: user.name
        };
    } catch {
        return {
            canComment: false,
            userRole: 'VIEWER',
            userId: '',
            userName: ''
        };
    }
}

/**
 * Get comments for a specific ticket
 */
export async function getTicketComments(
    workspaceId: string,
    ticketId: string
): Promise<TicketComment[]> {
    // Validate access to the ticket
    const { ticket } = await getTicketWithAccess(workspaceId, ticketId);

    // Extract comments from ticket data
    const rawComments = ticket.comments || [];

    // Parse and validate comment structure
    const comments: TicketComment[] = rawComments
        .map((comment: unknown) => {
            try {
                // Handle both parsed objects and JSON strings
                const parsedComment = typeof comment === 'string' ? JSON.parse(comment) : comment;

                // Validate comment structure
                if (!parsedComment.id || !parsedComment.content || !parsedComment.userId) {
                    console.warn('Invalid comment structure:', parsedComment);
                    return null;
                }

                return parsedComment as TicketComment;
            } catch (error) {
                console.warn('Failed to parse comment:', comment, error);
                return null;
            }
        })
        .filter((comment): comment is TicketComment => comment !== null);

    // Sort comments by timestamp (newest first)
    return comments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Add a new comment to a ticket
 */
export async function addTicketComment(
    workspaceId: string,
    ticketId: string,
    commentData: CreateCommentData
): Promise<TicketComment> {
    // Validate comment access
    const access = await validateCommentAccess(workspaceId);
    if (!access.canComment) {
        throw new Error('Access denied: Cannot add comments to this workspace');
    }

    // Validate comment data
    const validation = validateCommentData(commentData);
    if (!validation.isValid) {
        throw new Error(`Invalid comment data: ${validation.errors.join(', ')}`);
    }

    // Get current ticket with access validation
    const { ticket } = await getTicketWithAccess(workspaceId, ticketId);

    // Create new comment object
    const newComment: TicketComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: commentData.userId,
        userName: commentData.userName,
        userRole: commentData.userRole,
        content: commentData.content.trim(),
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    };

    // Get existing comments and properly handle JSON serialization
    const existingComments = ticket.comments || [];
    
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

    // Add new comment and serialize all comments as JSON strings for storage
    const updatedComments = [...parsedExistingComments, newComment]
        .map(comment => JSON.stringify(comment));

    // Update ticket with new comment
    const { data: updatedTicket, errors } = await cookiesClient.models.Ticket.update({
        id: ticket.id,
        comments: updatedComments,
        updatedDate: new Date().toISOString(),
    });

    if (errors || !updatedTicket) {
        throw new Error(`Failed to add comment: ${errors?.map(e => e.message).join(', ') || 'Unknown error'}`);
    }

    return newComment;
} 