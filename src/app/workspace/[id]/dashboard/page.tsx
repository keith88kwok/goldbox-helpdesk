'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Wrench, Ticket, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkspaceDashboard() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { currentWorkspace, userRole } = useWorkspace();

    const id = params.id as string;

    // Note: Authentication and workspace access checks are now handled by RouteGuard
    // This component can focus purely on rendering the dashboard

    const getRoleBadgeColor = (role: string | null) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-red-100 text-red-800';
            case 'MEMBER':
                return 'bg-blue-100 text-blue-800';
            case 'VIEWER':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

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
                                onClick={() => router.push('/workspaces')}
                                className="mr-4"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Workspaces
                            </Button>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {currentWorkspace?.name || 'Loading...'}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {currentWorkspace?.description || 'No description'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Badge className={getRoleBadgeColor(userRole)}>
                                {userRole || 'VIEWER'}
                            </Badge>
                            <span className="text-sm text-gray-600">
                                {user?.name}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Welcome to {currentWorkspace?.name || 'your workspace'}
                    </h2>
                    <p className="text-gray-600">
                        Manage your kiosk maintenance activities from this workspace dashboard.
                    </p>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Kiosks Card */}
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center">
                                <Building2 className="h-8 w-8 text-blue-600 mr-3" />
                                <div>
                                    <CardTitle>Kiosks</CardTitle>
                                    <CardDescription>Manage kiosk locations and status</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                View and manage all kiosks in this workspace.
                            </p>
                            <Button
                                className="w-full"
                                onClick={() => router.push(`/workspace/${id}/kiosks`)}
                            >
                                View Kiosks
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Tickets Card */}
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center">
                                <Ticket className="h-8 w-8 text-green-600 mr-3" />
                                <div>
                                    <CardTitle>Tickets</CardTitle>
                                    <CardDescription>Track maintenance requests</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                Create and manage maintenance tickets.
                            </p>
                            <Button
                                className="w-full"
                                disabled
                                variant="outline"
                            >
                                Coming Soon
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Team Card */}
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center">
                                <Users className="h-8 w-8 text-purple-600 mr-3" />
                                <div>
                                    <CardTitle>Team</CardTitle>
                                    <CardDescription>Manage workspace members</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                Invite and manage team members.
                            </p>
                            <Button
                                className="w-full"
                                disabled
                                variant="outline"
                            >
                                Coming Soon
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Kiosks</CardDescription>
                            <CardTitle className="text-2xl">0</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Open Tickets</CardDescription>
                            <CardTitle className="text-2xl">0</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Team Members</CardDescription>
                            <CardTitle className="text-2xl">1</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Your Role</CardDescription>
                            <CardTitle className="text-lg">{userRole || 'VIEWER'}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates in this workspace</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-gray-500">
                            <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>No recent activity</p>
                            <p className="text-sm">Activity will appear here once you start using the workspace.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 