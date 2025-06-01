/**
 * CSV Utilities for Import/Export functionality
 * Handles CSV template generation, parsing, and validation
 */

// Types
export interface CSVTemplateConfig {
    includeHeaders: boolean;
    includeSampleData: boolean;
    filename: string;
}

export interface KioskCSVRow {
    address: string;
    locationDescription?: string;
    description?: string;
    remark?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED';
}

export interface ParsedKioskRow {
    rowNumber: number;
    data: KioskCSVRow;
    errors: string[];
    isValid: boolean;
}

export interface CSVParseResult {
    validRows: ParsedKioskRow[];
    invalidRows: ParsedKioskRow[];
    totalRows: number;
    hasErrors: boolean;
}

// Ticket Export Types
export interface TicketExportData {
    ticketId: string;
    title: string;
    description: string;
    status: string;
    kioskAddress: string;
    kioskDescription: string;
    reporterName: string;
    assigneeName: string;
    reportedDate: string;
    scheduledDate: string;
    updatedDate: string;
    commentsCount: number;
}

export interface TicketExportOptions {
    filename?: string;
    workspaceName?: string;
    dateRange?: {
        from?: string;
        to?: string;
    };
    totalCount?: number;
    filteredCount?: number;
}

// Constants
export const KIOSK_CSV_HEADERS = [
    'address',
    'locationDescription', 
    'description',
    'remark',
    'status'
] as const;

export const VALID_KIOSK_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED'] as const;

export const SAMPLE_KIOSK_DATA = [
    [
        '123 Main Street, Building A',
        'Near main entrance, ground floor',
        '24-inch touchscreen information kiosk',
        'High traffic area, requires daily cleaning',
        'ACTIVE'
    ],
    [
        '456 Oak Avenue, Floor 2',
        'By the elevators, east wing', 
        'Self-service check-in kiosk',
        'Recently serviced, working normally',
        'ACTIVE'
    ],
    [
        '789 Pine Road, Lobby',
        'Central lobby area',
        'Payment processing kiosk',
        'Scheduled for maintenance next week',
        'MAINTENANCE'
    ],
    [
        '321 Elm Street, Basement',
        'Storage area access point',
        'Employee access kiosk',
        'Rarely used, consider retiring',
        'INACTIVE'
    ]
];

// Ticket CSV Constants
export const TICKET_CSV_HEADERS = [
    'Ticket ID',
    'Title',
    'Description', 
    'Status',
    'Kiosk Address',
    'Kiosk Description',
    'Reporter',
    'Assignee',
    'Reported Date',
    'Scheduled Date',
    'Updated Date',
    'Comments Count'
] as const;

// Template Generation
export const generateCSVTemplate = (config: Partial<CSVTemplateConfig> = {}): string => {
    const {
        includeHeaders = true,
        includeSampleData = true
    } = config;

    const rows: string[][] = [];
    
    // Add headers
    if (includeHeaders) {
        rows.push([...KIOSK_CSV_HEADERS]);
    }
    
    // Add sample data
    if (includeSampleData) {
        rows.push(...SAMPLE_KIOSK_DATA);
    }
    
    // Convert to CSV format
    const csvContent = rows
        .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n');
    
    return csvContent;
};

export const downloadCSVTemplate = (config: Partial<CSVTemplateConfig> = {}) => {
    const csvContent = generateCSVTemplate(config);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', config.filename || 'kiosk-import-template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// CSV Parsing
export const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.trim().split('\n');
    const result: string[][] = [];
    
    for (const line of lines) {
        if (!line.trim()) continue;
        
        const row: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                row.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add the last field
        row.push(current.trim());
        result.push(row);
    }
    
    return result;
};

// Data Validation
export const validateKioskRow = (rowData: string[], rowNumber: number, existingAddresses: Set<string> = new Set()): ParsedKioskRow => {
    const errors: string[] = [];
    
    // Check column count
    if (rowData.length < KIOSK_CSV_HEADERS.length) {
        errors.push(`Row has ${rowData.length} columns, expected ${KIOSK_CSV_HEADERS.length}`);
    }
    
    const [address, locationDescription, description, remark, status] = rowData;
    
    // Validate required fields
    if (!address?.trim()) {
        errors.push('Address is required');
    } else if (address.length > 255) {
        errors.push('Address must be less than 255 characters');
    } else if (existingAddresses.has(address.trim().toLowerCase())) {
        errors.push('Duplicate address found in import data');
    }
    
    // Validate status
    if (!status?.trim()) {
        errors.push('Status is required');
    } else if (!VALID_KIOSK_STATUSES.includes(status.trim().toUpperCase() as KioskCSVRow['status'])) {
        errors.push(`Status must be one of: ${VALID_KIOSK_STATUSES.join(', ')}`);
    }
    
    // Validate optional field lengths
    if (locationDescription && locationDescription.length > 500) {
        errors.push('Location description must be less than 500 characters');
    }
    
    if (description && description.length > 1000) {
        errors.push('Description must be less than 1000 characters');
    }
    
    if (remark && remark.length > 500) {
        errors.push('Remark must be less than 500 characters');
    }
    
    // Add to existing addresses set if valid
    if (address?.trim() && errors.length === 0) {
        existingAddresses.add(address.trim().toLowerCase());
    }
    
    const data: KioskCSVRow = {
        address: address?.trim() || '',
        locationDescription: locationDescription?.trim() || undefined,
        description: description?.trim() || undefined,
        remark: remark?.trim() || undefined,
        status: (status?.trim().toUpperCase() || 'ACTIVE') as KioskCSVRow['status']
    };
    
    return {
        rowNumber,
        data,
        errors,
        isValid: errors.length === 0
    };
};

