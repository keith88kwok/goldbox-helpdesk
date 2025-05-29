'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { client } from '@/lib/amplify-client';
import { type Schema } from '@/lib/amplify-client';
import { useAuth } from './auth-context';
import { configureAmplify } from '@/lib/amplify-config';

// Ensure Amplify is configured before this context loads
configureAmplify();

// Use Amplify generated types
type WorkspaceRole = 'ADMIN' | 'MEMBER' | 'VIEWER';
type WorkspaceType = Schema['Workspace']['type'];
type WorkspaceUserType = Schema['WorkspaceUser']['type'];

interface Workspace {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

interface WorkspaceUser {
    id: string;
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
    joinedAt: string;
    workspace?: Workspace;
}

interface CreateWorkspaceInput {
    name: string;
    description?: string;
}

interface WorkspaceContextType {
    // State
    currentWorkspace: WorkspaceType | null;
    userWorkspaces: WorkspaceUserType[];
    userRole: WorkspaceRole | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    switchWorkspace: (workspaceId: string) => Promise<void>;
    refreshWorkspaces: () => Promise<void>;
    createWorkspace: (data: CreateWorkspaceInput) => Promise<void>;
    clearWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();

    // State
    const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceType | null>(null);
    const [userWorkspaces, setUserWorkspaces] = useState<WorkspaceUserType[]>([]);
    const [userRole, setUserRole] = useState<WorkspaceRole | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refs to prevent circular dependencies
    const isLoadingRef = useRef(false);
    const hasInitializedRef = useRef(false);

    // Load workspaces when user changes - call fetch logic directly
    useEffect(() => {
        const fetchWorkspaces = async () => {
            if (!user?.id || !isAuthenticated || isLoadingRef.current) {
                return;
            }

            try {
                isLoadingRef.current = true;
                setIsLoading(true);
                setError(null);

                console.log('Fetching user workspaces for user:', user.id);

                // Get all WorkspaceUser records for current user
                const { data: workspaceUsers, errors } = await client.models.WorkspaceUser.list({
                    filter: {
                        userId: { eq: user.id }
                    }
                });

                if (errors && errors.length > 0) {
                    console.error('Error fetching user workspaces:', errors);
                    setError('Failed to load workspaces');
                    return;
                }

                if (!workspaceUsers) {
                    setUserWorkspaces([]);
                    return;
                }

                // Filter out entries with null roles
                const validWorkspaceUsers = workspaceUsers.filter(wu => wu.role !== null);
                setUserWorkspaces(validWorkspaceUsers);
                
                console.log('Found workspaces:', validWorkspaceUsers.length);

                // Only auto-select workspace if we don't have a current one AND this is initial load
                if (!hasInitializedRef.current && validWorkspaceUsers.length > 0) {
                    hasInitializedRef.current = true;
                    
                    const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
                    const targetWorkspace = savedWorkspaceId 
                        ? validWorkspaceUsers.find(wu => wu.workspaceId === savedWorkspaceId)
                        : validWorkspaceUsers[0];
                    
                    if (targetWorkspace) {
                        console.log('Auto-selecting workspace:', targetWorkspace.workspaceId);
                        // Fetch workspace details using workspaceId field
                        const { data: workspaces } = await client.models.Workspace.list({
                            filter: {
                                workspaceId: { eq: targetWorkspace.workspaceId }
                            }
                        });
                        
                        const workspace = workspaces?.[0];
                        if (workspace) {
                            setCurrentWorkspace(workspace);
                            setUserRole(targetWorkspace.role as WorkspaceRole);
                            localStorage.setItem('currentWorkspaceId', targetWorkspace.workspaceId);
                        }
                    }
                }

            } catch (err) {
                console.error('Error in fetchUserWorkspaces:', err);
                setError('Failed to load workspaces');
            } finally {
                setIsLoading(false);
                isLoadingRef.current = false;
            }
        };

        if (isAuthenticated && user?.id) {
            console.log('User authenticated, fetching workspaces');
            fetchWorkspaces();
        } else if (!isAuthenticated) {
            console.log('User not authenticated, clearing workspace data');
            setCurrentWorkspace(null);
            setUserWorkspaces([]);
            setUserRole(null);
            setError(null);
            hasInitializedRef.current = false;
            isLoadingRef.current = false;
            localStorage.removeItem('currentWorkspaceId');
        }
    }, [isAuthenticated, user?.id]); // No function dependencies

