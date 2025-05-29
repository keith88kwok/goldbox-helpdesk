import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, User, ChevronDown } from 'lucide-react';

interface UserMenuProps {
    userRole?: 'ADMIN' | 'MEMBER' | 'VIEWER';
    className?: string;
}

export function UserMenu({ userRole, className = '' }: UserMenuProps) {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if logout fails
            router.push('/auth/login');
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-red-100 text-red-800';
            case 'MEMBER':
                return 'bg-blue-100 text-blue-800';
            case 'VIEWER':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (!user) return null;

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* User Role Badge */}
            {userRole && (
                <div className={`px-2 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(userRole)}`}>
                    {userRole}
                </div>
            )}

            {/* User Menu Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        className="flex items-center gap-2 hover:bg-gray-100 min-h-[44px] px-3"
                        disabled={isLoading}
                    >
                        {/* User Avatar */}
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* User Info - Hidden on mobile */}
                        <div className="hidden sm:flex flex-col items-start">
                            <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                                {user.name}
                            </span>
                            <span className="text-xs text-gray-500 truncate max-w-32">
                                {user.email}
                            </span>
                        </div>
                        
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end">
                    {/* User Info (Mobile) */}
                    <div className="px-3 py-2 border-b border-gray-100 sm:hidden">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                            {user.email}
                        </div>
                    </div>

                    {/* Menu Items */}
                    <DropdownMenuItem
                        onClick={() => router.push('/workspaces')}
                    >
                        <User className="h-4 w-4 mr-2" />
                        My Workspaces
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        {isLoading ? 'Signing out...' : 'Sign Out'}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
} 