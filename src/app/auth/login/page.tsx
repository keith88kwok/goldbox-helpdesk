'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/contexts/auth-context';
import { useRedirect } from '@/hooks/use-redirect';

export default function LoginPage() {
    const { isAuthenticated, isLoading, isInitializing } = useAuth();
    const router = useRouter();
    const { redirectToWorkspaces } = useRedirect();

    useEffect(() => {
        // Redirect authenticated users to workspaces with a friendly message
        if (!isLoading && !isInitializing && isAuthenticated) {
            redirectToWorkspaces('You are already logged in! Please select a workspace to continue.');
        }
    }, [isAuthenticated, isLoading, isInitializing, redirectToWorkspaces]);

    // Show loading state while checking authentication
    if (isLoading || isInitializing) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-md mx-auto">
                    <div className="flex justify-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center animate-pulse">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-2xl sm:text-3xl font-bold text-gray-900">
                        Kiosk Helpdesk
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 px-4">
                        Checking authentication status...
                    </p>
                </div>
            </div>
        );
    }

    // Only show login form for unauthenticated users
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-md mx-auto">
                    <div className="flex justify-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-2xl sm:text-3xl font-bold text-gray-900">
                        Kiosk Helpdesk
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 px-4">
                        Internal maintenance management system
                    </p>
                </div>

                <div className="mt-6 sm:mt-8 w-full max-w-md mx-auto">
                    <div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:py-8 sm:px-10">
                        <LoginForm
                            onSwitchToSignup={() => router.push('/auth/signup')}
                            onSwitchToReset={() => router.push('/auth/reset')}
                        />
                    </div>
                </div>

                <div className="mt-6 sm:mt-8 text-center px-4">
                    <p className="text-xs text-gray-500">
                        For technical support, contact your system administrator
                    </p>
                </div>
            </div>
        );
    }

    // Return null while redirecting
    return null;
} 