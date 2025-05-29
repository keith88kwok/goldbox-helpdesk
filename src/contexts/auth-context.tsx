'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { signIn, signUp, signOut, getCurrentUser, confirmSignUp, resetPassword, confirmResetPassword, confirmSignIn } from 'aws-amplify/auth';
import { client } from '@/lib/amplify-client';
import type { Schema } from '@/lib/amplify-client';
import { configureAmplify } from '@/lib/amplify-config';

// Ensure Amplify is configured before this context loads
configureAmplify();

// Types
interface User {
    id: string;
    email: string;
    username: string;
    name: string;
    workspaces: Array<{
        workspace: Schema['Workspace']['type'];
        role: 'ADMIN' | 'MEMBER' | 'VIEWER';
        joinedAt: string;
    }>;
}

interface AuthContextType {
    user: User | null;
    currentWorkspace: Schema['Workspace']['type'] | null;
    isLoading: boolean;
    isInitializing: boolean;
    isAuthenticated: boolean;
    authStep: string | null;
    tempUsername: string | null;
    login: (username: string, password: string) => Promise<void>;
    signup: (username: string, email: string, password: string, givenName: string, familyName: string) => Promise<void>;
    confirmSignup: (username: string, code: string) => Promise<void>;
    confirmNewPassword: (newPassword: string) => Promise<void>;
    resetAuthStep: () => void;
    logout: () => Promise<void>;
    resetPasswordRequest: (username: string) => Promise<void>;
    resetPasswordConfirm: (username: string, code: string, newPassword: string) => Promise<void>;
    setCurrentWorkspace: (workspace: Schema['Workspace']['type']) => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [currentWorkspace, setCurrentWorkspace] = useState<Schema['Workspace']['type'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitializing, setIsInitializing] = useState(true);
    const [authStep, setAuthStep] = useState<string | null>(null);
    const [tempUsername, setTempUsername] = useState<string | null>(null);

    const isAuthenticated = !!user;

