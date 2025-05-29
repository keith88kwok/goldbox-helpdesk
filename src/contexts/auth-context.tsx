'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
    authError: string | null;
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
    clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [currentWorkspace, setCurrentWorkspace] = useState<Schema['Workspace']['type'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitializing, setIsInitializing] = useState(true);
    const [authStep, setAuthStep] = useState<string | null>(null);
    const [tempUsername, setTempUsername] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);

    const isAuthenticated = !!user;

    // Load user data from database with better error handling
    const loadUserData = useCallback(async (cognitoUser: { username: string; signInDetails?: { loginId?: string } }): Promise<User | null> => {
        try {
            const { data: dbUser } = await client.models.User.get({
                id: cognitoUser.username
            });

            if (!dbUser) {
                console.warn('AuthContext: User found in Cognito but not in database - this may be a new invited user');
                // For new invited users, try to find by cognitoId instead
                const { data: dbUsersByCognito } = await client.models.User.list({
                    filter: { cognitoId: { eq: cognitoUser.username } }
                });

                if (!dbUsersByCognito || dbUsersByCognito.length === 0) {
                    console.warn('AuthContext: User not found by either ID or cognitoId - user may need database sync');
                    setAuthError('User profile not synced. Please contact support if this persists.');
                    return null;
                }

                // Use the user found by cognitoId
                const syncedUser = dbUsersByCognito[0];
                console.log('AuthContext: Found user by cognitoId:', syncedUser.id);
                
                // Continue with workspace loading using the synced user
                const { data: workspaceUsers } = await client.models.WorkspaceUser.list({
                    filter: { userId: { eq: syncedUser.userId } }
                });

                const workspacesWithDetails = await Promise.all(
                    (workspaceUsers || [])
                        .filter(wu => wu.role && wu.joinedAt)
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
                    id: syncedUser.userId,
                    email: syncedUser.email,
                    username: syncedUser.username,
                    name: syncedUser.name,
                    workspaces: workspacesWithDetails.filter(Boolean) as Array<{
                        workspace: Schema['Workspace']['type'];
                        role: 'ADMIN' | 'MEMBER' | 'VIEWER';
                        joinedAt: string;
                    }>
                };
            }

            // Load user workspaces for regular users
            const { data: workspaceUsers } = await client.models.WorkspaceUser.list({
                filter: { userId: { eq: dbUser.userId } }
            });

            const workspacesWithDetails = await Promise.all(
                (workspaceUsers || [])
                    .filter(wu => wu.role && wu.joinedAt)
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
            console.error('AuthContext: Error loading user data:', error);
            setAuthError('Failed to load user profile. Please try refreshing the page.');
            return null;
        }
    }, []);

    // Check authentication status on mount with better error handling
    const checkAuthStatus = useCallback(async () => {
        setIsInitializing(true);
        setAuthError(null);
        
        try {
            console.log('Checking authentication status...');
            const cognitoUser = await getCurrentUser();
            console.log('Cognito user found:', cognitoUser.username);
            
            const userData = await loadUserData(cognitoUser);
            
            if (userData) {
                console.log('User data loaded successfully:', userData.email);
                setUser(userData);
                
                // Set default workspace if user has any
                if (userData.workspaces.length > 0) {
                    setCurrentWorkspace(userData.workspaces[0].workspace);
                    console.log('Default workspace set:', userData.workspaces[0].workspace.name);
                }
            } else {
                console.log('No user data found in database');
                setUser(null);
                setCurrentWorkspace(null);
            }
        } catch (error) {
            console.log('No authenticated user found:', error);
            setUser(null);
            setCurrentWorkspace(null);
            setAuthStep(null);
            setTempUsername(null);
        } finally {
            setIsInitializing(false);
        }
    }, [loadUserData]);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    // Auth methods with better error handling
    const login = async (username: string, password: string) => {
        setIsLoading(true);
        setAuthError(null);
        
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
                    setAuthError(null);
                } else {
                    throw new Error('User profile not found or sync failed');
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
            
            // Set specific error messages for better user experience
            if (error instanceof Error) {
                setAuthError(error.message);
            }
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
        setAuthError(null);
        
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
                    setAuthError(null);
                } else {
                    throw new Error('User profile not found after password confirmation');
                }
            } else {
                // Handle if there are more steps required
                const nextStep = cognitoResponse.nextStep;
                setAuthStep(nextStep.signInStep);
            }
        } catch (error) {
            console.error('Password confirmation error:', error);
            if (error instanceof Error) {
                setAuthError(error.message);
            }
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (username: string, email: string, password: string, givenName: string, familyName: string) => {
        setIsLoading(true);
        setAuthError(null);
        
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
        } catch (error) {
            console.error('Signup error:', error);
            if (error instanceof Error) {
                setAuthError(error.message);
            }
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const confirmSignup = async (username: string, code: string) => {
        setIsLoading(true);
        setAuthError(null);
        
        try {
            await confirmSignUp({ username, confirmationCode: code });

            // Create user profile in database after confirmation
            const cognitoUser = await getCurrentUser();
            await client.models.User.create({
                userId: cognitoUser.username,
                cognitoId: cognitoUser.username,
                email: cognitoUser.signInDetails?.loginId || '',
                username: username,
                name: `${cognitoUser.signInDetails?.loginId}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            // Load the new user data
            const userData = await loadUserData(cognitoUser);
            if (userData) {
                setUser(userData);
                setAuthError(null);
            }
        } catch (error) {
            console.error('Confirm signup error:', error);
            if (error instanceof Error) {
                setAuthError(error.message);
            }
            throw error;
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
            setAuthError(null);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetPasswordRequest = async (username: string) => {
        setAuthError(null);
        await resetPassword({ username });
    };

    const resetPasswordConfirm = async (username: string, code: string, newPassword: string) => {
        setAuthError(null);
        await confirmResetPassword({ username, confirmationCode: code, newPassword });
    };

    const refreshUser = async () => {
        if (user) {
            setAuthError(null);
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
        setAuthError(null);
    };

    const clearAuthError = () => {
        setAuthError(null);
    };

    const value: AuthContextType = {
        user,
        currentWorkspace,
        isLoading,
        isInitializing,
        isAuthenticated,
        authStep,
        tempUsername,
        authError,
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
        clearAuthError,
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