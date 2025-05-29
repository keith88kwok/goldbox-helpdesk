'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Building2, 
    ArrowLeft, 
    Edit,
    MapPin,
    FileText,
    AlertCircle,
    CheckCircle,
    Clock,
    Calendar,
    User
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { client } from '@/lib/amplify-client';
import { type Schema } from '@/lib/amplify-client';

type KioskType = Schema['Kiosk']['type'];

export default function KioskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { currentWorkspace, userRole } = useWorkspace();
    
    const id = params.id as string;
    const kioskId = params.kioskId as string;
    
    // State
    const [kiosk, setKiosk] = useState<KioskType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch kiosk details
    useEffect(() => {
        const fetchKiosk = async () => {
            if (!currentWorkspace?.id || !kioskId) return;
            
            try {
                setIsLoading(true);
                setError(null);
                
                const { data: kioskData, errors } = await client.models.Kiosk.get({
                    id: kioskId
                });
                
                if (errors && errors.length > 0) {
                    console.error('Error fetching kiosk:', errors);
                    setError('Failed to load kiosk details');
                    return;
                }
                
                // Verify the kiosk belongs to the current workspace
                if (kioskData && kioskData.workspaceId !== currentWorkspace.id) {
                    setError('Kiosk not found in this workspace');
                    return;
                }
                
                setKiosk(kioskData);
            } catch (err) {
                console.error('Error fetching kiosk:', err);
                setError('Failed to load kiosk details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchKiosk();
    }, [currentWorkspace?.id, kioskId]);

    // Status badge colors
    const getStatusBadge = (status: string | null | undefined) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
            case 'MAINTENANCE':
                return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Maintenance</Badge>;
            case 'INACTIVE':
                return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
            case 'RETIRED':
                return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Retired</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
        }
    };

    const canEditKiosk = userRole === 'ADMIN' || userRole === 'MEMBER';

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
                                onClick={() => router.push(`/workspace/${id}/kiosks`)}
                                className="mr-4"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Kiosks
                            </Button>
                            <div className="flex items-center">
                                <Building2 className="h-6 w-6 text-blue-600 mr-3" />
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">
                                        Kiosk Details
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        {currentWorkspace?.name || 'Loading...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {canEditKiosk && kiosk && (
                            <Button
                                onClick={() => router.push(`/workspace/${id}/kiosks/${kioskId}/edit`)}
                                className="flex items-center"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Kiosk
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading kiosk details...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button 
                            variant="outline" 
                            onClick={() => router.push(`/workspace/${id}/kiosks`)}
                        >
                            Back to Kiosks
                        </Button>
                    </div>
                )}

                {/* Kiosk Details */}
                {!isLoading && !error && kiosk && (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                                            <CardTitle className="text-2xl">
                                                {kiosk.address || 'No address'}
                                            </CardTitle>
                                        </div>
                                        <CardDescription className="text-lg">
                                            {kiosk.locationDescription || 'No location description provided'}
                                        </CardDescription>
                                    </div>
                                    <div className="ml-4">
                                        {getStatusBadge(kiosk.status)}
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <FileText className="h-5 w-5 mr-2" />
                                        Basic Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Kiosk ID</label>
                                        <p className="text-sm text-gray-600 font-mono">{kiosk.kioskId}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Address</label>
                                        <p className="text-sm text-gray-900">{kiosk.address || 'Not provided'}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Location Description</label>
                                        <p className="text-sm text-gray-900">{kiosk.locationDescription || 'Not provided'}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Status</label>
                                        <div className="mt-1">
                                            {getStatusBadge(kiosk.status)}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Additional Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <FileText className="h-5 w-5 mr-2" />
                                        Additional Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Description</label>
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {kiosk.description || 'No description provided'}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Remarks</label>
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {kiosk.remark || 'No remarks'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Metadata */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Calendar className="h-5 w-5 mr-2" />
                                        Record Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Created</label>
                                        <p className="text-sm text-gray-900">
                                            {kiosk.createdAt 
                                                ? new Date(kiosk.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : 'Unknown'
                                            }
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Last Updated</label>
                                        <p className="text-sm text-gray-900">
                                            {kiosk.updatedAt 
                                                ? new Date(kiosk.updatedAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : 'Unknown'
                                            }
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Attachments */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Location Attachments</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {kiosk.locationAttachments && kiosk.locationAttachments.length > 0 ? (
                                        <div className="space-y-2">
                                            {kiosk.locationAttachments.map((attachment, index) => (
                                                <div key={index} className="text-sm text-gray-600">
                                                    📎 {attachment}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No attachments</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-6 border-t">
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/workspace/${id}/kiosks`)}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Kiosks
                            </Button>
                            
                            {canEditKiosk && (
                                <Button
                                    onClick={() => router.push(`/workspace/${id}/kiosks/${kioskId}/edit`)}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Kiosk
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 