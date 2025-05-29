'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { Button } from '@/components/ui/button';

interface RouteGuardProps {
    children: React.ReactNode;
}

// Define route patterns and their protection levels
const routeConfig = {
    // Public routes (no authentication required)
    public: [
        '/auth/login',
        '/auth/signup',
        '/auth/forgot-password',
        '/auth/reset-password'
    ],
    // Protected routes (authentication required)
    protected: [
        '/workspaces',
        '/profile',
        '/settings'
    ],
    // Workspace routes (authentication + workspace access required)
    workspace: [
        '/workspace'
    ]
};

function isPublicRoute(pathname: string): boolean {
    return routeConfig.public.some(route => pathname === route || pathname.startsWith(route));
}

function isWorkspaceRoute(pathname: string): boolean {
    return routeConfig.workspace.some(route => pathname.startsWith(route));
}

function isProtectedRoute(pathname: string): boolean {
    return !isPublicRoute(pathname);
}

export function RouteGuard({ children }: RouteGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { currentWorkspace, userWorkspaces, isLoading: workspaceLoading, error: workspaceError } = useWorkspace();

    const [isChecking, setIsChecking] = useState(true);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        const checkRouteAccess = async () => {
            console.log('🛡️ Route Guard checking access for:', pathname, {
                isAuthenticated,
                authLoading,
                workspaceLoading,
                isPublicRoute: isPublicRoute(pathname),
                isWorkspaceRoute: isWorkspaceRoute(pathname),
                currentWorkspace: currentWorkspace?.workspaceId
            });

            // Wait for auth loading to complete
            if (authLoading) {
                setIsChecking(true);
                setShouldRender(false);
                return;
            }

            // Public routes - always accessible
            if (isPublicRoute(pathname)) {
                console.log('✅ Public route access granted');
                setIsChecking(false);
                setShouldRender(true);
                return;
            }

            // Protected routes - require authentication
            if (!isAuthenticated) {
                console.log('🚫 Authentication required, redirecting to login');
                router.push('/auth/login');
                return;
            }

            // Workspace routes - require authentication + workspace access
            if (isWorkspaceRoute(pathname)) {
                // Wait for workspace loading to complete
                if (workspaceLoading) {
                    setIsChecking(true);
                    setShouldRender(false);
                    return;
                }

                // Check for workspace errors
                if (workspaceError) {
                    console.log('🚫 Workspace error, redirecting to workspace selection');
                    router.push('/workspaces');
                    return;
                }

                // Extract workspace ID from URL (now using [id] parameter)
                const workspaceIdMatch = pathname.match(/^\/workspace\/([^\/]+)/);
                if (workspaceIdMatch) {
                    const urlWorkspaceId = workspaceIdMatch[1]; // This is the Amplify id

                    // Check if user has access to this workspace 
                    // WorkspaceUser.workspaceId stores Workspace.id (Amplify auto-generated ID)
                    const hasAccess = userWorkspaces.some(wu => wu.workspaceId === urlWorkspaceId);
                    
                    if (!hasAccess) {
                        console.log('🚫 No access to workspace:', urlWorkspaceId);
                        console.log('📋 User workspaces:', userWorkspaces.map(wu => wu.workspaceId));
                        router.push('/workspaces');
                        return;
                    }

                    console.log('✅ Workspace route access granted');
                }
            } else {
                // Other protected routes
                console.log('✅ Protected route access granted');
            }

            setIsChecking(false);
            setShouldRender(true);
        };

        checkRouteAccess();
    }, [pathname, isAuthenticated, authLoading, workspaceLoading, workspaceError, currentWorkspace, userWorkspaces, router]);

    // Show loading state while checking access
    if (isChecking || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">
                        {authLoading ? 'Checking authentication...' : 'Verifying access...'}
                    </p>
                </div>
            </div>
        );
    }

    // Show error state for workspace issues
    if (workspaceError && isWorkspaceRoute(pathname)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-6">
                        There was an issue accessing this workspace: {workspaceError}
                    </p>
                    <Button onClick={() => router.push('/workspaces')}>
                        Back to Workspaces
                    </Button>
                </div>
            </div>
        );
    }

    // Show access denied for unauthenticated users on protected routes
    if (!isAuthenticated && isProtectedRoute(pathname)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-blue-600 text-6xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
                    <p className="text-gray-600 mb-6">
                        You need to be logged in to access this page.
                    </p>
                    <Button onClick={() => router.push('/auth/login')}>
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    // Render the page if all checks pass
    if (shouldRender) {
        return <>{children}</>;
    }

    // Fallback loading state
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
            </div>
        </div>
    );
} 