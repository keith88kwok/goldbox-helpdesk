'use client';

import React, { useState } from 'react';
import { Edit, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { type SelectedTicket } from '@/lib/server/ticket-utils';
import { type SelectedKiosk } from '@/lib/server/kiosk-utils';
import { KioskSelector } from './kiosk-selector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { updateTicketKioskAction } from '@/lib/server/ticket-actions';

interface InlineKioskEditorProps {
    ticket: SelectedTicket;
    currentKiosk: SelectedKiosk;
    workspaceKiosks: SelectedKiosk[];
    workspaceId: string;
    canEdit: boolean;
    onUpdate?: (success: boolean) => void;
}

// Status color mapping
const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800 border-green-200',
    INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
    MAINTENANCE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    RETIRED: 'bg-red-100 text-red-800 border-red-200',
} as const;

export function InlineKioskEditor({
    ticket,
    currentKiosk,
    workspaceKiosks,
    workspaceId,
    canEdit,
    onUpdate
}: InlineKioskEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedKioskId, setSelectedKioskId] = useState(ticket.kioskId);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleStartEdit = () => {
        setIsEditing(true);
        setSelectedKioskId(ticket.kioskId);
        setError(null);
        setSuccess(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setSelectedKioskId(ticket.kioskId);
        setError(null);
        setSuccess(false);
    };

    const handleSave = async () => {
        if (selectedKioskId === ticket.kioskId) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await updateTicketKioskAction(
                workspaceId,
                ticket.id,
                selectedKioskId
            );

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    setIsEditing(false);
                    setSuccess(false);
                    onUpdate?.(true);
                }, 1000);
            } else {
                setError(result.error || 'Failed to update kiosk');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update kiosk');
        } finally {
            setIsLoading(false);
        }
    };

    if (!canEdit) {
        // Read-only display for users without edit permissions
        return (
            <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Kiosk Location</p>
                    <div className="mt-1">
                        <p className="text-xs sm:text-sm text-gray-900 font-medium">
                            {currentKiosk.address}
                        </p>
                        {currentKiosk.locationDescription && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                {currentKiosk.locationDescription}
                            </p>
                        )}
                        <div className="flex items-center mt-1">
                            <Badge 
                                variant="secondary" 
                                className={`text-xs ${statusColors[currentKiosk.status as keyof typeof statusColors] || statusColors.ACTIVE}`}
                            >
                                {currentKiosk.status}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="space-y-4">
                {/* Current kiosk display */}
                <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">Current Kiosk</p>
                        <div className="mt-1 p-2 bg-gray-50 rounded-md">
                            <p className="text-xs sm:text-sm text-gray-900 font-medium">
                                {currentKiosk.address}
                            </p>
                            {currentKiosk.locationDescription && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {currentKiosk.locationDescription}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Kiosk selector */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                        Select New Kiosk
                    </label>
                    <KioskSelector
                        kiosks={workspaceKiosks}
                        value={selectedKioskId}
                        onChange={setSelectedKioskId}
                        placeholder="Search and select a kiosk..."
                        error={error || undefined}
                        disabled={isLoading}
                    />
                </div>

                {/* Success message */}
                {success && (
                    <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs sm:text-sm">Kiosk updated successfully!</span>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex space-x-2">
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={isLoading || success || !selectedKioskId}
                        className="min-h-[32px]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Updating...
                            </>
                        ) : success ? (
                            'Updated!'
                        ) : (
                            'Update Kiosk'
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isLoading || success}
                        className="min-h-[32px]"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    // Display mode with edit capability
    return (
        <div 
            className="flex items-start space-x-3 group cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-md transition-colors"
            onClick={handleStartEdit}
        >
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-900">Kiosk Location</p>
                <div className="mt-1">
                    <p className="text-xs sm:text-sm text-gray-900 font-medium">
                        {currentKiosk.address}
                    </p>
                    {currentKiosk.locationDescription && (
                        <p className="text-xs text-gray-500 mt-0.5">
                            {currentKiosk.locationDescription}
                        </p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                        <Badge 
                            variant="secondary" 
                            className={`text-xs ${statusColors[currentKiosk.status as keyof typeof statusColors] || statusColors.ACTIVE}`}
                        >
                            {currentKiosk.status}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit className="h-3 w-3 mr-1" />
                            Click to change
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 