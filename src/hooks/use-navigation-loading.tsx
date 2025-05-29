'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useNavigationLoading() {
    const [isNavigating, setIsNavigating] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const handleStart = () => {
            // Small delay to avoid flash for instant navigations
            timeout = setTimeout(() => {
                setIsNavigating(true);
            }, 100);
        };

        const handleComplete = () => {
            clearTimeout(timeout);
            setIsNavigating(false);
        };

        // Override router methods to track navigation
        const originalPush = router.push;
        const originalReplace = router.replace;
        const originalBack = router.back;
        const originalForward = router.forward;

        router.push = (...args) => {
            handleStart();
            return originalPush.apply(router, args);
        };

        router.replace = (...args) => {
            handleStart();
            return originalReplace.apply(router, args);
        };

        router.back = () => {
            handleStart();
            return originalBack.apply(router);
        };

        router.forward = () => {
            handleStart();
            return originalForward.apply(router);
        };

        // Clean up when pathname changes (navigation complete)
        handleComplete();

        return () => {
            clearTimeout(timeout);
            // Restore original methods
            router.push = originalPush;
            router.replace = originalReplace;
            router.back = originalBack;
            router.forward = originalForward;
        };
    }, [pathname, router]);

    return { isNavigating };
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
    const { isNavigating } = useNavigationLoading();

    return (
        <>
            {children}
            {isNavigating && (
                <div className="fixed top-0 left-0 right-0 z-50">
                    <div className="h-1 bg-blue-200">
                        <div className="h-full bg-blue-600 animate-pulse transition-all duration-300 ease-out"
                             style={{ width: '70%' }}>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 