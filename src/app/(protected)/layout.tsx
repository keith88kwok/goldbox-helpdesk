'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useRedirect } from '@/hooks/use-redirect';

interface ProtectedLayoutProps {
    children: React.ReactNode;
}

/**
 * Simplified protected layout that only handles authentication
 * Server components now handle workspace access validation
 */
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const { isAuthenticated, isLoading: authLoading, isInitializing, authError, clearAuthError } = useAuth();
    const { redirectToLogin } = useRedirect();

    // Still initializing authentication - wait for initial check to complete
    if (isInitializing || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">
                        {isInitializing ? 'Initializing authentication...' : 'Checking authentication...'}
                    </p>
                </div>
            </div>
        );
    }

    // Show authentication error if present
    if (authError && !isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Issue</h1>
                    <p className="text-gray-600 mb-6">
                        {authError}
                    </p>
                    <div className="space-y-3">
                        <Button 
                            onClick={() => {
                                clearAuthError();
                                window.location.reload();
                            }}
                            className="w-full"
                        >
                            Retry Authentication
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => redirectToLogin('Please log in again')}
                            className="w-full"
                        >
                            Go to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-blue-600 text-6xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
                    <p className="text-gray-600 mb-6">
                        You need to be logged in to access this page.
                    </p>
                    <Button onClick={() => redirectToLogin('Authentication required for protected content')}>
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    // Show auth error even when authenticated (for database sync issues)
    if (authError && isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm text-yellow-700">
                                {authError}
                            </p>
                        </div>
                        <div className="ml-auto pl-3">
                            <div className="space-x-2">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="text-yellow-700 hover:text-yellow-600 text-sm font-medium"
                                >
                                    Refresh
                                </button>
                                <button
                                    onClick={clearAuthError}
                                    className="text-yellow-700 hover:text-yellow-600 text-sm font-medium"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {children}
            </div>
        );
    }

    // Render the protected content - let server components handle workspace validation
    return <>{children}</>;
} 