    // Load user data from database
    const loadUserData = async (cognitoUser: any): Promise<User | null> => {
        try {
            const { data: dbUser } = await client.models.User.get({
                id: cognitoUser.username
            });

            if (!dbUser) {
                console.warn('User not found in database');
                return null;
            }

            // Load user workspaces
            const { data: workspaceUsers } = await client.models.WorkspaceUser.list({
                filter: { userId: { eq: dbUser.userId } }
            });

            const workspacesWithDetails = await Promise.all(
                (workspaceUsers || [])
                    .filter(wu => wu.role && wu.joinedAt) // Filter out null values
                    .map(async (wu) => {
                        const { data: workspace } = await client.models.Workspace.get({
                            id: wu.workspaceId
                        });
                        if (!workspace) return null;
                        return {
                            workspace,
                            role: wu.role as 'ADMIN' | 'MEMBER' | 'VIEWER',
                            joinedAt: wu.joinedAt!
                        };
                    })
            );

            return {
                id: dbUser.userId,
                email: dbUser.email,
                username: dbUser.username,
                name: dbUser.name,
                workspaces: workspacesWithDetails.filter(Boolean) as Array<{
                    workspace: Schema['Workspace']['type'];
                    role: 'ADMIN' | 'MEMBER' | 'VIEWER';
                    joinedAt: string;
                }>
            };
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    };

    // Check authentication status on mount
    const checkAuthStatus = async () => {
        console.log('🔍 AuthContext - Checking initial auth status...');
        try {
            const cognitoUser = await getCurrentUser();
            console.log('✅ AuthContext - User found in Cognito:', cognitoUser.username);
            
            const userData = await loadUserData(cognitoUser);

            if (userData) {
                console.log('✅ AuthContext - User data loaded successfully');
                setUser(userData);
                // Set default workspace to first one
                if (userData.workspaces.length > 0) {
                    setCurrentWorkspace(userData.workspaces[0].workspace);
                }
            } else {
                console.log('⚠️ AuthContext - User found in Cognito but not in database');
                setUser(null);
                setCurrentWorkspace(null);
            }
        } catch (error) {
            // User not authenticated
            console.log('❌ AuthContext - No authenticated user found');
            setUser(null);
            setCurrentWorkspace(null);
        } finally {
            console.log('🏁 AuthContext - Initial auth check complete');
            setIsLoading(false);
            setIsInitializing(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Auth methods
    const login = async (username: string, password: string) => {
        setIsLoading(true);
        try {
            const cognitoResponse = await signIn({ username, password });
            console.log('Cognito response:', cognitoResponse);

            if (cognitoResponse.isSignedIn) {
                // User is fully signed in
                const cognitoUser = await getCurrentUser();
                const userData = await loadUserData(cognitoUser);

                if (userData) {
                    setUser(userData);
                    if (userData.workspaces.length > 0) {
                        setCurrentWorkspace(userData.workspaces[0].workspace);
                    }
                    setAuthStep(null);
                    setTempUsername(null);
                } else {
                    throw new Error('User profile not found');
                }
            } else {
                // Handle different authentication steps
                const nextStep = cognitoResponse.nextStep;
                console.log('Next step required:', nextStep.signInStep);
                
                setAuthStep(nextStep.signInStep);
                setTempUsername(username);
                
                // Don't throw error, let the UI handle the next step
            }
        } catch (error) {
            console.error('Login error:', error);
            setAuthStep(null);
            setTempUsername(null);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const confirmNewPassword = async (newPassword: string) => {
        if (!tempUsername) {
            throw new Error('No pending authentication session');
        }

        setIsLoading(true);
        try {
            const cognitoResponse = await confirmSignIn({
                challengeResponse: newPassword
            });

            console.log('Password confirmation response:', cognitoResponse);

            if (cognitoResponse.isSignedIn) {
                // User is now fully signed in
                const cognitoUser = await getCurrentUser();
                const userData = await loadUserData(cognitoUser);

                if (userData) {
                    setUser(userData);
                    if (userData.workspaces.length > 0) {
                        setCurrentWorkspace(userData.workspaces[0].workspace);
                    }
                    setAuthStep(null);
                    setTempUsername(null);
                } else {
                    throw new Error('User profile not found');
                }
            } else {
                // Handle if there are more steps required
                const nextStep = cognitoResponse.nextStep;
                setAuthStep(nextStep.signInStep);
            }
        } catch (error) {
            console.error('Password confirmation error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (username: string, email: string, password: string, givenName: string, familyName: string) => {
        setIsLoading(true);
        try {
            await signUp({
                username,
                password,
                options: {
                    userAttributes: {
                        email,
                        given_name: givenName,
                        family_name: familyName,
                        preferred_username: username,
                    },
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    const confirmSignup = async (username: string, code: string) => {
        setIsLoading(true);
        try {
            await confirmSignUp({ username, confirmationCode: code });

            // Create user profile in database after confirmation
            const cognitoUser = await getCurrentUser();
            await client.models.User.create({
                userId: cognitoUser.username,
                cognitoId: cognitoUser.username,
                email: cognitoUser.signInDetails?.loginId || '',
                username: username,
                name: `${cognitoUser.signInDetails?.loginId}`, // Will be updated when we have proper user attributes
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            // Load the new user data
            const userData = await loadUserData(cognitoUser);
            if (userData) {
                setUser(userData);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await signOut();
            setUser(null);
            setCurrentWorkspace(null);
            setAuthStep(null);
            setTempUsername(null);
        } finally {
            setIsLoading(false);
        }
    };

    const resetPasswordRequest = async (username: string) => {
        await resetPassword({ username });
    };

    const resetPasswordConfirm = async (username: string, code: string, newPassword: string) => {
        await confirmResetPassword({ username, confirmationCode: code, newPassword });
    };

    const refreshUser = async () => {
        if (user) {
            const cognitoUser = await getCurrentUser();
            const userData = await loadUserData(cognitoUser);
            if (userData) {
                setUser(userData);
            }
        }
    };

    const resetAuthStep = () => {
        setAuthStep(null);
        setTempUsername(null);
    };

    const value: AuthContextType = {
        user,
        currentWorkspace,
        isLoading,
        isInitializing,
        isAuthenticated,
        authStep,
        tempUsername,
        login,
        signup,
        confirmSignup,
        confirmNewPassword,
        resetAuthStep,
        logout,
        resetPasswordRequest,
        resetPasswordConfirm,
        setCurrentWorkspace,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 