    // Switch to a different workspace
    const switchWorkspace = useCallback(async (workspaceId: string) => {
        console.log('🔀 switchWorkspace called with:', workspaceId, {
            isLoading: isLoadingRef.current,
            currentWorkspaceId: currentWorkspace?.workspaceId,
            alreadySame: currentWorkspace?.workspaceId === workspaceId,
            availableWorkspaces: userWorkspaces.map(wu => wu.workspaceId)
        });

        if (isLoadingRef.current) {
            console.log('🔄 Already loading, skipping workspace switch');
            return;
        }

        // Prevent switching to the same workspace (check both id and workspaceId)
        if (currentWorkspace?.id === workspaceId || currentWorkspace?.workspaceId === workspaceId) {
            console.log('✅ Already in workspace:', workspaceId);
            return;
        }

        try {
            isLoadingRef.current = true;
            setIsLoading(true);
            setError(null);

            console.log('🔄 Switching to workspace:', workspaceId);

            // Find the workspace in user's accessible workspaces (checking both id and workspaceId)
            const workspaceUser = userWorkspaces.find(wu => 
                wu.workspaceId === workspaceId || wu.workspaceId === workspaceId
            );
            
            if (!workspaceUser || !workspaceUser.role) {
                console.log('❌ Workspace not found in user workspaces:', workspaceId);
                console.log('📋 Available workspaces:', userWorkspaces.map(wu => ({ 
                    id: wu.workspaceId, 
                    role: wu.role 
                })));
                setError(`Workspace "${workspaceId}" not found or access denied`);
                throw new Error(`Workspace not found or access denied: ${workspaceId}`);
            }

            // Try to fetch workspace details - first try by id, then by workspaceId
            console.log('🔍 Fetching workspace details for:', workspaceId);
            let workspace = null;
            let errors = null;

            // First, try to get by Amplify id
            try {
                const result = await client.models.Workspace.get({ id: workspaceId });
                workspace = result.data;
                errors = result.errors;
            } catch (getError) {
                console.log('⚠️ Failed to get by id, trying by workspaceId filter');
                
                // If get by id fails, try to find by workspaceId field
                const result = await client.models.Workspace.list({
                    filter: { workspaceId: { eq: workspaceId } }
                });
                workspace = result.data?.[0] || null;
                errors = result.errors;
            }

            if (errors && errors.length > 0) {
                console.log('❌ Error fetching workspace:', errors);
                setError('Failed to fetch workspace details');
                throw new Error(`Failed to fetch workspace details: ${errors.map(e => e.message).join(', ')}`);
            }

            if (!workspace) {
                console.log('❌ Workspace not found in database:', workspaceId);
                
                // Debug: List ALL workspaces to see what actually exists
                const { data: allWorkspaces } = await client.models.Workspace.list();
                console.log('🗂️ ALL workspaces in database:', allWorkspaces?.map(w => ({
                    id: w.id,
                    workspaceId: w.workspaceId,
                    name: w.name
                })));
                
                setError(`Workspace "${workspaceId}" not found in database`);
                throw new Error(`Workspace not found: ${workspaceId}`);
            }

            // Update current workspace and role
            console.log('✅ Setting current workspace:', workspace.name, 'id:', workspace.id, 'workspaceId:', workspace.workspaceId);
            setCurrentWorkspace(workspace);
            setUserRole(workspaceUser.role as WorkspaceRole);
            
            // Save to localStorage (use the id that was passed in the URL)
            localStorage.setItem('currentWorkspaceId', workspaceId);

            console.log('✅ Successfully switched to workspace:', workspace.name);

        } catch (err) {
            console.error('❌ Error switching workspace:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to switch workspace';
            setError(errorMessage);
            
            // Clear current workspace on error to prevent stuck state
            setCurrentWorkspace(null);
            setUserRole(null);
            localStorage.removeItem('currentWorkspaceId');
            
            // Re-throw the error so calling code can handle it
            throw err;
        } finally {
            console.log('🏁 switchWorkspace finally block');
            setIsLoading(false);
            isLoadingRef.current = false;
        }
    }, [userWorkspaces, currentWorkspace?.workspaceId, currentWorkspace?.id]);

    // Create a new workspace
    const createWorkspace = useCallback(async (data: CreateWorkspaceInput) => {
        if (!user?.id || isLoadingRef.current) {
            setError('User not authenticated');
            return;
        }

        try {
            isLoadingRef.current = true;
            setIsLoading(true);
            setError(null);

            console.log('Creating workspace:', data.name);

            // Create the workspace
            const workspaceId = `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const { data: newWorkspace, errors: workspaceErrors } = await client.models.Workspace.create({
                workspaceId: workspaceId,
                name: data.name,
                description: data.description || null,
                createdBy: user.id
            });

            if (workspaceErrors && workspaceErrors.length > 0) {
                console.error('Error creating workspace:', workspaceErrors);
                setError('Failed to create workspace');
                return;
            }

            if (!newWorkspace) {
                setError('Failed to create workspace');
                return;
            }

            // Add creator as admin to the workspace
            const { data: workspaceUser, errors: userErrors } = await client.models.WorkspaceUser.create({
                workspaceId: newWorkspace.workspaceId,
                userId: user.id,
                role: 'ADMIN',
                joinedAt: new Date().toISOString()
            });

            if (userErrors && userErrors.length > 0) {
                console.error('Error adding user to workspace:', userErrors);
                setError('Workspace created but failed to assign user');
                return;
            }

            console.log('Workspace created successfully:', newWorkspace.name);

            // Manually refresh workspaces and switch - avoid circular dependency
            if (user?.id && isAuthenticated) {
                try {
                    // Fetch updated workspace list
                    const { data: workspaceUsers, errors } = await client.models.WorkspaceUser.list({
                        filter: {
                            userId: { eq: user.id }
                        }
                    });

                    if (!errors && workspaceUsers) {
                        const validWorkspaceUsers = workspaceUsers.filter(wu => wu.role !== null);
                        setUserWorkspaces(validWorkspaceUsers);
                    }

                    // Switch to the new workspace
                    const { data: workspaces } = await client.models.Workspace.list({
                        filter: {
                            workspaceId: { eq: newWorkspace.workspaceId }
                        }
                    });

                    const workspace = workspaces?.[0];
                    if (workspace) {
                        setCurrentWorkspace(workspace);
                        setUserRole('ADMIN');
                        localStorage.setItem('currentWorkspaceId', newWorkspace.workspaceId);
                    }
                } catch (refreshError) {
                    console.error('Error refreshing after workspace creation:', refreshError);
                }
            }

        } catch (err) {
            console.error('Error creating workspace:', err);
            setError('Failed to create workspace');
        } finally {
            setIsLoading(false);
            isLoadingRef.current = false;
        }
    }, [user?.id, isAuthenticated]);

    // Refresh workspaces
    const refreshWorkspaces = useCallback(async () => {
        console.log('Refreshing workspaces...');
        // Manually call the fetch logic to avoid circular dependency
        if (user?.id && isAuthenticated && !isLoadingRef.current) {
            try {
                isLoadingRef.current = true;
                setIsLoading(true);
                setError(null);

                const { data: workspaceUsers, errors } = await client.models.WorkspaceUser.list({
                    filter: {
                        userId: { eq: user.id }
                    }
                });

                if (errors && errors.length > 0) {
                    console.error('Error refreshing workspaces:', errors);
                    setError('Failed to refresh workspaces');
                    return;
                }

                if (workspaceUsers) {
                    const validWorkspaceUsers = workspaceUsers.filter(wu => wu.role !== null);
                    setUserWorkspaces(validWorkspaceUsers);
                }
            } catch (err) {
                console.error('Error in refreshWorkspaces:', err);
                setError('Failed to refresh workspaces');
            } finally {
                setIsLoading(false);
                isLoadingRef.current = false;
            }
        }
    }, [user?.id, isAuthenticated]); // Removed fetchUserWorkspaces dependency

    // Clear workspace (on logout)
    const clearWorkspace = useCallback(() => {
        console.log('Clearing workspace data');
        setCurrentWorkspace(null);
        setUserWorkspaces([]);
        setUserRole(null);
        setError(null);
        hasInitializedRef.current = false;
        isLoadingRef.current = false;
        localStorage.removeItem('currentWorkspaceId');
    }, []);

    // Reset initialization flag when user changes
    useEffect(() => {
        hasInitializedRef.current = false;
    }, [user?.id]);

    // Fetch user's workspaces - simple wrapper to avoid circular dependencies
    const fetchUserWorkspaces = useCallback(async () => {
        if (!user?.id || !isAuthenticated || isLoadingRef.current) {
            return;
        }

        try {
            isLoadingRef.current = true;
            setIsLoading(true);
            setError(null);

            console.log('Manual fetch - Fetching user workspaces for user:', user.id);

            const { data: workspaceUsers, errors } = await client.models.WorkspaceUser.list({
                filter: {
                    userId: { eq: user.id }
                }
            });

            if (errors && errors.length > 0) {
                console.error('Error fetching user workspaces:', errors);
                setError('Failed to load workspaces');
                return;
            }

            if (workspaceUsers) {
                const validWorkspaceUsers = workspaceUsers.filter(wu => wu.role !== null);
                setUserWorkspaces(validWorkspaceUsers);
                console.log('Manual fetch - Found workspaces:', validWorkspaceUsers.length);
            }
        } catch (err) {
            console.error('Error in manual fetchUserWorkspaces:', err);
            setError('Failed to load workspaces');
        } finally {
            setIsLoading(false);
            isLoadingRef.current = false;
        }
    }, [user?.id, isAuthenticated]); // Minimal dependencies

    const value: WorkspaceContextType = {
        currentWorkspace,
        userWorkspaces,
        userRole,
        isLoading,
        error,
        switchWorkspace,
        refreshWorkspaces,
        createWorkspace,
        clearWorkspace
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}