import React from 'react';

interface FormFieldProps {
    label: string;
    error?: string;
    hint?: string;
    required?: boolean;
    children: React.ReactNode;
}

export function FormField({
    label,
    error,
    hint,
    required = false,
    children,
}: FormFieldProps) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children}
            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}
            {hint && !error && (
                <p className="text-sm text-gray-500">
                    {hint}
                </p>
            )}
        </div>
    );
} 