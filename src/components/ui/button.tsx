import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    children,
    className = '',
    ...props
}: ButtonProps) {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation';

    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
        outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-500 bg-white',
        ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
        destructive: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    };

    const sizes = {
        sm: 'px-3 py-2 text-sm min-h-[36px]',
        md: 'px-4 py-2.5 text-sm min-h-[44px]',
        lg: 'px-6 py-3 text-base min-h-[48px]',
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg
                    className="w-4 h-4 mr-2 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
} 