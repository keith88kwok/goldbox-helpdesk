'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';

export function NavigationLoading() {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        setIsLoading(false);
    }, [pathname]);

    // Listen for browser navigation events
    useEffect(() => {
        const handleStart = () => {
            setIsLoading(true);
        };

        router.events?.on('routeChangeStart', handleStart);
        router.events?.on('routeChangeComplete', () => setIsLoading(false));
        router.events?.on('routeChangeError', () => setIsLoading(false));

        return () => {
            router.events?.off('routeChangeStart', handleStart);
            router.events?.off('routeChangeComplete', () => setIsLoading(false));
            router.events?.off('routeChangeError', () => setIsLoading(false));
        };
    }, [router]);

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