'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { User, Edit2, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { type SelectedTicket } from '@/lib/server/ticket-utils';
import { AssigneeSelector } from './assignee-selector';

interface WorkspaceUser {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
}

interface InlineAssigneeEditorProps {
    ticket: SelectedTicket;
    workspaceId: string;
    canEdit: boolean;
    workspaceUsers: WorkspaceUser[];
    onUpdate: (newAssigneeId: string | null) => Promise<boolean>;
}

interface AddAssigneeButtonProps {
    ticket: SelectedTicket;
    workspaceId: string;
    canEdit: boolean;
    workspaceUsers: WorkspaceUser[];
    onAdd: (assigneeId: string) => Promise<boolean>;
}

export function InlineAssigneeEditor({ 
    ticket, 
    canEdit, 
    workspaceUsers, 
    onUpdate 
}: InlineAssigneeEditorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [assigneeValue, setAssigneeValue] = useState(ticket.assigneeId || '');

    const handleSave = async () => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const success = await onUpdate(assigneeValue || null);
            
            if (success) {
                setSuccess(true);
                // Close modal after short delay
                setTimeout(() => {
                    setIsOpen(false);
                    setSuccess(false);
                }, 1000);
            } else {
                setError('Failed to update assignee');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update assignee');
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
                setError('Failed to remove assignee');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove assignee');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        setError(null);
        setSuccess(false);
        // Reset to original value
        setAssigneeValue(ticket.assigneeId || '');
    };

    if (!canEdit) {
        // Read-only display for users without edit permissions
        return (
            <div className="flex items-start space-x-3">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Assignee</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                        {ticket.assigneeName || 'Unassigned'}
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
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">Assignee</p>
                        <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 break-words">
                        {ticket.assigneeName || 'Unassigned'}
                    </p>
                    <p className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to edit
                    </p>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Edit Assignee
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <p className="text-sm text-green-700">Assignee updated successfully!</p>
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
                                Ticket Assignee
                            </label>
                            <AssigneeSelector
                                value={assigneeValue}
                                onChange={setAssigneeValue}
                                users={workspaceUsers}
                                placeholder="Select assignee or leave unassigned"
                                disabled={isSubmitting || success}
                                allowClear={true}
                            />
                            <p className="text-xs text-gray-500">
                                Select a team member to assign this ticket to, or leave unassigned
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
                            <User className="h-4 w-4 mr-2" />
                            Unassign
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSubmitting || success}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSubmitting || success}
                                className="flex-1"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function AddAssigneeButton({ 
    canEdit, 
    workspaceUsers, 
    onAdd 
}: AddAssigneeButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [assigneeValue, setAssigneeValue] = useState('');

    const handleSave = async () => {
        if (!assigneeValue) {
            setError('Please select an assignee');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const success = await onAdd(assigneeValue);
            
            if (success) {
                setSuccess(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setSuccess(false);
                    setAssigneeValue('');
                }, 1000);
            } else {
                setError('Failed to assign ticket');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        setError(null);
        setSuccess(false);
        setAssigneeValue('');
    };

    if (!canEdit) {
        return (
            <div className="flex items-start space-x-3">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Assignee</p>
                    <p className="text-xs sm:text-sm text-gray-600">Unassigned</p>
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
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">Assignee</p>
                        <Plus className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Unassigned</p>
                    <p className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to assign
                    </p>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Assign Ticket
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <p className="text-sm text-green-700">Ticket assigned successfully!</p>
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
                                Select Assignee
                            </label>
                            <AssigneeSelector
                                value={assigneeValue}
                                onChange={setAssigneeValue}
                                users={workspaceUsers}
                                placeholder="Choose a team member"
                                disabled={isSubmitting || success}
                                allowClear={false}
                            />
                            <p className="text-xs text-gray-500">
                                Select a team member to assign this ticket to
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSubmitting || success}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSubmitting || success || !assigneeValue}
                            className="flex-1"
                        >
                            {isSubmitting ? 'Assigning...' : 'Assign Ticket'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
} 