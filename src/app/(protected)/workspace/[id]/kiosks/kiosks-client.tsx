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
    Upload,
    Grid3X3,
    List
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
    const [searchTerm, setSearchTerm] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'cards'>('list'); // Default to list view

    // Filter kiosks based on search term
    const filteredKiosks = kiosks.filter(kiosk => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (kiosk.address || '').toLowerCase().includes(searchLower) ||
            (kiosk.locationDescription || '').toLowerCase().includes(searchLower) ||
            (kiosk.description || '').toLowerCase().includes(searchLower) ||
            (kiosk.kioskId || '').toLowerCase().includes(searchLower)
        );
    });

    const handleImportComplete = () => {
        setShowImportModal(false);
        // Refresh the page to show new kiosks
        window.location.reload();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
            case 'MAINTENANCE':
                return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Maintenance</Badge>;
            case 'INACTIVE':
                return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
            case 'RETIRED':
                return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Retired</Badge>;
            case 'UNKNOWN':
                return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
        }
    };

    const canEditKiosks = userRole === 'ADMIN' || userRole === 'MEMBER';

    // View Toggle Component
    const ViewToggle = () => (
        <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
                onClick={() => setViewMode('list')}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${viewMode === 'list' 
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }
                `}
            >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
            </button>
            <button
                onClick={() => setViewMode('cards')}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${viewMode === 'cards' 
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }
                `}
            >
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline">Cards</span>
            </button>
        </div>
    );

    // List View Component
    const ListView = () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            {canEditKiosks && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredKiosks.map((kiosk) => (
                            <tr
                                key={kiosk.id}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => router.push(`/workspace/${workspace.id}/kiosks/${kiosk.id}`)}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-start">
                                        <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                                {kiosk.address || 'No address'}
                                            </div>
                                            <div className="text-sm text-gray-500 line-clamp-1">
                                                {kiosk.locationDescription || 'No location description'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 line-clamp-2">
                                        {kiosk.description || 'No description'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(kiosk.status || 'UNKNOWN')}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">
                                        {new Date(kiosk.createdAt || '').toLocaleDateString()}
                                    </div>
                                </td>
                                {canEditKiosks && (
                                    <td className="px-6 py-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/workspace/${workspace.id}/kiosks/${kiosk.id}/edit`);
                                            }}
                                            className="flex items-center gap-1"
                                        >
                                            <Settings className="h-3 w-3" />
                                            Edit
                                        </Button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-gray-200">
                {filteredKiosks.map((kiosk) => (
                    <div
                        key={kiosk.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/workspace/${workspace.id}/kiosks/${kiosk.id}`)}
                    >
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-start min-w-0 flex-1">
                                <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                        {kiosk.address || 'No address'}
                                    </div>
                                    <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                                        {kiosk.locationDescription || 'No location description'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                {getStatusBadge(kiosk.status || 'UNKNOWN')}
                            </div>
                        </div>
                        
                        {kiosk.description && (
                            <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {kiosk.description}
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between">
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
                                    className="min-h-[44px] flex items-center gap-1"
                                >
                                    <Settings className="h-3 w-3" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Cards View Component (existing implementation)
    const CardsView = () => (
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
                                {getStatusBadge(kiosk.status || 'UNKNOWN')}
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
    );

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

                {/* Results Header with View Toggle */}
                {filteredKiosks.length > 0 && (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                            <h2 className="text-base sm:text-lg font-medium text-gray-900">
                                {filteredKiosks.length} kiosk{filteredKiosks.length !== 1 ? 's' : ''} found
                                {searchTerm && ` for "${searchTerm}"`}
                            </h2>
                            <ViewToggle />
                        </div>

                        {/* Conditional View Rendering */}
                        {viewMode === 'list' ? <ListView /> : <CardsView />}
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