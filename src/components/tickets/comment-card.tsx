import { type TicketComment } from '@/lib/types/comment';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface CommentCardProps {
    comment: TicketComment;
}

// Role badge styling
const roleBadgeStyles = {
    ADMIN: 'bg-red-100 text-red-800 border-red-200',
    MEMBER: 'bg-blue-100 text-blue-800 border-blue-200',
    VIEWER: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

export default function CommentCard({ comment }: CommentCardProps) {
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
            {/* Header with user info and timestamp */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                    {/* User avatar placeholder */}
                    <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {comment.userName ? (
                                <span className="text-sm font-medium text-gray-600">
                                    {getInitials(comment.userName)}
                                </span>
                            ) : (
                                <User className="h-4 w-4 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* User name and role */}
                    <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                            {comment.userName || 'Unknown User'}
                        </span>
                        <Badge
                            variant="secondary"
                            className={`text-xs ${roleBadgeStyles[comment.userRole] || roleBadgeStyles.VIEWER}`}
                        >
                            {comment.userRole}
                        </Badge>
                    </div>
                </div>

                {/* Timestamp */}
                <time
                    className="text-sm text-gray-500"
                    dateTime={comment.timestamp}
                    title={new Date(comment.timestamp).toLocaleString()}
                >
                    {formatTimestamp(comment.timestamp)}
                </time>
            </div>

            {/* Comment content */}
            <div className="pl-11">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                </p>
            </div>
        </div>
    );
} 