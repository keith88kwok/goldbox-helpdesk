import React, { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
    children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
    asChild?: boolean;
    children: React.ReactNode;
}

interface DropdownMenuContentProps {
    align?: 'start' | 'end';
    children: React.ReactNode;
}

interface DropdownMenuItemProps {
    asChild?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    return (
        <div ref={dropdownRef} className="relative inline-block text-left">
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as any, { 
                        isOpen, 
                        setIsOpen
                    });
                }
                return child;
            })}
        </div>
    );
}

export function DropdownMenuTrigger({
    asChild = false,
    children,
    ...props
}: DropdownMenuTriggerProps & { isOpen?: boolean; setIsOpen?: (open: boolean) => void }) {
    const { isOpen, setIsOpen } = props;

    const handleClick = () => {
        setIsOpen?.(!isOpen);
    };

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as any, {
            onClick: handleClick
        });
    }

    return (
        <button onClick={handleClick} className="w-full">
            {children}
        </button>
    );
}

export function DropdownMenuContent({
    align = 'start',
    children,
    ...props
}: DropdownMenuContentProps & { isOpen?: boolean; setIsOpen?: (open: boolean) => void }) {
    const { isOpen, setIsOpen } = props;

    if (!isOpen) return null;

    return (
        <div 
            className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-lg ${
                align === 'end' ? 'right-0' : 'left-0'
            } top-full mt-1`}
        >
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as any, { 
                        setIsOpen
                    });
                }
                return child;
            })}
        </div>
    );
}

export function DropdownMenuItem({
    asChild = false,
    onClick,
    children,
    ...props
}: DropdownMenuItemProps & { setIsOpen?: (open: boolean) => void }) {
    const { setIsOpen } = props;

    const handleClick = () => {
        onClick?.();
        setIsOpen?.(false);
    };

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as any, {
            onClick: handleClick,
            className: "block px-3 py-2 text-sm hover:bg-gray-100 rounded w-full text-left cursor-pointer text-gray-900"
        });
    }

    return (
        <button
            onClick={handleClick}
            className="block w-full px-3 py-2 text-sm text-left hover:bg-gray-100 rounded cursor-pointer text-gray-900"
        >
            {children}
        </button>
    );
} 