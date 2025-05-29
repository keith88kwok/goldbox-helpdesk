'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/utils/amplify-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { type SelectedTicket, type SelectedWorkspace } from '@/lib/server/ticket-utils';
import { type SelectedKiosk } from '@/lib/server/kiosk-utils';

const client = generateClient<Schema>();

interface EditTicketClientProps {
    ticket: SelectedTicket;
    workspace: SelectedWorkspace;
    workspaceId: string;
    kiosks: SelectedKiosk[];
    workspaceUsers: {
        id: string;
        userId: string;
        name: string;
        email: string;
        role: string;
    }[];
}

export default function EditTicketClient({
    ticket,
    workspace,
    workspaceId,
    kiosks,
    workspaceUsers
}: EditTicketClientProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Pre-populate form with existing ticket data
    const [formData, setFormData] = useState({
        kioskId: ticket.kioskId,
        assigneeId: ticket.assigneeId || '',
        title: ticket.title,
        description: ticket.description,
        status: ticket.status || 'OPEN',
        maintenanceTime: ticket.maintenanceTime ? 
            new Date(ticket.maintenanceTime).toISOString().slice(0, 16) : ''
    });

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError(null); // Clear error when user starts typing
        if (success) setSuccess(false); // Clear success message when user makes changes
    };

    const validateForm = () => {
        if (!formData.kioskId) {
            setError('Please select a kiosk');
            return false;
        }
        if (!formData.title.trim()) {
            setError('Title is required');
            return false;
        }
        if (!formData.description.trim()) {
            setError('Description is required');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            // Update the ticket using Amplify client
            const { data: updatedTicket, errors } = await client.models.Ticket.update({
                id: ticket.id,
                kioskId: formData.kioskId,
                assigneeId: formData.assigneeId || null,
                title: formData.title.trim(),
                description: formData.description.trim(),
                status: formData.status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED",
                maintenanceTime: formData.maintenanceTime || null,
                updatedDate: new Date().toISOString(),
            });

            if (errors && errors.length > 0) {
                throw new Error(`Failed to update ticket: ${errors.map(e => e.message).join(', ')}`);
            }

            if (!updatedTicket) {
                throw new Error('Failed to update ticket: No data returned');
            }

            setSuccess(true);
            
            // Redirect to ticket detail page after a short delay
            setTimeout(() => {
                router.push(`/workspace/${workspaceId}/tickets/${ticket.id}`);
            }, 1500);
        } catch (err) {
            console.error('Error updating ticket:', err);
            setError(err instanceof Error ? err.message : 'Failed to update ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push(`/workspace/${workspaceId}/tickets/${ticket.id}`);
    };

    return (
        <div className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-2 sm:gap-4 mb-4">
                    <Link href={`/workspace/${workspaceId}/tickets/${ticket.id}`}>
                        <Button variant="ghost" size="sm" className="w-fit">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Ticket
                        </Button>
                    </Link>
                </div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Edit Ticket</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Update ticket details for {workspace.name}</p>
            </div>

            {/* Form */}
            <Card>
                <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-base sm:text-lg">Ticket Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex items-center gap-3">
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                                <p className="text-sm sm:text-base text-green-700">Ticket updated successfully! Redirecting...</p>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-center gap-3">
                                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                                <p className="text-sm sm:text-base text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Kiosk Selection */}
                        <FormField label="Kiosk" required>
                            <select
                                value={formData.kioskId}
                                onChange={(e) => handleInputChange('kioskId', e.target.value)}
                                className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                required
                            >
                                <option value="">Select a kiosk</option>
                                {kiosks.map((kiosk) => (
                                    <option key={kiosk.id} value={kiosk.id}>
                                        {kiosk.address} - {kiosk.status}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        {/* Assignee Selection */}
                        <FormField label="Assignee">
                            <select
                                value={formData.assigneeId}
                                onChange={(e) => handleInputChange('assigneeId', e.target.value)}
                                className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Unassigned</option>
                                {workspaceUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email}) - {user.role}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Optional - leave blank for unassigned</p>
                        </FormField>

                        {/* Title */}
                        <FormField label="Title" required>
                            <Input
                                placeholder="Brief description of the issue"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                required
                                className="text-base" /* Prevent iOS zoom */
                            />
                        </FormField>

                        {/* Description */}
                        <FormField label="Description" required>
                            <Textarea
                                placeholder="Detailed description of the maintenance issue..."
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={4}
                                required
                                className="text-base min-h-[120px]" /* Prevent iOS zoom */
                            />
                        </FormField>

                        {/* Status */}
                        <FormField label="Status">
                            <select
                                value={formData.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </FormField>

                        {/* Maintenance Time */}
                        <FormField label="Scheduled Maintenance Time">
                            <Input
                                type="datetime-local"
                                value={formData.maintenanceTime}
                                onChange={(e) => handleInputChange('maintenanceTime', e.target.value)}
                                className="text-base" /* Prevent iOS zoom */
                            />
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Optional</p>
                        </FormField>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto min-h-[44px]"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                isLoading={isSubmitting}
                                disabled={isSubmitting || success}
                                className="w-full sm:w-auto min-h-[44px]"
                            >
                                {isSubmitting ? 'Updating...' : success ? 'Updated!' : 'Update Ticket'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 