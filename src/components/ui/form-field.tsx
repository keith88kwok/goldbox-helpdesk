import React from 'react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    hint?: string;
}

export function FormField({
    label,
    error,
    hint,
    id,
    className = '',
    ...props
}: FormFieldProps) {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="space-y-1">
            <label
                htmlFor={inputId}
                className="block text-sm font-medium text-gray-700"
            >
                {label}
            </label>
            <input
                id={inputId}
                className={`
          block w-full rounded-lg border px-3 py-2 text-sm transition-colors
          ${error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }
          focus:outline-none focus:ring-1
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${className}
        `}
                {...props}
            />
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