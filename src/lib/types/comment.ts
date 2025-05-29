/**
 * TypeScript interfaces for the ticket comment system
 */

export interface TicketComment {
    id: string;                    // Unique comment ID
    userId: string;                // Author user ID
    userName: string;              // Author name (denormalized for performance)
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';  // Author role at time of comment
    content: string;               // Comment text content
    timestamp: string;             // ISO datetime string
    createdAt: string;            // Creation timestamp
    updatedAt?: string;           // Last updated (for future edit feature)
}

export interface CreateCommentData {
    content: string;
    userId: string;
    userName: string;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export interface CommentValidationResult {
    isValid: boolean;
    errors: string[];
}

// Constants for comment validation
export const COMMENT_CONSTRAINTS = {
    MIN_LENGTH: 1,
    MAX_LENGTH: 2000,
    REQUIRED_FIELDS: ['content', 'userId', 'userName', 'userRole'] as const,
} as const; 