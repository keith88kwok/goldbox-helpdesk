'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Edit2, Plus, Trash2, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { type SelectedTicket } from '@/lib/server/ticket-utils';

interface InlineMaintenanceDateEditorProps {
    ticket: SelectedTicket;
    workspaceId: string;
    canEdit: boolean;
    onUpdate: (newDate: string | null) => Promise<boolean>;
}

interface AddMaintenanceDateButtonProps {
    ticket: SelectedTicket;
    workspaceId: string;
    canEdit: boolean;
    onAdd: (newDate: string) => Promise<boolean>;
}

// Format date for display
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export function InlineMaintenanceDateEditor({ ticket, canEdit, onUpdate }: InlineMaintenanceDateEditorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [dateValue, setDateValue] = useState(() => {
        // Convert ISO string to datetime-local format
        if (ticket.maintenanceTime) {
            return new Date(ticket.maintenanceTime).toISOString().slice(0, 16);
        }
        return '';
    });

    const handleSave = async () => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            // Pass the raw datetime-local value to server for validation and conversion
            const success = await onUpdate(dateValue || null);
            
            if (success) {
                setSuccess(true);
                // Close modal after short delay
                setTimeout(() => {
                    setIsOpen(false);
                    setSuccess(false);
                }, 1000);
            } else {
                setError('Failed to update maintenance date');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update maintenance date');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = async () => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const success = await onUpdate(null);
            
            if (success) {
                setSuccess(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setSuccess(false);
                }, 1000);
            } else {
                setError('Failed to remove maintenance date');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove maintenance date');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        setError(null);
        setSuccess(false);
        // Reset to original value
        setDateValue(ticket.maintenanceTime ? 
            new Date(ticket.maintenanceTime).toISOString().slice(0, 16) : '');
    };

    if (!canEdit) {
        // Read-only display for users without edit permissions
        return (
            <div className="flex items-start space-x-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Scheduled Maintenance</p>
                    <p className="text-xs sm:text-sm text-gray-600 break-words">
                        {formatDate(ticket.maintenanceTime!)}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div 
                className="flex items-start space-x-3 group cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded-md transition-colors"
                onClick={() => setIsOpen(true)}
            >
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">Scheduled Maintenance</p>
                        <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 break-words">
                        {formatDate(ticket.maintenanceTime!)}
                    </p>
                    <p className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to edit
                    </p>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Edit Maintenance Date
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <p className="text-sm text-green-700">Maintenance date updated successfully!</p>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
                                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-900">
                                Scheduled Maintenance Time
                            </label>
                            <Input
                                type="datetime-local"
                                value={dateValue}
                                onChange={(e) => setDateValue(e.target.value)}
                                className="text-base"
                                disabled={isSubmitting || success}
                            />
                            <p className="text-xs text-gray-500">
                                Leave empty to remove the scheduled maintenance date
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={handleRemove}
                            disabled={isSubmitting || success}
                            className="w-full sm:w-auto"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Date
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSubmitting || success}
                                className="flex-1 sm:flex-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSubmitting || success}
                                className="flex-1 sm:flex-none"
                            >
                                {isSubmitting ? 'Saving...' : success ? 'Saved!' : 'Save'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function AddMaintenanceDateButton({ canEdit, onAdd }: AddMaintenanceDateButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [dateValue, setDateValue] = useState('');

    const handleSave = async () => {
        if (!dateValue.trim()) {
            setError('Please select a date and time');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            // Pass the raw datetime-local value to server for validation and conversion
            const success = await onAdd(dateValue);
            
            if (success) {
                setSuccess(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setSuccess(false);
                    setDateValue('');
                }, 1000);
            } else {
                setError('Failed to add maintenance date');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add maintenance date');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        setError(null);
        setSuccess(false);
        setDateValue('');
    };

    if (!canEdit) {
        return null;
    }

    return (
        <>
            <div 
                className="flex items-start space-x-3 group cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded-md transition-colors"
                onClick={() => setIsOpen(true)}
            >
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">Scheduled Maintenance</p>
                        <Plus className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                        No maintenance scheduled
                    </p>
                    <p className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to add date
                    </p>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Schedule Maintenance Date
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <p className="text-sm text-green-700">Maintenance date scheduled successfully!</p>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
                                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-900">
                                Scheduled Maintenance Time
                            </label>
                            <Input
                                type="datetime-local"
                                value={dateValue}
                                onChange={(e) => setDateValue(e.target.value)}
                                className="text-base"
                                disabled={isSubmitting || success}
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSubmitting || success}
                            className="flex-1 sm:flex-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSubmitting || success}
                            className="flex-1 sm:flex-none"
                        >
                            {isSubmitting ? 'Saving...' : success ? 'Saved!' : 'Schedule Date'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
} 