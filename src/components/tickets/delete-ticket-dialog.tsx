'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface DeleteTicketDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    ticketTitle: string;
    ticketId: string;
    isLoading?: boolean;
}

export function DeleteTicketDialog({
    isOpen,
    onClose,
    onConfirm,
    ticketTitle,
    ticketId,
    isLoading = false
}: DeleteTicketDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            await onConfirm();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete ticket');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (!isDeleting) {
            setError(null);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Ticket
                    </DialogTitle>
                    <DialogDescription className="text-left">
                        Are you sure you want to delete this ticket? The data will be preserved and can be restored by administrators.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="bg-gray-50 rounded-lg p-3 border">
                        <div className="text-sm text-gray-600 mb-1">Ticket to delete:</div>
                        <div className="font-medium text-gray-900 break-words">{ticketTitle}</div>
                        <div className="text-xs text-gray-500 mt-1">ID: {ticketId}</div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting || isLoading}
                        className="w-full sm:w-auto"
                    >
                        {isDeleting ? (
                            <>
                                <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Ticket
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 