'use client';

import { useRouter } from 'next/navigation';
import { type SelectedKiosk } from '@/lib/server/kiosk-utils';
import { type SelectedWorkspace } from '@/lib/server/workspace-utils';
import { type Attachment } from '@/lib/types/attachment';
import { type MaintenanceRecord } from '@/lib/server/kiosk-maintenance-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KioskAttachmentManager } from '@/components/kiosks/kiosk-attachment-manager';
import MaintenanceRecords from '@/components/kiosks/maintenance-records';
import { 
    Building2, 
    ArrowLeft, 
    Edit,
    MapPin,
    FileText,
    AlertCircle,
    CheckCircle,
    Clock,
    Calendar
} from 'lucide-react';

interface KioskDetailClientProps {
    kiosk: SelectedKiosk;
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
    workspaceId: string;
    initialAttachments?: Attachment[];
    maintenanceRecords: MaintenanceRecord[];
}

export default function KioskDetailClient({ 
    kiosk, 
    workspace, 
    userRole, 
    workspaceId, 
    initialAttachments, 
    maintenanceRecords 
}: KioskDetailClientProps) {
    const router = useRouter();

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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-0 sm:h-16 gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/workspace/${workspaceId}/kiosks`)}
                                className="w-fit sm:w-auto"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Kiosks
                            </Button>
                            <div className="flex items-center">
                                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
                                <div>
                                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                                        Kiosk Details
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        {workspace.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {canEditKiosk && (
                            <Button
                                onClick={() => router.push(`/workspace/${workspaceId}/kiosks/${kiosk.id}/edit`)}
                                className="w-full sm:w-auto flex items-center justify-center"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Kiosk
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                <div className="space-y-4 sm:space-y-6">
                    {/* Header Info */}
                    <Card>
                        <CardHeader className="pb-3 sm:pb-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2">
                                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                                        <CardTitle className="text-lg sm:text-2xl line-clamp-2">
                                            {kiosk.address || 'No address'}
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-sm sm:text-lg">
                                        {kiosk.locationDescription || 'No location description provided'}
                                    </CardDescription>
                                </div>
                                <div className="flex-shrink-0">
                                    {getStatusBadge(kiosk.status)}
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Details Grid - Redesigned for Better Alignment */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Left Column - Combined Basic & Additional Information */}
                        <Card className="flex flex-col h-full">
                            <CardHeader className="pb-3 flex-shrink-0">
                                <CardTitle className="flex items-center text-base sm:text-lg">
                                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                    Kiosk Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4 sm:space-y-5">
                                {/* Basic Information Section */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Kiosk ID</label>
                                        <p className="text-sm text-gray-600 font-mono break-all bg-gray-50 px-2 py-1 rounded">
                                            {kiosk.kioskId}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Address</label>
                                        <p className="text-sm text-gray-900 break-words">
                                            {kiosk.address || 'Not provided'}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Location Description</label>
                                        <p className="text-sm text-gray-900 break-words">
                                            {kiosk.locationDescription || 'Not provided'}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Status</label>
                                        <div className="flex">
                                            {getStatusBadge(kiosk.status)}
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-200"></div>

                                {/* Additional Details Section */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Details</h4>
                                    
                                    <div>
                                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Description</label>
                                        <div className="text-sm text-gray-900 whitespace-pre-wrap break-words min-h-[3rem] bg-gray-50 px-3 py-2 rounded">
                                            {kiosk.description || 'No description provided'}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Remarks</label>
                                        <div className="text-sm text-gray-900 whitespace-pre-wrap break-words min-h-[3rem] bg-gray-50 px-3 py-2 rounded">
                                            {kiosk.remark || 'No remarks'}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Right Column - Record Information & Maintenance Summary */}
                        <Card className="flex flex-col h-full">
                            <CardHeader className="pb-3 flex-shrink-0">
                                <CardTitle className="flex items-center text-base sm:text-lg">
                                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                    Record & Activity Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4 sm:space-y-5">
                                {/* Record Information Section */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Created</label>
                                        <p className="text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">
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
                                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Last Updated</label>
                                        <p className="text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">
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
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-200"></div>

                                {/* Maintenance Activity Summary */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Maintenance Activity</h4>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-blue-50 px-3 py-2 rounded-lg text-center">
                                            <p className="text-lg font-semibold text-blue-600">
                                                {maintenanceRecords.length}
                                            </p>
                                            <p className="text-xs text-blue-600">Total Records</p>
                                        </div>
                                        
                                        <div className="bg-red-50 px-3 py-2 rounded-lg text-center">
                                            <p className="text-lg font-semibold text-red-600">
                                                {maintenanceRecords.filter(r => r.status === 'OPEN').length}
                                            </p>
                                            <p className="text-xs text-red-600">Open Issues</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-yellow-50 px-3 py-2 rounded-lg text-center">
                                            <p className="text-lg font-semibold text-yellow-600">
                                                {maintenanceRecords.filter(r => r.status === 'IN_PROGRESS').length}
                                            </p>
                                            <p className="text-xs text-yellow-600">In Progress</p>
                                        </div>
                                        
                                        <div className="bg-green-50 px-3 py-2 rounded-lg text-center">
                                            <p className="text-lg font-semibold text-green-600">
                                                {maintenanceRecords.filter(r => r.status === 'RESOLVED' || r.status === 'CLOSED').length}
                                            </p>
                                            <p className="text-xs text-green-600">Completed</p>
                                        </div>
                                    </div>

                                    {maintenanceRecords.length > 0 && (
                                        <div className="bg-gray-50 px-3 py-2 rounded-lg">
                                            <label className="text-xs font-medium text-gray-700 block mb-1">Last Activity</label>
                                            <p className="text-sm text-gray-900">
                                                {new Date(maintenanceRecords[0].reportedDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Maintenance History - Full Width Section */}
                    <Card className="w-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-base sm:text-lg">
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Maintenance History
                            </CardTitle>
                            <CardDescription className="text-sm">
                                Complete maintenance tracking and ticket history for this kiosk
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MaintenanceRecords
                                records={maintenanceRecords}
                                workspaceId={workspaceId}
                                kioskId={kiosk.id}
                                userRole={userRole}
                            />
                        </CardContent>
                    </Card>

                    {/* Location Photos & Documents */}
                    <Card className="w-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-base sm:text-lg">
                                <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Location Photos & Documents
                            </CardTitle>
                            <CardDescription className="text-sm">
                                Upload and manage photos and documents for this kiosk location
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <KioskAttachmentManager
                                kioskId={kiosk.id}
                                workspaceId={workspaceId}
                                initialAttachments={initialAttachments}
                                canUpload={canEditKiosk}
                                canDelete={canEditKiosk}
                            />
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-6 border-t gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/workspace/${workspaceId}/kiosks`)}
                            className="w-full sm:w-auto"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Kiosks
                        </Button>
                        
                        {canEditKiosk && (
                            <Button
                                onClick={() => router.push(`/workspace/${workspaceId}/kiosks/${kiosk.id}/edit`)}
                                className="w-full sm:w-auto"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Kiosk
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 