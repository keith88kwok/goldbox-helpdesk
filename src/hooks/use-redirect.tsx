'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RedirectOptions {
    reason: string;
    description?: string;
    autoRedirectSeconds?: number;
    showUserConfirmation?: boolean;
}

export function useRedirect() {
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);

    const redirectWithReason = (targetUrl: string, options: RedirectOptions) => {
        if (options.showUserConfirmation || options.autoRedirectSeconds) {
            // Use URL params to pass redirect info to a dedicated redirect page
            const params = new URLSearchParams({
                target: targetUrl,
                reason: options.reason,
                ...(options.description && { description: options.description }),
                ...(options.autoRedirectSeconds && { autoRedirect: options.autoRedirectSeconds.toString() })
            });
            
            router.push(`/redirect?${params.toString()}`);
        } else {
            // Direct redirect for immediate cases
            console.log(`🔄 Redirecting to ${targetUrl}: ${options.reason}`);
            setIsRedirecting(true);
            router.push(targetUrl);
        }
    };

    const redirectToLogin = (reason: string = 'Authentication required') => {
        redirectWithReason('/auth/login', {
            reason,
            description: 'You need to be logged in to access this page.',
            showUserConfirmation: true
        });
    };

    const redirectToDashboard = (reason: string = 'Dashboard access') => {
        redirectWithReason('/dashboard', {
            reason,
            description: 'Redirecting to your dashboard.',
            showUserConfirmation: true
        });
    };

    // Keep for backward compatibility but redirect to dashboard
    const redirectToWorkspaces = (reason: string = 'Workspace access required') => {
        redirectWithReason('/dashboard', {
            reason,
            description: 'Please select a workspace to continue.',
            showUserConfirmation: true
        });
    };

    const redirectWithError = (targetUrl: string, error: string) => {
        redirectWithReason(targetUrl, {
            reason: 'An error occurred',
            description: error,
            showUserConfirmation: true
        });
    };

    return {
        redirectWithReason,
        redirectToLogin,
        redirectToDashboard,
        redirectToWorkspaces, // Kept for backward compatibility
        redirectWithError,
        isRedirecting
    };
} 