// Main parsing function
export const parseKioskCSV = (csvText: string): CSVParseResult => {
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
        return {
            validRows: [],
            invalidRows: [],
            totalRows: 0,
            hasErrors: true
        };
    }
    
    // Check headers
    const headers = rows[0];
    const expectedHeaders = [...KIOSK_CSV_HEADERS];
    const headerErrors: string[] = [];
    
    if (headers.length !== expectedHeaders.length) {
        headerErrors.push(`Expected ${expectedHeaders.length} columns, got ${headers.length}`);
    }
    
    for (let i = 0; i < expectedHeaders.length; i++) {
        if (headers[i]?.toLowerCase() !== expectedHeaders[i].toLowerCase()) {
            headerErrors.push(`Column ${i + 1}: expected "${expectedHeaders[i]}", got "${headers[i] || 'missing'}"`);
        }
    }
    
    if (headerErrors.length > 0) {
        return {
            validRows: [],
            invalidRows: [{
                rowNumber: 1,
                data: {} as KioskCSVRow,
                errors: ['Header validation failed:', ...headerErrors],
                isValid: false
            }],
            totalRows: rows.length,
            hasErrors: true
        };
    }
    
    // Parse data rows (skip header)
    const dataRows = rows.slice(1);
    const validRows: ParsedKioskRow[] = [];
    const invalidRows: ParsedKioskRow[] = [];
    const existingAddresses = new Set<string>();
    
    dataRows.forEach((row, index) => {
        const parsedRow = validateKioskRow(row, index + 2, existingAddresses); // +2 because we skip header and use 1-based indexing
        
        if (parsedRow.isValid) {
            validRows.push(parsedRow);
        } else {
            invalidRows.push(parsedRow);
        }
    });
    
    return {
        validRows,
        invalidRows,
        totalRows: rows.length,
        hasErrors: invalidRows.length > 0
    };
};

// Helper functions
export const getTemplateInstructions = (): string[] => {
    return [
        'Download the CSV template below and fill in your kiosk data.',
        'Required fields: address, status (must be ACTIVE, INACTIVE, MAINTENANCE, or RETIRED)',
        'Optional fields: locationDescription, description, remark',
        'Do not change the column headers in the first row.',
        'Each row represents one kiosk to be imported.',
        'Addresses must be unique within the import file.',
        'Save the file and upload it using the import function.',
        'The system will validate your data before importing.'
    ];
};

export const exportErrorsToCSV = (invalidRows: ParsedKioskRow[], filename: string = 'import-errors.csv') => {
    const headers = ['Row Number', 'Address', 'Errors', 'Original Data'];
    const errorData = invalidRows.map(row => [
        row.rowNumber.toString(),
        row.data.address || '',
        row.errors.join('; '),
        JSON.stringify(row.data)
    ]);
    
    const csvContent = [headers, ...errorData]
        .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// Ticket Export Functions
export const generateTicketsCSV = (tickets: TicketExportData[]): string => {
    const rows: string[][] = [];
    
    // Add headers
    rows.push([...TICKET_CSV_HEADERS]);
    
    // Add ticket data
    tickets.forEach(ticket => {
        rows.push([
            ticket.ticketId,
            ticket.title,
            ticket.description,
            ticket.status,
            ticket.kioskAddress,
            ticket.kioskDescription,
            ticket.reporterName,
            ticket.assigneeName,
            ticket.reportedDate,
            ticket.scheduledDate,
            ticket.updatedDate,
            ticket.commentsCount.toString()
        ]);
    });
    
    // Convert to CSV format with proper escaping
    const csvContent = rows
        .map(row => row.map(cell => {
            // Escape quotes and wrap in quotes if cell contains comma, quote, or newline
            const escaped = cell.replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
                ? `"${escaped}"` 
                : escaped;
        }).join(','))
        .join('\n');
    
    return csvContent;
};

export const generateTicketFilename = (options: TicketExportOptions = {}): string => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const workspaceName = options.workspaceName?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'workspace';
    
    let filename = `tickets-${workspaceName}`;
    
    // Add date range if provided
    if (options.dateRange?.from && options.dateRange?.to) {
        const fromDate = new Date(options.dateRange.from).toISOString().slice(0, 10);
        const toDate = new Date(options.dateRange.to).toISOString().slice(0, 10);
        filename += `-${fromDate}-to-${toDate}`;
    } else if (options.dateRange?.from) {
        const fromDate = new Date(options.dateRange.from).toISOString().slice(0, 10);
        filename += `-from-${fromDate}`;
    } else if (options.dateRange?.to) {
        const toDate = new Date(options.dateRange.to).toISOString().slice(0, 10);
        filename += `-until-${toDate}`;
    }
    
    // Add count info if provided
    if (options.filteredCount !== undefined && options.totalCount !== undefined) {
        filename += `-${options.filteredCount}of${options.totalCount}`;
    }
    
    filename += `-${timestamp}.csv`;
    
    return filename;
};

export const downloadTicketsCSV = (tickets: TicketExportData[], options: TicketExportOptions = {}) => {
    const csvContent = generateTicketsCSV(tickets);
    const filename = options.filename || generateTicketFilename(options);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}; 