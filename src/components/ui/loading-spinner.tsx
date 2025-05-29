import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
}

export function LoadingSpinner({ 
    size = 'md', 
    className = '',
    text
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8', 
        lg: 'w-12 h-12'
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <div 
                className={`border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin ${sizeClasses[size]}`}
                role="status"
                aria-label="Loading"
            />
            {text && (
                <p className="text-gray-600 mt-2 text-sm">{text}</p>
            )}
        </div>
    );
}

export function LoadingCard({ className = '' }: { className?: string }) {
    return (
        <div className={`animate-pulse ${className}`}>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="mt-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
            </div>
        </div>
    );
}

export function LoadingPage({ 
    title = 'Loading...', 
    subtitle,
    className = '' 
}: { 
    title?: string; 
    subtitle?: string;
    className?: string;
}) {
    return (
        <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">{title}</h2>
                {subtitle && (
                    <p className="mt-2 text-gray-600">{subtitle}</p>
                )}
            </div>
        </div>
    );
} 