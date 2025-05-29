'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import { COMMENT_CONSTRAINTS } from '@/lib/types/comment';

interface AddCommentFormProps {
    onSubmit: (content: string) => Promise<void>;
    isLoading?: boolean;
    canComment?: boolean;
    userRole?: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export default function AddCommentForm({
    onSubmit,
    isLoading = false,
    canComment = true,
    userRole
}: AddCommentFormProps) {
    const [content, setContent] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear any previous errors
        setError(null);

        // Validate content
        const trimmedContent = content.trim();
        if (!trimmedContent) {
            setError('Comment cannot be empty');
            return;
        }

        if (trimmedContent.length > COMMENT_CONSTRAINTS.MAX_LENGTH) {
            setError(`Comment cannot exceed ${COMMENT_CONSTRAINTS.MAX_LENGTH} characters`);
            return;
        }

        try {
            await onSubmit(trimmedContent);
            setContent(''); // Clear form on success
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add comment');
        }
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        // Clear error when user starts typing
        if (error) {
            setError(null);
        }
    };

    const remainingChars = COMMENT_CONSTRAINTS.MAX_LENGTH - content.length;
    const isNearLimit = remainingChars < 100;
    const isOverLimit = remainingChars < 0;

    if (!canComment) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-gray-600">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">You don&apos;t have permission to add comments to this ticket.</span>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Comment textarea */}
            <div className="space-y-2">
                <label htmlFor="comment-content" className="block text-sm font-medium text-gray-700">
                    Add a comment
                </label>
                <Textarea
                    id="comment-content"
                    placeholder={`Share updates, ask questions, or provide additional information... (${userRole} role)`}
                    value={content}
                    onChange={handleContentChange}
                    className={`min-h-[100px] resize-none ${isOverLimit ? 'border-red-300 focus:border-red-500' : ''
                        }`}
                    disabled={isLoading}
                />

                {/* Character count */}
                <div className="flex justify-between items-center text-sm">
                    <div className="text-gray-500">
                        {userRole && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                Commenting as {userRole}
                            </span>
                        )}
                    </div>
                    <div className={`${isOverLimit ? 'text-red-600' :
                            isNearLimit ? 'text-orange-600' :
                                'text-gray-500'
                        }`}>
                        {remainingChars} characters remaining
                    </div>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={isLoading || !content.trim() || isOverLimit}
                    className="min-w-[120px]"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                        </>
                    ) : (
                        <>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Comment
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
} 