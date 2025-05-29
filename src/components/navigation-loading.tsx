'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationLoading() {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setIsLoading(false);
    }, [pathname]);

    // Listen for browser navigation events
    useEffect(() => {
        const handleStart = () => {
            setIsLoading(true);
        };

        const handleComplete = () => {
            setIsLoading(false);
        };

        // Listen for page navigation events
        window.addEventListener('beforeunload', handleStart);
        
        // For client-side navigation, we'll use the pathname change
        // This will automatically be triggered by the useEffect above

        return () => {
            window.removeEventListener('beforeunload', handleStart);
        };
    }, []);

    if (!isLoading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <div className="h-1 bg-blue-200">
                <div 
                    className="h-full bg-blue-600 transition-all duration-1000 ease-out"
                    style={{ 
                        width: '100%',
                        animation: 'loading-bar 2s ease-in-out infinite'
                    }}
                />
            </div>
            <style jsx>{`
                @keyframes loading-bar {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                }
            `}</style>
        </div>
    );
} 