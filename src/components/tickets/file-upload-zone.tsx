'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import type { AttachmentUploadProgress } from '@/lib/types/attachment';
import { 
    isSupportedFile, 
    validateFileSize, 
    isImageFile, 
    SUPPORTED_IMAGE_TYPES, 
    SUPPORTED_DOCUMENT_TYPES 
} from '@/lib/types/attachment';

interface FileUploadZoneProps {
    onFilesSelected: (files: File[]) => void;
    uploading?: boolean;
    uploadProgress?: AttachmentUploadProgress[];
    disabled?: boolean;
    multiple?: boolean;
    maxFiles?: number;
    className?: string;
}

export function FileUploadZone({
    onFilesSelected,
    uploading = false,
    uploadProgress = [],
    disabled = false,
    multiple = true,
    maxFiles = 10,
    className = ''
}: FileUploadZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFiles = useCallback((files: FileList | File[]): { valid: File[]; errors: string[] } => {
        const fileArray = Array.from(files);
        const valid: File[] = [];
        const errors: string[] = [];

        // Check file count
        if (fileArray.length > maxFiles) {
            errors.push(`Maximum ${maxFiles} files allowed`);
            return { valid, errors };
        }

        for (const file of fileArray) {
            // Check file type
            if (!isSupportedFile(file.type)) {
                errors.push(`${file.name}: Unsupported file type`);
                continue;
            }

            // Check file size
            const isImage = isImageFile(file.type);
            if (!validateFileSize(file.size, isImage)) {
                const maxSize = isImage ? '5MB' : '10MB';
                errors.push(`${file.name}: File size exceeds ${maxSize} limit`);
                continue;
            }

            valid.push(file);
        }

        return { valid, errors };
    }, [maxFiles]);

    const handleFileSelect = useCallback((files: FileList | File[]) => {
        if (disabled) return;

        const { valid, errors } = validateFiles(files);

        if (errors.length > 0) {
            setValidationError(errors.join(', '));
            return;
        }

        setValidationError(null);
        onFilesSelected(valid);
    }, [disabled, validateFiles, onFilesSelected]);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragOver(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        handleFileSelect(files);
    }, [disabled, handleFileSelect]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files);
        }
        // Reset input value to allow selecting the same file again
        setTimeout(() => {
            if (e.target) {
                e.target.value = '';
            }
        }, 100);
    }, [handleFileSelect]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);

    const getFileIcon = (fileType: string) => {
        return isImageFile(fileType) ? ImageIcon : FileText;
    };

    const getProgressColor = (status: AttachmentUploadProgress['status']) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500';
            case 'error':
                return 'bg-red-500';
            default:
                return 'bg-blue-500';
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Upload Zone */}
            <div
                onClick={handleClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-all min-h-[120px] sm:min-h-[140px]
          ${isDragOver
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 active:bg-gray-100'}
          ${uploading ? 'pointer-events-none' : ''}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={multiple}
                    accept={[...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_DOCUMENT_TYPES].join(',')}
                    onChange={handleInputChange}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 w-full h-full opacity-0"
                    disabled={disabled}
                    style={{ zIndex: -1 }}
                />

                <div className="space-y-2">
                    <Upload className={`mx-auto h-6 w-6 sm:h-8 sm:w-8 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div>
                        <p className="text-sm font-medium text-gray-700">
                            {isDragOver ? 'Drop files here' : 'Tap to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Images (up to 5MB) or Documents (up to 10MB)
                        </p>
                        <p className="text-xs text-gray-400 mt-1 hidden sm:block">
                            Supported: JPG, PNG, GIF, WebP, PDF, DOC, DOCX, TXT, CSV
                        </p>
                        <p className="text-xs text-gray-400 mt-1 sm:hidden">
                            JPG, PNG, PDF, DOC supported
                        </p>
                    </div>
                </div>
            </div>

            {/* Validation Error */}
            {validationError && (
                <div className="flex items-start space-x-2 text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{validationError}</span>
                </div>
            )}

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Uploading files...</h4>
                    {uploadProgress.map((progress) => {
                        const FileIcon = getFileIcon(progress.filename.split('.').pop() || '');

                        return (
                            <div key={progress.id} className="border rounded-lg p-3">
                                <div className="flex items-center space-x-3">
                                    <FileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 truncate">
                                            {progress.filename}
                                        </p>

                                        {progress.status === 'uploading' && (
                                            <div className="mt-2">
                                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                    <span>Uploading...</span>
                                                    <span>{Math.round(progress.progress)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${getProgressColor(progress.status)}`}
                                                        style={{ width: `${progress.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {progress.status === 'completed' && (
                                            <div className="flex items-center space-x-1 mt-1">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span className="text-xs text-green-600">Upload complete</span>
                                            </div>
                                        )}

                                        {progress.status === 'error' && (
                                            <div className="flex items-center space-x-1 mt-1">
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                                <span className="text-xs text-red-600">
                                                    {progress.error || 'Upload failed'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
} 