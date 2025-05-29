'use client';

import { useSearchParams } from 'next/navigation';
import { RedirectPage } from '@/components/redirect-page';

export default function RedirectPageWrapper() {
    const searchParams = useSearchParams();
    
    const target = searchParams.get('target') || '/';
    const reason = searchParams.get('reason') || 'Redirecting...';
    const description = searchParams.get('description') || undefined;
    const autoRedirect = searchParams.get('autoRedirect');
    
    // Determine icon and button text based on target
    let icon: 'error' | 'auth' | 'workspace' | 'info' = 'info';
    let buttonText = 'Continue';
    
    if (target.includes('/auth/login')) {
        icon = 'auth';
        buttonText = 'Go to Login';
    } else if (target.includes('/workspaces')) {
        icon = 'workspace';
        buttonText = 'Select Workspace';
    } else if (reason.toLowerCase().includes('error')) {
        icon = 'error';
        buttonText = 'Try Again';
    }

    return (
        <RedirectPage
            title="Redirecting"
            reason={reason}
            description={description}
            targetUrl={target}
            buttonText={buttonText}
            icon={icon}
            autoRedirectSeconds={autoRedirect ? parseInt(autoRedirect) : undefined}
            showCancelOption={true}
        />
    );
} 