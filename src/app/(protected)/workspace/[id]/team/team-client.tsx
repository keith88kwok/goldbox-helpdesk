'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type TeamManagementData, type AvailableUser } from '@/lib/server/team-utils';
import { client } from '@/lib/amplify-client';
import { updateUserRoleAction, removeUserAction, getAvailableUsersAction } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
    Search, 
    Plus, 
    MoreVertical,
    UserPlus,
    UserMinus,
    Settings,
    ArrowLeft,
    Users,
    Loader2,
    Mail,
    Calendar
} from 'lucide-react';
import { UserSelect } from '@/components/ui/user-select';
import { UserMenu } from '@/components/ui/user-menu';

interface TeamClientProps extends TeamManagementData {
    workspaceId: string;
    currentUserId: string;
}

export default function TeamClient({ 
    members, 
    workspace, 
    userRole, 
    canManageTeam, 
    workspaceId,
    currentUserId 
}: TeamClientProps) {
    const router = useRouter();
    
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // User selection state
    const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AvailableUser | null>(null);
    const [inviteMode, setInviteMode] = useState<'email' | 'select'>('email');

    // Invite form state
    const [inviteForm, setInviteForm] = useState({
        email: '',
        preferredUsername: '',
        givenName: '',
        familyName: '',
        role: 'MEMBER' as 'ADMIN' | 'MEMBER' | 'VIEWER',
        sendInviteEmail: false
    });

    // Load available users when modal opens
    const loadAvailableUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        try {
            const result = await getAvailableUsersAction(workspaceId);
            if (result.success) {
                setAvailableUsers(result.users);
            } else {
                console.error('Failed to load available users:', result.error);
            }
        } catch (error) {
            console.error('Error loading available users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        if (isInviteModalOpen && canManageTeam && availableUsers.length === 0) {
            loadAvailableUsers();
        }
    }, [isInviteModalOpen, canManageTeam, availableUsers.length, loadAvailableUsers]);

    // Handle user selection from dropdown
    const handleUserSelect = (user: AvailableUser | null) => {
        setSelectedUser(user);
        if (user) {
            // Auto-populate form fields with selected user data
            setInviteForm(prev => ({
                ...prev,
                email: user.email,
                preferredUsername: user.username,
                givenName: user.name.split(' ')[0] || user.name,
                familyName: user.name.split(' ').slice(1).join(' ') || '',
            }));
        } else {
            // Clear form when no user selected
            setInviteForm(prev => ({
                ...prev,
                email: '',
                preferredUsername: '',
                givenName: '',
                familyName: '',
            }));
        }
    };

    // Handle mode toggle
    const handleModeToggle = (mode: 'email' | 'select') => {
        setInviteMode(mode);
        setSelectedUser(null);
        // Clear form when switching modes
        setInviteForm(prev => ({
            ...prev,
            email: '',
            preferredUsername: '',
            givenName: '',
            familyName: '',
        }));
    };

    // Filter members based on search term
    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Auto-generate username from email when email changes
    const handleEmailChange = (email: string) => {
        setInviteForm(prev => ({ 
            ...prev, 
            email,
            preferredUsername: prev.preferredUsername || email.split('@')[0] // Only auto-fill if empty
        }));
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

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!inviteForm.email || !inviteForm.preferredUsername || !inviteForm.givenName || !inviteForm.familyName) {
            setError('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Use email as username for Cognito login
            const username = inviteForm.email;

            // Call the lambda function directly without server-side validation
            const { data: inviteResult, errors: inviteErrors } = await client.queries.inviteUser({
                email: inviteForm.email,
                username: username,
                preferredUsername: inviteForm.preferredUsername,
                givenName: inviteForm.givenName,
                familyName: inviteForm.familyName,
                workspaceId: workspaceId,
                role: inviteForm.role as 'ADMIN' | 'MEMBER' | 'VIEWER',
                sendInviteEmail: inviteForm.sendInviteEmail,
            });

            if (inviteErrors && inviteErrors.length > 0) {
                setError(`Failed to invite user: ${inviteErrors.map(e => e.message).join(', ')}`);
                return;
            }

            if (!inviteResult) {
                setError('No response from invite function');
                return;
            }

            const result = JSON.parse(inviteResult as string);
            
            if (result.success) {
                // Create a detailed success message with login credentials
                const successMessage = result.isNewUser 
                    ? inviteForm.sendInviteEmail 
                        ? `✅ ${result.message}

📧 Email invitation sent to ${inviteForm.email}!
The user will receive login instructions via email from AWS Cognito.

Workspace: ${workspace.name}
Login URL: ${window.location.origin}/auth/login`
                        : `✅ ${result.message}

📧 Login Information to share with ${inviteForm.preferredUsername}:
• Email/Username: ${inviteForm.email}
• Temporary Password: ${result.temporaryPassword || 'Generated automatically'}
• Login URL: ${window.location.origin}/auth/login
• Workspace: ${workspace.name}

⚠️ Please share these credentials securely with the new user.`
                    : result.message;

                setSuccess(successMessage);
                setInviteForm({ email: '', preferredUsername: '', givenName: '', familyName: '', role: 'MEMBER', sendInviteEmail: false });
                setIsInviteModalOpen(false);
                // Refresh the page to show new member
                router.refresh();
            } else {
                setError(result.error || result.message || 'Failed to invite user');
            }
        } catch (error) {
            console.error('Error inviting user:', error);
            setError('Failed to invite user. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (memberId: string, newRole: string) => {
        if (!canManageTeam) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await updateUserRoleAction(workspaceId, memberId, newRole as 'ADMIN' | 'MEMBER' | 'VIEWER');

            if (result.success) {
                setSuccess(result.message);
                router.refresh();
            } else {
                setError(result.error || 'Failed to update role');
            }
        } catch (error) {
            console.error('Error updating role:', error);
            setError('Failed to update role. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveUser = async (memberId: string, memberName: string) => {
        if (!canManageTeam) return;
        
        if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) {
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await removeUserAction(workspaceId, memberId);

            if (result.success) {
                setSuccess(result.message);
                router.refresh();
            } else {
                setError(result.error || 'Failed to remove user');
            }
        } catch (error) {
            console.error('Error removing user:', error);
            setError('Failed to remove user. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-0 sm:h-16 gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/workspace/${workspaceId}/dashboard`)}
                                className="w-fit sm:w-auto"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <div className="flex items-center">
                                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mr-2 sm:mr-3" />
                                <div>
                                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                                        Team Management
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        {workspace.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <UserMenu userRole={userRole} />
                            {canManageTeam && (
                                <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full sm:w-auto">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Invite Member
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-[95vw] max-w-md mx-auto">
                                        <form onSubmit={handleInviteUser}>
                                            <DialogHeader>
                                                <DialogTitle>Invite New Member</DialogTitle>
                                                <DialogDescription>
                                                    Invite a user to join this workspace. Select an existing user or enter details for a new user.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="grid gap-4 py-4">
                                                {/* Mode Toggle */}
                                                <div className="grid gap-2">
                                                    <Label>Invitation Method</Label>
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleModeToggle('select')}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                                inviteMode === 'select'
                                                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                                                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            <Users className="h-4 w-4" />
                                                            Select Existing User
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleModeToggle('email')}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                                inviteMode === 'email'
                                                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                                                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            <Mail className="h-4 w-4" />
                                                            Invite by Email
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* User Selection Mode */}
                                                {inviteMode === 'select' && (
                                                    <div className="grid gap-2">
                                                        <Label>Select User</Label>
                                                        <UserSelect
                                                            users={availableUsers}
                                                            selectedUser={selectedUser}
                                                            onSelectUser={handleUserSelect}
                                                            placeholder="Choose a user to invite..."
                                                            isLoading={isLoadingUsers}
                                                        />
                                                        {availableUsers.length === 0 && !isLoadingUsers && (
                                                            <p className="text-sm text-gray-500">
                                                                No users available to invite. All existing users are already members of this workspace.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Email Mode */}
                                                {inviteMode === 'email' && (
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="email">Email Address</Label>
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            value={inviteForm.email}
                                                            onChange={(e) => {
                                                                handleEmailChange(e.target.value);
                                                            }}
                                                            placeholder="user@company.com"
                                                            required
                                                            className="text-base"
                                                        />
                                                    </div>
                                                )}
                                                
                                                {/* Form fields - shown when user selected or in email mode */}
                                                {(selectedUser || inviteMode === 'email') && (
                                                    <>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="preferredUsername">Preferred Username</Label>
                                                                <Input
                                                                    id="preferredUsername"
                                                                    value={inviteForm.preferredUsername}
                                                                    onChange={(e) => setInviteForm(prev => ({ ...prev, preferredUsername: e.target.value }))}
                                                                    placeholder="john_doe"
                                                                    required
                                                                    className="text-base"
                                                                    disabled={!!selectedUser}
                                                                />
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="givenName">First Name</Label>
                                                                <Input
                                                                    id="givenName"
                                                                    value={inviteForm.givenName}
                                                                    onChange={(e) => setInviteForm(prev => ({ ...prev, givenName: e.target.value }))}
                                                                    placeholder="John"
                                                                    required
                                                                    className="text-base"
                                                                    disabled={!!selectedUser}
                                                                />
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="familyName">Last Name</Label>
                                                            <Input
                                                                id="familyName"
                                                                value={inviteForm.familyName}
                                                                onChange={(e) => setInviteForm(prev => ({ ...prev, familyName: e.target.value }))}
                                                                placeholder="Doe"
                                                                required
                                                                className="text-base"
                                                                disabled={!!selectedUser}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                                
                                                <div className="grid gap-2">
                                                    <Label htmlFor="role">Role</Label>
                                                    <select
                                                        id="role"
                                                        value={inviteForm.role}
                                                        onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as 'ADMIN' | 'MEMBER' | 'VIEWER' }))}
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <option value="VIEWER">Viewer - View only access</option>
                                                        <option value="MEMBER">Member - Create and edit content</option>
                                                        <option value="ADMIN">Admin - Full management access</option>
                                                    </select>
                                                </div>

                                                {inviteMode === 'email' && (
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            id="sendInviteEmail"
                                                            type="checkbox"
                                                            checked={inviteForm.sendInviteEmail}
                                                            onChange={(e) => setInviteForm(prev => ({ ...prev, sendInviteEmail: e.target.checked }))}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                        <Label htmlFor="sendInviteEmail" className="text-sm">
                                                            Send email invitation (Cognito will email the temporary password)
                                                        </Label>
                                                    </div>
                                                )}
                                            </div>

                                            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsInviteModalOpen(false);
                                                        setSelectedUser(null);
                                                        setInviteMode('email');
                                                        setInviteForm({
                                                            email: '',
                                                            preferredUsername: '',
                                                            givenName: '',
                                                            familyName: '',
                                                            role: 'MEMBER',
                                                            sendInviteEmail: false
                                                        });
                                                    }}
                                                    disabled={isLoading}
                                                    className="w-full sm:w-auto"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    type="submit" 
                                                    disabled={isLoading || (inviteMode === 'select' && !selectedUser)}
                                                    className="w-full sm:w-auto"
                                                >
                                                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                    {selectedUser ? 'Add to Workspace' : 'Send Invite'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Status Messages */}
                {error && (
                    <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="mb-6 p-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                        <div className="whitespace-pre-line">{success}</div>
                        {success.includes('Login Information') && (
                            <button 
                                onClick={() => navigator.clipboard.writeText(success)}
                                className="mt-2 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                📋 Copy to Clipboard
                            </button>
                        )}
                    </div>
                )}

                {/* Team Overview */}
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                        Team Members ({members.length})
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">
                        Manage workspace members and their permissions.
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search members by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 text-base"
                        />
                    </div>
                </div>

                {/* Members List */}
                <div className="space-y-4">
                    {filteredMembers.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-8">
                                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">
                                    {searchTerm ? 'No members found matching your search.' : 'No team members found.'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredMembers.map((member) => (
                            <Card key={member.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex items-start sm:items-center gap-3 flex-1">
                                            {/* Avatar */}
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            
                                            {/* Member Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {member.name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                    <Mail className="h-4 w-4" />
                                                    <span className="truncate">{member.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Role and Actions */}
                                        <div className="flex items-center gap-3">
                                            <Badge className={`${getRoleBadgeColor(member.role)} text-xs`}>
                                                {member.role}
                                            </Badge>
                                            
                                            {canManageTeam && member.userId !== currentUserId && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {member.role !== 'ADMIN' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleRoleChange(member.userId, 'ADMIN')}
                                                            >
                                                                <Settings className="h-4 w-4 mr-2" />
                                                                Make Admin
                                                            </DropdownMenuItem>
                                                        )}
                                                        {member.role !== 'MEMBER' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleRoleChange(member.userId, 'MEMBER')}
                                                            >
                                                                <UserPlus className="h-4 w-4 mr-2" />
                                                                Make Member
                                                            </DropdownMenuItem>
                                                        )}
                                                        {member.role !== 'VIEWER' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleRoleChange(member.userId, 'VIEWER')}
                                                            >
                                                                <UserPlus className="h-4 w-4 mr-2" />
                                                                Make Viewer
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => handleRemoveUser(member.userId, member.name)}
                                                        >
                                                            <span className="text-red-600 flex items-center">
                                                                <UserMinus className="h-4 w-4 mr-2" />
                                                                Remove from Workspace
                                                            </span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Summary */}
                {filteredMembers.length > 0 && (
                    <div className="mt-6 sm:mt-8 text-center text-gray-500 px-4">
                        <p className="text-sm">
                            Showing {filteredMembers.length} of {members.length} members
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
} 