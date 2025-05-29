'use client';

import { useRouter } from 'next/navigation';
import { type SelectedKiosk } from '@/lib/server/kiosk-utils';
import { type SelectedWorkspace } from '@/lib/server/workspace-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Building2,
    Plus,
    ArrowLeft,
    Search,
    MapPin,
    Settings,
    AlertCircle,
    CheckCircle,
    Clock,
    Upload
} from 'lucide-react';
import { useState } from 'react';
import { KioskImportModal } from '@/components/kiosk-import-modal';

interface KiosksClientProps {
    kiosks: SelectedKiosk[];
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export default function KiosksClient({ kiosks, workspace, userRole }: KiosksClientProps) {
    const router = useRouter();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);

    // Handle import completion
    const handleImportComplete = () => {
        setShowImportModal(false);
        // Refresh the page to show new kiosks
        router.refresh();
    };

    // Filter kiosks based on search term
    const filteredKiosks = kiosks.filter(kiosk =>
        kiosk.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kiosk.locationDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kiosk.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    const canEditKiosks = userRole === 'ADMIN' || userRole === 'MEMBER';

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
                                onClick={() => router.push(`/workspace/${workspace.id}/dashboard`)}
                                className="w-fit sm:w-auto"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <div className="flex items-center">
                                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
                                <div>
                                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                                        Kiosks
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        {workspace.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {canEditKiosks && (
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowImportModal(true)}
                                    className="w-full sm:w-auto flex items-center justify-center"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import Kiosks
                                </Button>
                                <Button
                                    onClick={() => router.push(`/workspace/${workspace.id}/kiosks/new`)}
                                    className="w-full sm:w-auto flex items-center justify-center"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Kiosk
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Search and Filter Bar */}
                <div className="mb-4 sm:mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search kiosks by address, location, or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 text-base" /* Prevent iOS zoom */
                        />
                    </div>
                </div>

                {/* Empty State */}
                {filteredKiosks.length === 0 && kiosks.length === 0 && (
                    <div className="text-center py-8 sm:py-12 px-4">
                        <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No kiosks yet</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
                            Get started by adding your first kiosk to this workspace.
                        </p>
                        {canEditKiosks && (
                            <Button onClick={() => router.push(`/workspace/${workspace.id}/kiosks/new`)} className="w-full sm:w-auto">
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Kiosk
                            </Button>
                        )}
                    </div>
                )}

                {/* No Search Results */}
                {filteredKiosks.length === 0 && kiosks.length > 0 && (
                    <div className="text-center py-8 sm:py-12 px-4">
                        <Search className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No results found</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-md mx-auto">
                            Try adjusting your search terms.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setSearchTerm('')}
                            className="w-full sm:w-auto"
                        >
                            Clear Search
                        </Button>
                    </div>
                )}

                {/* Kiosks Grid */}
                {filteredKiosks.length > 0 && (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
                            <h2 className="text-base sm:text-lg font-medium text-gray-900">
                                {filteredKiosks.length} kiosk{filteredKiosks.length !== 1 ? 's' : ''} found
                                {searchTerm && ` for "${searchTerm}"`}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {filteredKiosks.map((kiosk) => (
                                <Card
                                    key={kiosk.id}
                                    className="hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
                                    onClick={() => router.push(`/workspace/${workspace.id}/kiosks/${kiosk.id}`)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center mb-2">
                                                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-2 flex-shrink-0" />
                                                    <CardTitle className="text-base sm:text-lg font-medium line-clamp-1">
                                                        {kiosk.address || 'No address'}
                                                    </CardTitle>
                                                </div>
                                                <CardDescription className="text-sm line-clamp-2">
                                                    {kiosk.locationDescription || 'No location description'}
                                                </CardDescription>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {getStatusBadge(kiosk.status)}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {kiosk.description && (
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                                {kiosk.description}
                                            </p>
                                        )}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <span className="text-xs text-gray-500">
                                                Added {new Date(kiosk.createdAt || '').toLocaleDateString()}
                                            </span>
                                            {canEditKiosks && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/workspace/${workspace.id}/kiosks/${kiosk.id}/edit`);
                                                    }}
                                                    className="w-full sm:w-auto min-h-[44px] flex items-center justify-center"
                                                >
                                                    <Settings className="h-3 w-3 mr-1" />
                                                    Edit
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}

                {/* Summary */}
                {filteredKiosks.length > 0 && (
                    <div className="mt-6 sm:mt-8 text-center text-gray-500 px-4">
                        <p className="text-sm">
                            Showing {filteredKiosks.length} of {kiosks.length} kiosks
                        </p>
                    </div>
                )}
            </div>

            {/* Import Modal */}
            <KioskImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                workspaceId={workspace.id}
                onImportComplete={handleImportComplete}
            />
        </div>
    );
} 