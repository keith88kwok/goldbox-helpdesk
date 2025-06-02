'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type SelectedWorkspace } from '@/lib/server/workspace-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Building2, Users, Loader2 } from 'lucide-react';
import { createWorkspaceAction } from '@/app/(protected)/dashboard/actions';

interface WorkspaceSelectorProps {
    userWorkspaces: Array<{
        workspace: SelectedWorkspace;
        role: 'ADMIN' | 'MEMBER' | 'VIEWER';
        joinedAt: string;
    }>;
}

export default function WorkspaceSelector({ userWorkspaces }: WorkspaceSelectorProps) {
    const router = useRouter();

    // Create workspace modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        description: ''
    });
    const [createError, setCreateError] = useState<string | null>(null);

    // Handle workspace selection
    const handleWorkspaceSelect = (workspaceId: string) => {
        console.log('Selecting workspace:', workspaceId);
        // Navigate directly to workspace - let server components handle validation
        router.push(`/workspace/${workspaceId}/dashboard`);
    };

    // Handle create workspace form submission
    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!createForm.name.trim()) {
            setCreateError('Workspace name is required');
            return;
        }

        if (createForm.name.trim().length > 100) {
            setCreateError('Workspace name must be 100 characters or less');
            return;
        }

        if (createForm.description.length > 500) {
            setCreateError('Workspace description must be 500 characters or less');
            return;
        }

        try {
            setIsCreating(true);
            setCreateError(null);

            // Create FormData for server action
            const formData = new FormData();
            formData.append('name', createForm.name.trim());
            formData.append('description', createForm.description.trim());

            const result = await createWorkspaceAction(formData);

            if (result.success) {
                // Reset form and close modal
                setCreateForm({ name: '', description: '' });
                setIsCreateModalOpen(false);
                
                // Navigate to the new workspace
                if (result.workspace) {
                    router.push(`/workspace/${result.workspace.id}/dashboard`);
                }
            } else {
                setCreateError(result.error || 'Failed to create workspace');
            }
        } catch (error) {
            console.error('Error creating workspace:', error);
            setCreateError('Failed to create workspace. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleModalClose = () => {
        setIsCreateModalOpen(false);
        setCreateForm({ name: '', description: '' });
        setCreateError(null);
    };

    const getRoleBadgeColor = (role: string) => {
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

    return (
        <div className="mb-8">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Your Workspaces</h2>
                    <p className="text-sm text-gray-600">
                        Select a workspace to access kiosks and tickets
                    </p>
                </div>
                {userWorkspaces.length > 0 && (
                    <Dialog open={isCreateModalOpen} onOpenChange={(open) => open ? setIsCreateModalOpen(true) : handleModalClose()}>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Workspace
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-md mx-auto">
                            <form onSubmit={handleCreateWorkspace}>
                                <DialogHeader>
                                    <DialogTitle>Create New Workspace</DialogTitle>
                                    <DialogDescription>
                                        Create a new workspace to manage kiosks and tickets for your organization.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    {createError && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-sm text-red-800">{createError}</p>
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="workspace-name-header">
                                            Workspace Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="workspace-name-header"
                                            value={createForm.name}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter workspace name..."
                                            maxLength={100}
                                            disabled={isCreating}
                                            className="mt-1"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {createForm.name.length}/100 characters
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="workspace-description-header">
                                            Description (Optional)
                                        </Label>
                                        <Textarea
                                            id="workspace-description-header"
                                            value={createForm.description}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Describe this workspace..."
                                            maxLength={500}
                                            disabled={isCreating}
                                            rows={3}
                                            className="mt-1"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {createForm.description.length}/500 characters
                                        </p>
                                    </div>
                                </div>

                                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleModalClose}
                                        disabled={isCreating}
                                        className="w-full sm:w-auto"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isCreating || !createForm.name.trim()}
                                        className="w-full sm:w-auto"
                                    >
                                        {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        Create Workspace
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Workspaces Grid or Empty State */}
            {userWorkspaces.length === 0 ? (
                <div className="text-center py-8 px-4 bg-white rounded-lg border border-gray-200">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces found</h3>
                    <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                        You don&apos;t have access to any workspaces yet. Create your first workspace to get started.
                    </p>
                    <Dialog open={isCreateModalOpen} onOpenChange={(open) => open ? setIsCreateModalOpen(true) : handleModalClose()}>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Workspace
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-md mx-auto">
                            <form onSubmit={handleCreateWorkspace}>
                                <DialogHeader>
                                    <DialogTitle>Create New Workspace</DialogTitle>
                                    <DialogDescription>
                                        Create a new workspace to manage kiosks and tickets for your organization.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    {createError && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-sm text-red-800">{createError}</p>
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="workspace-name">
                                            Workspace Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="workspace-name"
                                            value={createForm.name}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter workspace name..."
                                            maxLength={100}
                                            disabled={isCreating}
                                            className="mt-1"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {createForm.name.length}/100 characters
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="workspace-description">
                                            Description (Optional)
                                        </Label>
                                        <Textarea
                                            id="workspace-description"
                                            value={createForm.description}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Describe this workspace..."
                                            maxLength={500}
                                            disabled={isCreating}
                                            rows={3}
                                            className="mt-1"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {createForm.description.length}/500 characters
                                        </p>
                                    </div>
                                </div>

                                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleModalClose}
                                        disabled={isCreating}
                                        className="w-full sm:w-auto"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isCreating || !createForm.name.trim()}
                                        className="w-full sm:w-auto"
                                    >
                                        {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        Create Workspace
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userWorkspaces.map((userWorkspace) => (
                        <Card
                            key={userWorkspace.workspace.id}
                            className="hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98]"
                            onClick={() => handleWorkspaceSelect(userWorkspace.workspace.id)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base sm:text-lg mb-1 truncate">
                                            {userWorkspace.workspace.name}
                                        </CardTitle>
                                        <CardDescription className="text-sm line-clamp-2">
                                            {userWorkspace.workspace.description || 'No description'}
                                        </CardDescription>
                                        <CardDescription className="mt-1 text-xs">
                                            Joined {new Date(userWorkspace.joinedAt).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <Badge className={`${getRoleBadgeColor(userWorkspace.role)} flex-shrink-0 text-xs`}>
                                        {userWorkspace.role}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                    <span>Tap to access workspace</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 