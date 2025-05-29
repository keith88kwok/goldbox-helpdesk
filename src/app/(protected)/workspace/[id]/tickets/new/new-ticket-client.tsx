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
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { type SelectedWorkspace } from '@/lib/server/ticket-utils';
import { type SelectedKiosk } from '@/lib/server/kiosk-utils';

const client = generateClient<Schema>();

interface NewTicketClientProps {
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

export default function NewTicketClient({
    workspace,
    workspaceId,
    kiosks,
    workspaceUsers
}: NewTicketClientProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        kioskId: '',
        assigneeId: '',
        title: '',
        description: '',
        status: 'OPEN' as const,
        maintenanceTime: ''
    });

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError(null); // Clear error when user starts typing
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

        try {
            // Generate unique ticketId
            const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Create the ticket using Amplify client
            const { data: ticket, errors } = await client.models.Ticket.create({
                ticketId,
                workspaceId,
                kioskId: formData.kioskId,
                reporterId: 'temp-user-id', // TODO: Get actual user ID from auth context
                assigneeId: formData.assigneeId || null,
                title: formData.title.trim(),
                description: formData.description.trim(),
                status: formData.status,
                reportedDate: new Date().toISOString(),
                maintenanceTime: formData.maintenanceTime || null,
            });

            if (errors && errors.length > 0) {
                throw new Error(`Failed to create ticket: ${errors.map(e => e.message).join(', ')}`);
            }

            if (!ticket || !ticket.id) {
                throw new Error('Failed to create ticket: No data returned');
            }

            // Redirect to the tickets list page for now (since we don't have ticket detail page yet)
            router.push(`/workspace/${workspaceId}/tickets`);
        } catch (err) {
            console.error('Error creating ticket:', err);
            setError(err instanceof Error ? err.message : 'Failed to create ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push(`/workspace/${workspaceId}/tickets`);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link href={`/workspace/${workspaceId}/tickets`}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Tickets
                        </Button>
                    </Link>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Ticket</h1>
                <p className="text-gray-600 mt-1">Create a maintenance ticket for {workspace.name}</p>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Ticket Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                <p className="text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Kiosk Selection */}
                        <FormField label="Kiosk" required>
                            <select
                                value={formData.kioskId}
                                onChange={(e) => handleInputChange('kioskId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Unassigned</option>
                                {workspaceUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email}) - {user.role}
                                    </option>
                                ))}
                            </select>
                            <p className="text-sm text-gray-500 mt-1">Optional - leave blank for unassigned</p>
                        </FormField>

                        {/* Title */}
                        <FormField label="Title" required>
                            <Input
                                placeholder="Brief description of the issue"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                required
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
                            />
                        </FormField>

                        {/* Status */}
                        <FormField label="Status">
                            <select
                                value={formData.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            />
                            <p className="text-sm text-gray-500 mt-1">Optional</p>
                        </FormField>

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-6">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleCancel}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                isLoading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Ticket'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 