import React, { useState, useRef, useEffect } from 'react';
import { type AvailableUser } from '@/lib/server/team-utils';
import { Search, Users, ChevronDown } from 'lucide-react';

interface UserSelectProps {
    users: AvailableUser[];
    selectedUser: AvailableUser | null;
    onSelectUser: (user: AvailableUser | null) => void;
    placeholder?: string;
    isLoading?: boolean;
}

export function UserSelect({ 
    users, 
    selectedUser, 
    onSelectUser, 
    placeholder = "Select a user...",
    isLoading = false 
}: UserSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Filter users based on search term
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUserSelect = (user: AvailableUser) => {
        onSelectUser(user);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = () => {
        onSelectUser(null);
        setSearchTerm('');
    };

    return (
        <div ref={dropdownRef} className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {selectedUser ? (
                        <>
                            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {selectedUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {selectedUser.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                    {selectedUser.email}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-500 text-sm">
                                {isLoading ? 'Loading users...' : placeholder}
                            </span>
                        </>
                    )}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* User List */}
                    <div className="max-h-48 overflow-y-auto">
                        {selectedUser && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100"
                            >
                                Clear selection
                            </button>
                        )}

                        {filteredUsers.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                {searchTerm ? 'No users found matching your search.' : 'No users available to invite.'}
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleUserSelect(user)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                {user.name}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {user.email} • @{user.username}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
} 