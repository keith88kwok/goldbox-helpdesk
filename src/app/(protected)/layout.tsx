import AuthLayout from './auth-layout';

// Force dynamic rendering for all protected routes since they require authentication
export const dynamic = 'force-dynamic';

interface ProtectedLayoutProps {
    children: React.ReactNode;
}

/**
 * Server layout wrapper for protected routes
 * Ensures all protected routes are rendered dynamically due to authentication requirements
 */
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    return (
        <AuthLayout>
            {children}
        </AuthLayout>
    );
} 