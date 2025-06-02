'use client';

import GlobalStats from '@/components/dashboard/global-stats';
import { UserMenu } from '@/components/ui/user-menu';
import WorkspaceSelector from '@/components/dashboard/workspace-selector';
import { GlobalDashboardStats } from '@/lib/server/dashboard-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Ticket, Building2 } from 'lucide-react';

interface DashboardClientProps {
    userWorkspaces: Array<{
        workspace: {
            id: string;
            workspaceId: string;
            name: string;
            description: string | null;
            createdBy: string;
            createdAt: string | null;
            updatedAt: string | null;
        };
        role: 'ADMIN' | 'MEMBER' | 'VIEWER';
        joinedAt: string;
    }>;
    user: {
        id: string;
        email: string;
        username: string;
        name: string;
    };
    globalStats: GlobalDashboardStats;
}

export default function DashboardClient({ userWorkspaces, user, globalStats }: DashboardClientProps) {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome back, {user.name}</p>
                    </div>
                    <UserMenu />
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Global Tickets */}
                                <Button
                                    variant="outline"
                                    className="h-20 justify-start p-4"
                                    onClick={() => router.push('/tickets')}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <Ticket className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">All Tickets</div>
                                            <div className="text-sm text-gray-500">
                                                View across workspaces
                                            </div>
                                        </div>
                                    </div>
                                </Button>

                                {/* Workspaces */}
                                <Button
                                    variant="outline"
                                    className="h-20 justify-start p-4"
                                    onClick={() => {
                                        if (userWorkspaces.length === 1) {
                                            router.push(`/workspace/${userWorkspaces[0].workspace.id}`);
                                        } else {
                                            // Navigate to first workspace for now
                                            router.push(`/workspace/${userWorkspaces[0]?.workspace.id || ''}`);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                            <Building2 className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">Workspaces</div>
                                            <div className="text-sm text-gray-500">
                                                Manage kiosks & teams
                                            </div>
                                        </div>
                                    </div>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Global Stats */}
                {userWorkspaces.length > 0 && (
                    <div className="mb-8">
                        <GlobalStats stats={globalStats} />
                    </div>
                )}

                {/* Workspace Selector */}
                <WorkspaceSelector userWorkspaces={userWorkspaces} />
            </div>
        </div>
    );
} 