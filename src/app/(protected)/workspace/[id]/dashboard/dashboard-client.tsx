'use client';

import { useRouter } from 'next/navigation';
import { type SelectedWorkspace } from '@/lib/server/workspace-utils';
import { type WorkspaceStats } from '@/lib/server/dashboard-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserMenu } from '@/components/ui/user-menu';
import { Building2, Users, Clock, Ticket, ArrowLeft } from 'lucide-react';

interface DashboardClientProps {
    workspace: SelectedWorkspace;
    userRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
    stats: WorkspaceStats;
}

export default function DashboardClient({ workspace, userRole, stats }: DashboardClientProps) {
    const router = useRouter();

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
                                onClick={() => router.push('/workspaces')}
                                className="w-fit sm:w-auto"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Workspaces
                            </Button>
                            <div>
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                                    {workspace.name}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {workspace.description || 'No description'}
                                </p>
                            </div>
                        </div>
                        <UserMenu userRole={userRole} />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Welcome Section */}
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                        Welcome to {workspace.name}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">
                        Manage your kiosk maintenance activities from this workspace dashboard.
                    </p>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* Kiosks Card */}
                    <Card className="hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer">
                        <CardHeader className="pb-3">
                            <div className="flex items-center">
                                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-3 flex-shrink-0" />
                                <div className="min-w-0">
                                    <CardTitle className="text-base sm:text-lg">Kiosks</CardTitle>
                                    <CardDescription className="text-sm">Manage kiosk locations and status</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-sm text-gray-600 mb-4">
                                View and manage all kiosks in this workspace.
                            </p>
                            <Button
                                className="w-full min-h-[44px]"
                                onClick={() => router.push(`/workspace/${workspace.id}/kiosks`)}
                            >
                                View Kiosks
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Tickets Card */}
                    <Card className="hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer">
                        <CardHeader className="pb-3">
                            <div className="flex items-center">
                                <Ticket className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mr-3 flex-shrink-0" />
                                <div className="min-w-0">
                                    <CardTitle className="text-base sm:text-lg">Tickets</CardTitle>
                                    <CardDescription className="text-sm">Track maintenance requests</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-sm text-gray-600 mb-4">
                                Create and manage maintenance tickets.
                            </p>
                            <Button
                                className="w-full min-h-[44px]"
                                onClick={() => router.push(`/workspace/${workspace.id}/tickets`)}
                            >
                                View Tickets
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Team Card */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/workspace/${workspace.id}/team`)}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Team</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.teamMembers}</div>
                            <p className="text-xs text-muted-foreground">
                                Workspace members
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                    <Card>
                        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                            <CardDescription className="text-xs sm:text-sm">Total Kiosks</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl">{stats.totalKiosks}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                            <CardDescription className="text-xs sm:text-sm">Open Tickets</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl">{stats.openTickets}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                            <CardDescription className="text-xs sm:text-sm">Team Members</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl">{stats.teamMembers}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                            <CardDescription className="text-xs sm:text-sm">Your Role</CardDescription>
                            <CardTitle className="text-base sm:text-lg">{userRole}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
                        <CardDescription className="text-sm">Latest updates in this workspace</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-center py-6 sm:py-8 text-gray-500 px-4">
                            <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-blue-400" />
                            <p className="text-sm sm:text-base font-medium text-gray-900">Recent Activity - Coming Soon</p>
                            <p className="text-xs sm:text-sm mt-1 text-gray-600">We're working on bringing you real-time activity updates for your workspace.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 