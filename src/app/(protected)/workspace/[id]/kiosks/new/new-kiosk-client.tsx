'use client';

import { useRouter } from 'next/navigation';
import { type SelectedWorkspace } from '@/lib/server/workspace-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
    Building2, 
    ArrowLeft, 
    Save,
    MapPin,
    FileText,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { useState } from 'react';
import { client } from '@/lib/amplify-client';

interface NewKioskClientProps {
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
    workspaceId: string;
}

export default function NewKioskClient({ workspace, userRole, workspaceId }: NewKioskClientProps) {
    const router = useRouter();
    
    // State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        address: '',
        locationDescription: '',
        description: '',
        remark: '',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED'
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.address.trim()) {
            setError('Address is required');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { data: newKiosk, errors } = await client.models.Kiosk.create({
                kioskId: `kiosk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                address: formData.address.trim(),
                locationDescription: formData.locationDescription.trim() || null,
                description: formData.description.trim() || null,
                remark: formData.remark.trim() || null,
                status: formData.status,
                workspaceId: workspace.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            if (errors && errors.length > 0) {
                console.error('Error creating kiosk:', errors);
                setError('Failed to create kiosk. Please try again.');
                return;
            }

            console.log('Kiosk created successfully:', newKiosk);
            setSuccess(true);
            
            // Redirect after success
            setTimeout(() => {
                router.push(`/workspace/${workspaceId}/kiosks`);
            }, 2000);

        } catch (err) {
            console.error('Error creating kiosk:', err);
            setError('Failed to create kiosk. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        router.push(`/workspace/${workspaceId}/kiosks`);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center text-green-600">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Kiosk Created Successfully
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">
                            Your new kiosk has been added to the workspace.
                        </p>
                        <p className="text-sm text-gray-500">
                            Redirecting you back to the kiosks list...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/workspace/${workspaceId}/kiosks`)}
                                className="mr-4"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Kiosks
                            </Button>
                            <div className="flex items-center">
                                <Building2 className="h-6 w-6 text-blue-600 mr-3" />
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">
                                        Add New Kiosk
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        {workspace.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Kiosk Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Address */}
                            <div>
                                <Label htmlFor="address" className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Address *
                                </Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    placeholder="Enter the kiosk address..."
                                    required
                                    className="mt-1"
                                />
                            </div>

                            {/* Location Description */}
                            <div>
                                <Label htmlFor="locationDescription">
                                    Location Description
                                </Label>
                                <Input
                                    id="locationDescription"
                                    value={formData.locationDescription}
                                    onChange={(e) => handleInputChange('locationDescription', e.target.value)}
                                    placeholder="e.g., Near main entrance, Ground floor, etc."
                                    className="mt-1"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description" className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Additional details about this kiosk..."
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>

                            {/* Remark */}
                            <div>
                                <Label htmlFor="remark">
                                    Remark
                                </Label>
                                <Textarea
                                    id="remark"
                                    value={formData.remark}
                                    onChange={(e) => handleInputChange('remark', e.target.value)}
                                    placeholder="Any special notes or remarks..."
                                    rows={2}
                                    className="mt-1"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <Label htmlFor="status">
                                    Initial Status
                                </Label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                    <option value="RETIRED">Retired</option>
                                </select>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    {error}
                                </div>
                            )}

                            {/* Form Actions */}
                            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Create Kiosk
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 