'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationLoading() {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Reset loading state when pathname changes
        setIsLoading(false);
    }, [pathname]);

    // Since App Router doesn't have router.events like Pages Router,
    // we'll use a different approach for showing loading states
    // This component will mainly serve as a container for future loading implementations
    // or can be enhanced with custom navigation event handling if needed

    if (!isLoading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <div className="h-1 bg-blue-200">
                <div 
                    className="h-full bg-blue-600 transition-all duration-1000 ease-out animate-pulse"
                    style={{ width: '100%' }}
                />
            </div>
        </div>
    );
} 