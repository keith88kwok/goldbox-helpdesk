'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Schema } from '@/lib/amplify-client';
import { type SelectedWorkspace } from '@/lib/server/workspace-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Building2, Users, Loader2 } from 'lucide-react';
import { client } from '@/lib/amplify-client';
import { UserMenu } from '@/components/ui/user-menu';

interface WorkspacesClientProps {
    userWorkspaces: Array<{
        workspace: SelectedWorkspace;
        role: 'ADMIN' | 'MEMBER' | 'VIEWER';
        joinedAt: string;
    }>;
    user: {
        id: string;
        email: string;
        username: string;
        name: string;
    };
}

export default function WorkspacesClient({ userWorkspaces, user }: WorkspacesClientProps) {
    const router = useRouter();

    // Create workspace modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        description: ''
    });

    // Handle workspace selection
    const handleWorkspaceSelect = (workspaceId: string) => {
        console.log('Selecting workspace:', workspaceId);
        // Navigate directly to workspace - let server components handle validation
        router.push(`/workspace/${workspaceId}/dashboard`);
    };

    // Handle create workspace
    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!createForm.name.trim()) return;

        try {
            setIsCreating(true);
            console.log('Creating workspace:', createForm.name);

            // Create the workspace
            const workspaceId = `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const { data: newWorkspace, errors: workspaceErrors } = await client.models.Workspace.create({
                workspaceId: workspaceId,
                name: createForm.name.trim(),
                description: createForm.description.trim() || null,
                createdBy: user.id
            });

            if (workspaceErrors && workspaceErrors.length > 0) {
                console.error('Error creating workspace:', workspaceErrors);
                throw new Error('Failed to create workspace');
            }

            if (!newWorkspace) {
                throw new Error('Failed to create workspace');
            }

            // Add creator as admin to the workspace
            const { data: workspaceUser, errors: userErrors } = await client.models.WorkspaceUser.create({
                workspaceId: newWorkspace.id,
                userId: user.id,
                role: 'ADMIN',
                joinedAt: new Date().toISOString()
            });

            if (userErrors && userErrors.length > 0) {
                console.error('Error adding user to workspace:', userErrors);
                throw new Error('Workspace created but failed to assign user');
            }

            console.log('Workspace created successfully:', newWorkspace.name);

            // Reset form and close modal
            setCreateForm({ name: '', description: '' });
            setIsCreateModalOpen(false);

            // Refresh the page to show new workspace
            router.refresh();

        } catch (error) {
            console.error('Error creating workspace:', error);
            // TODO: Add proper error handling/toast notification
        } finally {
            setIsCreating(false);
        }
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
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Workspaces</h1>
                            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                                Select a workspace to access kiosks and tickets
                            </p>
                        </div>
                        <UserMenu />
                    </div>
                </div>

                {/* User Info Display */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-6 sm:mb-8">
                    <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold mr-3 flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium text-blue-900 truncate">
                                Welcome back, {user.name}
                            </p>
                            <p className="text-xs sm:text-sm text-blue-700 truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Workspaces Grid */}
                {userWorkspaces.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-4">
                        <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces found</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                            You don't have access to any workspaces yet. Create your first workspace to get started.
                        </p>
                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full sm:w-auto">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Workspace
                                </Button>
                            </DialogTrigger>
                        </Dialog>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
        </div>
    );
} 