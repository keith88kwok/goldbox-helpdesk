'use client';

import React, { useState, useEffect } from 'react';
import {
    FileText,
    Image as ImageIcon,
    Download,
    Trash2,
    Eye,
    X,
    ExternalLink
} from 'lucide-react';
import { getUrl } from 'aws-amplify/storage';
import type { Attachment } from '@/lib/types/attachment';
import { formatFileSize } from '@/lib/types/attachment';

interface AttachmentListProps {
    attachments: Attachment[];
    onDelete?: (attachmentId: string) => void;
    canDelete?: boolean;
    className?: string;
}

interface ImagePreviewModalProps {
    attachment: Attachment;
    isOpen: boolean;
    onClose: () => void;
}

function ImagePreviewModal({ attachment, isOpen, onClose }: ImagePreviewModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative max-w-4xl max-h-full p-4">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity"
                >
                    <X className="h-6 w-6" />
                </button>

                <img
                    src={attachment.url}
                    alt={attachment.originalName}
                    className="max-w-full max-h-full object-contain rounded-lg"
                />

                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded">
                    <p className="text-sm font-medium">{attachment.originalName}</p>
                    <p className="text-xs opacity-75">{formatFileSize(attachment.fileSize)}</p>
                </div>
            </div>
        </div>
    );
}

export function AttachmentList({
    attachments,
    onDelete,
    canDelete = false,
    className = ''
}: AttachmentListProps) {
    const [previewImage, setPreviewImage] = useState<Attachment | null>(null);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});

    // Generate signed URLs for attachments
    useEffect(() => {
        const generateUrls = async () => {
            const urlPromises = attachments.map(async (attachment) => {
                try {
                    const urlResult = await getUrl({
                        key: attachment.s3Key,
                        options: {
                            expiresIn: 3600 // 1 hour
                        }
                    });
                    return { id: attachment.id, url: urlResult.url.toString() };
                } catch (error) {
                    console.error('Error generating URL for attachment:', error);
                    return { id: attachment.id, url: '' };
                }
            });

            const results = await Promise.all(urlPromises);
            const urlMap = results.reduce((acc, { id, url }) => {
                if (url) acc[id] = url;
                return acc;
            }, {} as Record<string, string>);

            setAttachmentUrls(urlMap);
        };

        if (attachments.length > 0) {
            generateUrls();
        }
    }, [attachments]);

    const handleDelete = async (attachmentId: string) => {
        if (!onDelete || deletingIds.has(attachmentId)) return;

        setDeletingIds(prev => new Set(prev).add(attachmentId));

        try {
            await onDelete(attachmentId);
        } catch (error) {
            console.error('Error deleting attachment:', error);
        } finally {
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(attachmentId);
                return next;
            });
        }
    };

    const handleDownload = (attachment: Attachment) => {
        const url = attachmentUrls[attachment.id];
        if (url) {
            // Create a temporary link element to trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = attachment.originalName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handlePreview = (attachment: Attachment) => {
        const url = attachmentUrls[attachment.id];
        if (attachment.isImage && url) {
            setPreviewImage({ ...attachment, url });
        } else if (url) {
            // For non-images, open in new tab
            window.open(url, '_blank');
        }
    };

    const getFileIcon = (attachment: Attachment) => {
        return attachment.isImage ? ImageIcon : FileText;
    };

    const getFileTypeLabel = (attachment: Attachment) => {
        if (attachment.isImage) return 'Image';

        const extension = attachment.originalName.split('.').pop()?.toUpperCase();
        switch (extension) {
            case 'PDF':
                return 'PDF Document';
            case 'DOC':
            case 'DOCX':
                return 'Word Document';
            case 'TXT':
                return 'Text File';
            case 'CSV':
                return 'CSV File';
            default:
                return 'Document';
        }
    };

    if (attachments.length === 0) {
        return (
            <div className={`text-center py-8 text-gray-500 ${className}`}>
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm">No attachments</p>
            </div>
        );
    }

    return (
        <>
            <div className={`space-y-3 ${className}`}>
                {attachments.map((attachment) => {
                    const FileIcon = getFileIcon(attachment);
                    const isDeleting = deletingIds.has(attachment.id);
                    const attachmentUrl = attachmentUrls[attachment.id];

                    return (
                        <div
                            key={attachment.id}
                            className={`border rounded-lg p-4 transition-all ${isDeleting ? 'opacity-50 pointer-events-none' : 'hover:shadow-sm'
                                }`}
                        >
                            <div className="flex items-start space-x-3">
                                {/* File Icon or Image Thumbnail */}
                                <div className="flex-shrink-0">
                                    {attachment.isImage && attachmentUrl ? (
                                        <div
                                            className="w-12 h-12 rounded cursor-pointer overflow-hidden border"
                                            onClick={() => handlePreview(attachment)}
                                        >
                                            <img
                                                src={attachmentUrl}
                                                alt={attachment.originalName}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                                            <FileIcon className="h-6 w-6 text-gray-500" />
                                        </div>
                                    )}
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                {attachment.originalName}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {getFileTypeLabel(attachment)} • {formatFileSize(attachment.fileSize)}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center space-x-1 ml-4">
                                            {/* Preview/View Button */}
                                            {attachmentUrl && (
                                                <button
                                                    onClick={() => handlePreview(attachment)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                    title={attachment.isImage ? 'Preview image' : 'Open file'}
                                                >
                                                    {attachment.isImage ? (
                                                        <Eye className="h-4 w-4" />
                                                    ) : (
                                                        <ExternalLink className="h-4 w-4" />
                                                    )}
                                                </button>
                                            )}

                                            {/* Download Button */}
                                            {attachmentUrl && (
                                                <button
                                                    onClick={() => handleDownload(attachment)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                    title="Download file"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                            )}

                                            {/* Delete Button */}
                                            {canDelete && onDelete && (
                                                <button
                                                    onClick={() => handleDelete(attachment.id)}
                                                    disabled={isDeleting}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                                    title="Delete attachment"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <ImagePreviewModal
                    attachment={previewImage}
                    isOpen={true}
                    onClose={() => setPreviewImage(null)}
                />
            )}
        </>
    );
} 