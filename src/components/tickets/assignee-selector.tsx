'use client';

import { useState } from 'react';
import { ChevronDown, User, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface WorkspaceUser {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
}

interface AssigneeSelectorProps {
    value: string;
    onChange: (value: string) => void;
    users: WorkspaceUser[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    allowClear?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

// Role color mapping
const roleColors = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    MEMBER: 'bg-blue-100 text-blue-800 border-blue-200',
    VIEWER: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

export function AssigneeSelector({
    value,
    onChange,
    users,
    placeholder = "Select assignee",
    disabled = false,
    className = "",
    allowClear = true,
    size = 'md'
}: AssigneeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Find selected user
    const selectedUser = users.find(user => user.id === value);

    // Filter users based on search term
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (userId: string) => {
        onChange(userId);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    const sizeStyles = {
        sm: 'px-2 py-1.5 text-sm',
        md: 'px-3 py-2 text-base',
        lg: 'px-4 py-3 text-lg'
    };

    return (
        <>
            <div className={`relative ${className}`}>
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(true)}
                    disabled={disabled}
                    className={`
                        w-full ${sizeStyles[size]} border border-gray-300 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white
                        flex items-center justify-between gap-2 text-left
                        ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
                        ${selectedUser ? 'text-gray-900' : 'text-gray-500'}
                    `}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        {selectedUser ? (
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="min-w-0">
                                    <span className="font-medium text-gray-900 block truncate">
                                        {selectedUser.name}
                                    </span>
                                    <span className="text-xs text-gray-500 block truncate">
                                        {selectedUser.email}
                                    </span>
                                </div>
                                <Badge 
                                    variant="secondary" 
                                    className={`${roleColors[selectedUser.role as keyof typeof roleColors] || roleColors.VIEWER} text-xs flex-shrink-0`}
                                >
                                    {selectedUser.role}
                                </Badge>
                            </div>
                        ) : (
                            <span className="truncate">{placeholder}</span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {selectedUser && allowClear && !disabled && (
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={handleClear}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleClear({} as React.MouseEvent);
                                    }
                                }}
                                className="h-5 w-5 p-0 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded cursor-pointer flex items-center justify-center transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </div>
                        )}
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                </button>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Select Assignee
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Search Input */}
                        <div className="relative">
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="text-base"
                                autoFocus
                            />
                        </div>

                        {/* Unassigned Option */}
                        {allowClear && (
                            <div
                                onClick={() => handleSelect('')}
                                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg border transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">Unassigned</div>
                                    <div className="text-sm text-gray-500">No assignee selected</div>
                                </div>
                                {value === '' && (
                                    <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* User List */}
                        <div className="max-h-80 overflow-y-auto space-y-2">
                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm">No users found</p>
                                    {searchTerm && (
                                        <p className="text-xs">Try adjusting your search</p>
                                    )}
                                </div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleSelect(user.id)}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <User className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {user.name}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate">
                                                {user.email}
                                            </div>
                                        </div>
                                        <Badge 
                                            variant="secondary" 
                                            className={`${roleColors[user.role as keyof typeof roleColors] || roleColors.VIEWER} text-xs`}
                                        >
                                            {user.role}
                                        </Badge>
                                        {value === user.id && (
                                            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
} 