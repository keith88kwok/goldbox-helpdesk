'use client';

import React, { useState, useCallback } from 'react';
import { Paperclip, Plus, RefreshCw } from 'lucide-react';
import { FileUploadZone } from './file-upload-zone';
import { AttachmentList } from './attachment-list';
import type { Attachment, AttachmentUploadProgress } from '@/lib/types/attachment';
import { generateAttachmentId, generateS3Key, sanitizeForHeaders } from '@/lib/types/attachment';
import { uploadData } from 'aws-amplify/storage';
import { saveAttachmentAction, removeAttachmentAction, getTicketAttachmentsAction } from '@/lib/actions/attachment-actions';
import { useAuth } from '@/contexts/auth-context';

interface AttachmentManagerProps {
    ticketId: string;
    workspaceId: string;
    initialAttachments?: Attachment[];
    canUpload?: boolean;
    canDelete?: boolean;
    className?: string;
    onAttachmentsChange?: (attachments: Attachment[]) => void;
}

export function AttachmentManager({
    ticketId,
    workspaceId,
    initialAttachments = [],
    canUpload = true,
    canDelete = false,
    className = '',
    onAttachmentsChange
}: AttachmentManagerProps) {
    const { user } = useAuth();
    const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
    const [uploadProgress, setUploadProgress] = useState<AttachmentUploadProgress[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadZone, setShowUploadZone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Update attachments when props change
    React.useEffect(() => {
        setAttachments(initialAttachments);
    }, [initialAttachments]);

    // Notify parent of attachment changes
    React.useEffect(() => {
        onAttachmentsChange?.(attachments);
    }, [attachments, onAttachmentsChange]);

    const updateUploadProgress = useCallback((id: string, update: Partial<AttachmentUploadProgress>) => {
        setUploadProgress(prev => prev.map(p => p.id === id ? { ...p, ...update } : p));
    }, []);

    const addUploadProgress = useCallback((progress: AttachmentUploadProgress) => {
        setUploadProgress(prev => [...prev, progress]);
    }, []);

    const removeUploadProgress = useCallback((id: string) => {
        setUploadProgress(prev => prev.filter(p => p.id !== id));
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        setError(null);
        try {
            const result = await getTicketAttachmentsAction(ticketId);
            
            if (result.success && result.attachments) {
                setAttachments(result.attachments);
            } else {
                throw new Error(result.error || 'Failed to fetch attachments');
            }
        } catch (error) {
            console.error('Error refreshing attachments:', error);
            setError('Failed to refresh attachments');
        } finally {
            setIsRefreshing(false);
        }
    }, [ticketId]);

    const handleFilesSelected = useCallback(async (files: File[]) => {
        if (!user) {
            setError('User not authenticated');
            return;
        }

        setError(null);
        setIsUploading(true);

        const uploadPromises = files.map(async (file) => {
            const progressId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Add initial progress entry
            addUploadProgress({
                id: progressId,
                filename: file.name,
                progress: 0,
                status: 'uploading'
            });

            try {
                updateUploadProgress(progressId, { progress: 10 });

                // Generate attachment metadata
                const attachmentId = generateAttachmentId();
                const s3Key = generateS3Key(workspaceId, ticketId, file.name);
                
                // Upload to S3
                const uploadResult = await uploadData({
                    key: s3Key,
                    data: file,
                    options: {
                        contentType: file.type,
                        metadata: {
                            originalName: sanitizeForHeaders(file.name),
                            uploadedBy: sanitizeForHeaders(user.name),
                            ticketId: sanitizeForHeaders(ticketId),
                            workspaceId: sanitizeForHeaders(workspaceId)
                        }
                    }
                }).result;

                updateUploadProgress(progressId, { progress: 80 });

                if (!uploadResult.key) {
                    throw new Error('Failed to upload file to storage');
                }

                // Create attachment object
                const attachment: Attachment = {
                    id: attachmentId,
                    filename: s3Key.split('/').pop() || file.name,
                    originalName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    s3Key,
                    uploadedBy: user.name,
                    uploadedAt: new Date().toISOString(),
                    isImage: file.type.startsWith('image/')
                };


                updateUploadProgress(progressId, { progress: 90 });

                // Save attachment metadata to database
                const saveResult = await saveAttachmentAction(ticketId, attachment);
                
                if (!saveResult.success) {
                    console.warn('Failed to save attachment to database:', saveResult.error);
                    // Continue anyway - the file is uploaded to S3
                }

                updateUploadProgress(progressId, { progress: 100, status: 'completed' });

                // Add to local state
                setAttachments(prev => [...prev, attachment]);

                // Remove progress after a short delay
                setTimeout(() => {
                    removeUploadProgress(progressId);
                }, 2000);

                return attachment;

            } catch (error) {
                console.error('Error uploading file:', error);
                updateUploadProgress(progressId, { 
                    status: 'error', 
                    error: error instanceof Error ? error.message : 'Upload failed' 
                });

                // Remove error progress after a longer delay
                setTimeout(() => {
                    removeUploadProgress(progressId);
                }, 5000);

                throw error;
            }
        });

        try {
            await Promise.all(uploadPromises);
            // Refresh attachments after successful upload to get proper signed URLs
            await handleRefresh();
        } catch {
            setError('Some files failed to upload');
        } finally {
            setIsUploading(false);
            // Hide upload zone after successful upload
            if (uploadPromises.length > 0) {
                setTimeout(() => setShowUploadZone(false), 2000);
            }
        }
    }, [user, workspaceId, ticketId, addUploadProgress, updateUploadProgress, removeUploadProgress, handleRefresh]);

    const handleDeleteAttachment = useCallback(async (attachmentId: string) => {
        try {
            const result = await removeAttachmentAction(ticketId, attachmentId);
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to delete attachment');
            }

            // Refresh attachments after deletion to ensure list is current
            await handleRefresh();

        } catch (error) {
            console.error('Error deleting attachment:', error);
            setError(error instanceof Error ? error.message : 'Failed to delete attachment');
        }
    }, [ticketId, handleRefresh]);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Paperclip className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium text-gray-900">
                        Attachments {attachments.length > 0 && `(${attachments.length})`}
                    </h3>
                </div>

                <div className="flex items-center space-x-2">
                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Refresh attachments"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Add Attachment Button */}
                    {canUpload && (
                        <button
                            onClick={() => setShowUploadZone(!showUploadZone)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Files</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 underline hover:no-underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Upload Zone */}
            {showUploadZone && canUpload && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <FileUploadZone
                        onFilesSelected={handleFilesSelected}
                        uploading={isUploading}
                        uploadProgress={uploadProgress}
                        disabled={isUploading}
                    />
                </div>
            )}

            {/* Attachments List */}
            <AttachmentList
                attachments={attachments}
                onDelete={canDelete ? handleDeleteAttachment : undefined}
                canDelete={canDelete}
            />
        </div>
    );
} 