'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
    const { user, currentWorkspace, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, isLoading, router]);

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-semibold text-gray-900">Kiosk Helpdesk</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-700">
                                Welcome, <span className="font-medium">{user.name}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                Sign out
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Welcome Card */}
                        <div className="lg:col-span-2">
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                                        Welcome to your Helpdesk Dashboard
                                    </h2>
                                    <p className="text-gray-600 mb-6">
                                        Manage kiosk maintenance requests and track service activities across your workspaces.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h3 className="text-sm font-medium text-blue-900">Quick Actions</h3>
                                            <p className="text-xs text-blue-700 mt-1">Create tickets, view kiosks</p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <h3 className="text-sm font-medium text-green-900">Recent Activity</h3>
                                            <p className="text-xs text-green-700 mt-1">Latest maintenance updates</p>
                                        </div>
                                        <div className="bg-yellow-50 p-4 rounded-lg">
                                            <h3 className="text-sm font-medium text-yellow-900">Reports</h3>
                                            <p className="text-xs text-yellow-700 mt-1">Performance analytics</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User Info Sidebar */}
                        <div className="space-y-6">
                            {/* User Profile */}
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Your Profile</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Name</dt>
                                            <dd className="text-sm text-gray-900">{user.name}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Username</dt>
                                            <dd className="text-sm text-gray-900">{user.username}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                                            <dd className="text-sm text-gray-900">{user.email}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Workspace Info */}
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Workspaces</h3>
                                    {user.workspaces.length > 0 ? (
                                        <div className="space-y-3">
                                            {currentWorkspace && (
                                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                    <div className="text-sm font-medium text-blue-900">
                                                        Current: {currentWorkspace.name}
                                                    </div>
                                                    <div className="text-xs text-blue-700">
                                                        Role: {user.workspaces.find(w => w.workspace.id === currentWorkspace.id)?.role}
                                                    </div>
                                                </div>
                                            )}
                                            {user.workspaces.filter(w => w.workspace.id !== currentWorkspace?.id).map((workspace) => (
                                                <div key={workspace.workspace.id} className="p-3 bg-gray-50 rounded-lg">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {workspace.workspace.name}
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        Role: {workspace.role}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">
                                            No workspaces assigned. Contact your administrator.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 