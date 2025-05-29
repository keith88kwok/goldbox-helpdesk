'use client';

import { useEffect, useState } from 'react';
import { configureAmplify } from '@/lib/amplify-config';

export function AmplifyConfig({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Ensure Amplify is configured (should already be done by import)
        try {
            configureAmplify();
            console.log('Amplify configuration verified');

            // Small delay to ensure everything is properly initialized
            const timer = setTimeout(() => {
                setIsReady(true);
            }, 100);

            return () => clearTimeout(timer);
        } catch (error) {
            console.error('Amplify configuration failed:', error);
        }
    }, []);

    // Don't render children until we're fully ready
    if (!isReady) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing Amplify...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
} 