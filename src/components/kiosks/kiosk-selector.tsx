'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Search, MapPin, X } from 'lucide-react';
import { type SelectedKiosk } from '@/lib/server/kiosk-utils';
import { Badge } from '@/components/ui/badge';

interface KioskSelectorProps {
    kiosks: SelectedKiosk[];
    value: string;
    onChange: (kioskId: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    error?: string;
}

// Status color mapping
const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800 border-green-200',
    INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
    MAINTENANCE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    RETIRED: 'bg-red-100 text-red-800 border-red-200',
} as const;

export function KioskSelector({
    kiosks,
    value,
    onChange,
    placeholder = "Select a kiosk",
    disabled = false,
    className = "",
    error
}: KioskSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Find selected kiosk
    const selectedKiosk = kiosks.find(kiosk => kiosk.id === value);

    // Filter kiosks based on search term
    const filteredKiosks = useMemo(() => {
        if (!searchTerm.trim()) return kiosks;
        
        const term = searchTerm.toLowerCase();
        return kiosks.filter(kiosk => 
            kiosk.address.toLowerCase().includes(term) ||
            (kiosk.locationDescription && kiosk.locationDescription.toLowerCase().includes(term)) ||
            (kiosk.status && kiosk.status.toLowerCase().includes(term))
        );
    }, [kiosks, searchTerm]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
                setSearchTerm('');
            }
        }
    };

    const handleSelect = (kioskId: string) => {
        onChange(kioskId);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
        } else if (e.key === 'Enter' && !isOpen) {
            e.preventDefault();
            handleToggle();
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Main selector button */}
            <button
                type="button"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={`
                    w-full px-3 py-3 text-left bg-white border rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 
                    transition-colors duration-200
                    ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:border-gray-400'}
                    ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                    ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                `}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                        {selectedKiosk ? (
                            <div className="flex items-center min-w-0 flex-1">
                                <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {selectedKiosk.address}
                                    </p>
                                    {selectedKiosk.locationDescription && (
                                        <p className="text-xs text-gray-500 truncate">
                                            {selectedKiosk.locationDescription}
                                        </p>
                                    )}
                                </div>
                                <Badge 
                                    variant="secondary" 
                                    className={`ml-2 text-xs ${statusColors[selectedKiosk.status as keyof typeof statusColors] || statusColors.ACTIVE}`}
                                >
                                    {selectedKiosk.status}
                                </Badge>
                            </div>
                        ) : (
                            <span className="text-gray-500 text-base">{placeholder}</span>
                        )}
                    </div>
                    
                    <div className="flex items-center ml-2">
                        {selectedKiosk && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 hover:bg-gray-100 rounded mr-1 transition-colors"
                                aria-label="Clear selection"
                            >
                                <X className="h-3 w-3 text-gray-400" />
                            </button>
                        )}
                        <ChevronDown 
                            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                                isOpen ? 'transform rotate-180' : ''
                            }`} 
                        />
                    </div>
                </div>
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                    {/* Search input */}
                    <div className="p-3 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search kiosks..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                aria-label="Search kiosks"
                            />
                        </div>
                    </div>

                    {/* Options list */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredKiosks.length > 0 ? (
                            filteredKiosks.map((kiosk) => (
                                <button
                                    key={kiosk.id}
                                    type="button"
                                    onClick={() => handleSelect(kiosk.id)}
                                    className={`
                                        w-full px-3 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 
                                        focus:outline-none border-b border-gray-100 last:border-b-0
                                        transition-colors duration-150
                                        ${value === kiosk.id ? 'bg-blue-50 border-blue-200' : ''}
                                    `}
                                    role="option"
                                    aria-selected={value === kiosk.id}
                                >
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {kiosk.address}
                                            </p>
                                            {kiosk.locationDescription && (
                                                <p className="text-xs text-gray-500 truncate mt-1">
                                                    {kiosk.locationDescription}
                                                </p>
                                            )}
                                        </div>
                                        <Badge 
                                            variant="secondary" 
                                            className={`ml-2 text-xs ${statusColors[kiosk.status as keyof typeof statusColors] || statusColors.ACTIVE}`}
                                        >
                                            {kiosk.status}
                                        </Badge>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-6 text-center text-sm text-gray-500">
                                {searchTerm ? 'No kiosks found matching your search' : 'No kiosks available'}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
} 