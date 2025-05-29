'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRedirect } from '@/hooks/use-redirect';

export default function HomePage() {
    const { isAuthenticated, isLoading, isInitializing } = useAuth();
    const { redirectToLogin, redirectToWorkspaces } = useRedirect();

    useEffect(() => {
        if (!isLoading && !isInitializing) {
            if (isAuthenticated) {
                // Redirect authenticated users to their workspaces with reason
                redirectToWorkspaces('Welcome back! Please select a workspace to continue.');
            } else {
                // Redirect unauthenticated users to login with reason
                redirectToLogin('Welcome! Please log in to access the helpdesk system.');
            }
        }
    }, [isAuthenticated, isLoading, isInitializing, redirectToLogin, redirectToWorkspaces]);

    // Show loading while determining where to redirect
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading helpdesk system...</p>
            </div>
        </div>
    );
} 