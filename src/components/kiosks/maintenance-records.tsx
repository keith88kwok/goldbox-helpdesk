'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type MaintenanceRecord } from '@/lib/server/kiosk-maintenance-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
    Calendar,
    Clock,
    User,
    Plus,
    Filter,
    ExternalLink,
    CheckCircle,
    AlertCircle,
    PlayCircle,
    XCircle
} from 'lucide-react';

interface MaintenanceRecordsProps {
    records: MaintenanceRecord[];
    workspaceId: string;
    kioskId: string;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

// Status color mapping
const statusConfig = {
    OPEN: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle,
        label: 'Open'
    },
    IN_PROGRESS: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: PlayCircle,
        label: 'In Progress'
    },
    RESOLVED: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        label: 'Resolved'
    },
    CLOSED: {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle,
        label: 'Closed'
    },
} as const;

export default function MaintenanceRecords({ 
    records, 
    workspaceId, 
    kioskId, 
    userRole 
}: MaintenanceRecordsProps) {
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Filter records based on status
    const filteredRecords = records.filter(record => {
        if (statusFilter === 'ALL') return true;
        return record.status === statusFilter;
    });

    // Format date helper
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status badge component
    const getStatusBadge = (status: string | null) => {
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.OPEN;
        const IconComponent = config.icon;
        
        return (
            <Badge className={`${config.color} flex items-center gap-1`}>
                <IconComponent className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    // Calculate summary statistics
    const totalRecords = records.length;
    const openRecords = records.filter(r => r.status === 'OPEN').length;
    const inProgressRecords = records.filter(r => r.status === 'IN_PROGRESS').length;

    const canCreateTicket = userRole === 'ADMIN' || userRole === 'MEMBER';

    return (
        <div className="space-y-4">
            {/* Header with summary and actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">Maintenance History</h3>
                    {totalRecords > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{totalRecords} total</span>
                            {openRecords > 0 && (
                                <span className="text-red-600">• {openRecords} open</span>
                            )}
                            {inProgressRecords > 0 && (
                                <span className="text-yellow-600">• {inProgressRecords} in progress</span>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Filter Toggle */}
                    {totalRecords > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filter
                        </Button>
                    )}
                    
                    {/* Create New Ticket */}
                    {canCreateTicket && (
                        <Link href={`/workspace/${workspaceId}/tickets/new?kioskId=${kioskId}`}>
                            <Button size="sm" className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                New Ticket
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Filter Options */}
            {isFilterOpen && totalRecords > 0 && (
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={statusFilter === 'ALL' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('ALL')}
                            >
                                All ({totalRecords})
                            </Button>
                            {Object.entries(statusConfig).map(([status, config]) => {
                                const count = records.filter(r => r.status === status).length;
                                if (count === 0) return null;
                                
                                return (
                                    <Button
                                        key={status}
                                        variant={statusFilter === status ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() => setStatusFilter(status)}
                                    >
                                        {config.label} ({count})
                                    </Button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Records List */}
            {filteredRecords.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {totalRecords === 0 ? 'No maintenance records yet' : 'No records match your filter'}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {totalRecords === 0 
                                    ? 'Start tracking maintenance by creating your first ticket.' 
                                    : 'Try adjusting your filter settings to see more records.'
                                }
                            </p>
                            {canCreateTicket && totalRecords === 0 && (
                                <Link href={`/workspace/${workspaceId}/tickets/new?kioskId=${kioskId}`}>
                                    <Button className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        Create First Ticket
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredRecords.map((record) => (
                        <Card key={record.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                            <h4 className="font-medium text-gray-900 line-clamp-1">
                                                {record.title}
                                            </h4>
                                            {getStatusBadge(record.status)}
                                        </div>
                                        
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                            {record.description}
                                        </p>
                                        
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Reported: {formatDate(record.reportedDate)}
                                            </div>
                                            
                                            {record.maintenanceTime && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Scheduled: {formatDate(record.maintenanceTime)}
                                                </div>
                                            )}
                                            
                                            {record.assigneeName && (
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {record.assigneeName}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                                        <Link href={`/workspace/${workspaceId}/tickets/${record.id}`}>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="flex items-center gap-2"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 