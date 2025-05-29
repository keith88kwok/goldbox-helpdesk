'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';

interface LoginFormProps {
    onSwitchToSignup?: () => void;
    onSwitchToReset?: () => void;
}

export function LoginForm({ onSwitchToSignup, onSwitchToReset }: LoginFormProps) {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [newPasswordData, setNewPasswordData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitError, setSubmitError] = useState('');

    const { login, confirmNewPassword, isLoading, authStep, tempUsername, resetAuthStep } = useAuth();
    const router = useRouter();

    const validateLoginForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username or email is required';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateNewPasswordForm = () => {
        const newErrors: Record<string, string> = {};

        if (!newPasswordData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (newPasswordData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPasswordData.newPassword)) {
            newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }

        if (!newPasswordData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (newPasswordData.newPassword !== newPasswordData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        if (!validateLoginForm()) {
            return;
        }

        try {
            await login(formData.username, formData.password);
            // If authStep is set, the component will re-render to show the appropriate form
        } catch (error: any) {
            console.error('Login error:', error);

            // Handle specific Cognito errors with better user guidance
            switch (error.name) {
                case 'UserNotConfirmedException':
                    setSubmitError('Please verify your email address. Check your email for the confirmation code.');
                    break;
                case 'NotAuthorizedException':
                    setSubmitError('Invalid username or password. If you were recently invited to a workspace, please check your invitation email for the correct credentials.');
                    break;
                case 'UserNotFoundException':
                    setSubmitError('User not found. If you were recently invited, your account may still be being set up. Please contact your administrator.');
                    break;
                case 'TooManyRequestsException':
                    setSubmitError('Too many failed attempts. Please try again later.');
                    break;
                case 'UnexpectedSignInInterruptionException':
                    setSubmitError('There was an issue completing your sign-in. This may happen with new accounts. Please try refreshing the page and signing in again.');
                    break;
                default:
                    // Provide more helpful error messages for common scenarios
                    if (error.message?.includes('User profile not found') || error.message?.includes('sync failed')) {
                        setSubmitError('Your user profile is being set up. Please try refreshing the page in a moment, or contact support if this persists.');
                    } else {
                        setSubmitError(error.message || 'Login failed. Please try again.');
                    }
            }
        }
    };

    const handleNewPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        if (!validateNewPasswordForm()) {
            return;
        }

        try {
            await confirmNewPassword(newPasswordData.newPassword);
            router.push('/workspaces');
        } catch (error: any) {
            console.error('Password confirmation error:', error);
            setSubmitError(error.message || 'Failed to set new password. Please try again.');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name === 'newPassword' || name === 'confirmPassword') {
            setNewPasswordData(prev => ({ ...prev, [name]: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear field error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Clear submit error when user makes changes
        if (submitError) {
            setSubmitError('');
        }
    };

    // Show new password form if required
    if (authStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        return (
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Set New Password
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        You need to set a new password for <strong>{tempUsername}</strong>
                    </p>
                </div>

                <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
                    <FormField
                        label="New Password"
                        name="newPassword"
                        type="password"
                        value={newPasswordData.newPassword}
                        onChange={handleInputChange}
                        error={errors.newPassword}
                        placeholder="Enter your new password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        hint="Password must be at least 8 characters with uppercase, lowercase, and number"
                    />

                    <FormField
                        label="Confirm New Password"
                        name="confirmPassword"
                        type="password"
                        value={newPasswordData.confirmPassword}
                        onChange={handleInputChange}
                        error={errors.confirmPassword}
                        placeholder="Confirm your new password"
                        autoComplete="new-password"
                        disabled={isLoading}
                    />

                    {submitError && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                            {submitError}
                        </div>
                    )}

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? 'Setting Password...' : 'Set New Password'}
                    </Button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={resetAuthStep}
                            className="text-sm text-gray-600 hover:text-gray-500"
                            disabled={isLoading}
                        >
                            ← Go back to login
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // Show regular login form
    return (
        <div className="w-full max-w-md space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    Sign in to your helpdesk account
                </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
                <FormField
                    label="Username or Email"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    error={errors.username}
                    placeholder="Enter your username or email"
                    autoComplete="username"
                    disabled={isLoading}
                />

                <FormField
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={errors.password}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isLoading}
                />

                {submitError && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                        {submitError}
                    </div>
                )}

                <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={isLoading}
                    className="w-full"
                >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
            </form>

            <div className="space-y-4">
                {onSwitchToReset && (
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={onSwitchToReset}
                            className="text-sm text-blue-600 hover:text-blue-500"
                            disabled={isLoading}
                        >
                            Forgot your password?
                        </button>
                    </div>
                )}

                {onSwitchToSignup && (
                    <div className="text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToSignup}
                            className="text-blue-600 hover:text-blue-500 font-medium"
                            disabled={isLoading}
                        >
                            Sign up
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 