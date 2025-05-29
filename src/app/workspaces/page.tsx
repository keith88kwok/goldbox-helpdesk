'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { client, type Schema } from '@/lib/amplify-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Building2, Users, Loader2 } from 'lucide-react';

type WorkspaceUserType = Schema['WorkspaceUser']['type'];
type WorkspaceType = Schema['Workspace']['type'];

interface WorkspaceWithDetails {
    workspaceId: string;
    userId: string;
    role: string | null | undefined;
    joinedAt: string | null;
    workspace?: WorkspaceType | null;
}

export default function WorkspacesPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const {
        userWorkspaces,
        isLoading: workspaceLoading,
        error,
        createWorkspace,
        switchWorkspace
    } = useWorkspace();

    // Local state for workspace details
    const [workspacesWithDetails, setWorkspacesWithDetails] = useState<WorkspaceWithDetails[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [hasLoadedDetails, setHasLoadedDetails] = useState(false);

    // Create workspace modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        description: ''
    });

    // Memoize workspace IDs to prevent unnecessary effect triggers
    const workspaceIds = useMemo(() => 
        userWorkspaces.map(wu => wu.workspaceId).sort().join(','),
        [userWorkspaces]
    );

    // Fetch workspace details - optimized with loading guard
    useEffect(() => {
        const fetchWorkspaceDetails = async () => {
            // Prevent multiple simultaneous calls
            if (!userWorkspaces.length || isLoadingDetails || hasLoadedDetails) {
                if (!userWorkspaces.length) {
                    setWorkspacesWithDetails([]);
                    setHasLoadedDetails(false);
                }
                return;
            }

            console.log('Fetching details for', userWorkspaces.length, 'workspaces');
            setIsLoadingDetails(true);
            
            try {
                const workspacesWithDetails = await Promise.all(
                    userWorkspaces.map(async (wu): Promise<WorkspaceWithDetails> => {
                        try {
                            const { data: workspace } = await client.models.Workspace.get({
                                id: wu.workspaceId
                            });
                            
                            return {
                                workspaceId: wu.workspaceId,
                                userId: wu.userId,
                                role: wu.role || null,
                                joinedAt: wu.joinedAt || null,
                                workspace: workspace || null
                            };
                        } catch (error) {
                            console.error(`Error fetching workspace ${wu.workspaceId}:`, error);
                            return {
                                workspaceId: wu.workspaceId,
                                userId: wu.userId,
                                role: null,
                                joinedAt: null,
                                workspace: null
                            };
                        }
                    })
                );
                
                console.log('Successfully loaded workspace details');
                setWorkspacesWithDetails(workspacesWithDetails);
                setHasLoadedDetails(true);
            } catch (error) {
                console.error('Error fetching workspace details:', error);
            } finally {
                setIsLoadingDetails(false);
            }
        };

        fetchWorkspaceDetails();
    }, [workspaceIds]); // Use memoized IDs instead of userWorkspaces directly

    // Reset loaded flag when workspaces change significantly
    useEffect(() => {
        setHasLoadedDetails(false);
    }, [workspaceIds]);

    // Handle workspace selection
    const handleWorkspaceSelect = async (workspaceId: string) => {
        try {
            console.log('Selecting workspace:', workspaceId);
            await switchWorkspace(workspaceId);
            // Only navigate if switch was successful - use 'id' in URL path
            router.push(`/workspace/${workspaceId}/dashboard`);
        } catch (error) {
            console.error('Error switching workspace:', error);
            // Error is already set in workspace context, so UI will show it
            // Don't navigate on error
        }
    };

    // Handle create workspace
    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!createForm.name.trim()) return;

        try {
            setIsCreating(true);
            console.log('Creating workspace:', createForm.name);
            
            await createWorkspace({
                name: createForm.name.trim(),
                description: createForm.description.trim() || undefined
            });
            
            // Reset form and close modal
            setCreateForm({ name: '', description: '' });
            setIsCreateModalOpen(false);
            
            // Reset loaded flag to refetch details
            setHasLoadedDetails(false);
            
        } catch (error) {
            console.error('Error creating workspace:', error);
        } finally {
            setIsCreating(false);
        }
    };

    // Show loading state
    if (authLoading || workspaceLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading workspaces...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error: {error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const getRoleBadgeColor = (role: string | null | undefined) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-red-100 text-red-800 hover:bg-red-200';
            case 'MEMBER':
                return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
            case 'VIEWER':
                return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
        }
    };

    // Show loading state for workspace details
    if (isLoadingDetails && workspacesWithDetails.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading workspace details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Your Workspaces</h1>
                            <p className="mt-2 text-gray-600">
                                Select a workspace to access kiosks and tickets
                            </p>
                        </div>

                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Workspace
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form onSubmit={handleCreateWorkspace}>
                                    <DialogHeader>
                                        <DialogTitle>Create New Workspace</DialogTitle>
                                        <DialogDescription>
                                            Create a new workspace to organize your kiosk maintenance activities.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Workspace Name</Label>
                                            <Input
                                                id="name"
                                                value={createForm.name}
                                                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Enter workspace name"
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Description (optional)</Label>
                                            <Textarea
                                                id="description"
                                                value={createForm.description}
                                                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                                placeholder="Describe this workspace"
                                                rows={3}
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCreateModalOpen(false)}
                                            disabled={isCreating}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isCreating || !createForm.name.trim()}>
                                            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            Create Workspace
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Workspaces Grid */}
                {workspacesWithDetails.length === 0 && !isLoadingDetails ? (
                    <div className="text-center py-12">
                        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces found</h3>
                        <p className="text-gray-600 mb-6">
                            You don't have access to any workspaces yet. Create your first workspace to get started.
                        </p>
                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Workspace
                                </Button>
                            </DialogTrigger>
                        </Dialog>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workspacesWithDetails.map((workspaceUser) => (
                            <Card
                                key={workspaceUser.workspaceId}
                                className="hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => handleWorkspaceSelect(workspaceUser.workspaceId)}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg mb-1">
                                                {workspaceUser.workspace?.name || `Workspace ${workspaceUser.workspaceId.split('-')[1]}`}
                                            </CardTitle>
                                            <CardDescription>
                                                {workspaceUser.workspace?.description || 'No description'}
                                            </CardDescription>
                                            <CardDescription className="mt-1">
                                                Joined {workspaceUser.joinedAt ? new Date(workspaceUser.joinedAt).toLocaleDateString() : 'Unknown'}
                                            </CardDescription>
                                        </div>
                                        <Badge className={getRoleBadgeColor(workspaceUser.role)}>
                                            {workspaceUser.role || 'VIEWER'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Users className="h-4 w-4 mr-1" />
                                        <span>Click to access workspace</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        
                        {/* Show loading indicator for individual workspace cards if needed */}
                        {isLoadingDetails && workspacesWithDetails.length > 0 && (
                            <Card className="flex items-center justify-center h-32">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </Card>
                        )}
                    </div>
                )}

                {/* User Info */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="text-center text-sm text-gray-600">
                        Logged in as {user?.name} ({user?.email})
                    </div>
                </div>
            </div>
        </div>
    );
} 