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
    const { isAuthenticated, isLoading: authLoading, isInitializing } = useAuth();
    const { redirectToLogin } = useRedirect();

    // Still initializing authentication - wait for initial check to complete
    if (isInitializing || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">
                        {isInitializing ? 'Initializing...' : 'Checking authentication...'}
                    </p>
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

    // Render the protected content - let server components handle workspace validation
    return <>{children}</>;
} 