import React from 'react';

interface FormFieldProps {
    label: string;
    error?: string;
    hint?: string;
    required?: boolean;
    children?: React.ReactNode;
    name?: string;
    type?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    autoComplete?: string;
    disabled?: boolean;
}

export function FormField({
    label,
    error,
    hint,
    required = false,
    children,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    autoComplete,
    disabled
}: FormFieldProps) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children || (
                <input
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    disabled={disabled}
                    className={`
                        w-full px-3 py-3 text-base border rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        disabled:bg-gray-100 disabled:cursor-not-allowed
                        ${error 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 hover:border-gray-400'
                        }
                        transition-colors duration-200
                    `}
                />
            )}
            {error && (
                <p className="text-sm text-red-600 flex items-start gap-1">
                    <span className="text-red-500 text-base leading-none">•</span>
                    <span>{error}</span>
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