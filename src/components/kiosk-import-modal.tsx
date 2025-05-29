'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Upload, 
    Download, 
    FileText, 
    CheckCircle, 
    ArrowRight,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import { 
    downloadCSVTemplate, 
    parseKioskCSV, 
    getTemplateInstructions,
    exportErrorsToCSV,
    type CSVParseResult
} from '@/lib/csv-utils';
import { client } from '@/lib/amplify-client';

interface KioskImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    onImportComplete: () => void;
}

type ImportStep = 'template' | 'upload' | 'review' | 'importing' | 'results';

interface ImportResults {
    successful: number;
    failed: number;
    errors: { row: number; error: string }[];
}

export function KioskImportModal({ isOpen, onClose, workspaceId, onImportComplete }: KioskImportModalProps) {
    const [currentStep, setCurrentStep] = useState<ImportStep>('template');
    const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
    const [importResults, setImportResults] = useState<ImportResults | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClose = () => {
        setCurrentStep('template');
        setParseResult(null);
        setImportResults(null);
        setIsProcessing(false);
        onClose();
    };

    const handleDownloadTemplate = () => {
        downloadCSVTemplate({
            filename: 'kiosk-import-template.csv'
        });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert('Please upload a CSV file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setIsProcessing(true);

        try {
            const text = await file.text();
            const result = parseKioskCSV(text);
            setParseResult(result);
            setCurrentStep('review');
        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Error reading CSV file. Please check the file format.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async () => {
        if (!parseResult?.validRows.length) return;

        setCurrentStep('importing');
        setIsProcessing(true);

        const results: ImportResults = {
            successful: 0,
            failed: 0,
            errors: []
        };

        for (const row of parseResult.validRows) {
            try {
                await client.models.Kiosk.create({
                    kioskId: `kiosk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    workspaceId: workspaceId,
                    address: row.data.address,
                    locationDescription: row.data.locationDescription || null,
                    description: row.data.description || null,
                    remark: row.data.remark || null,
                    status: row.data.status,
                    locationAttachments: []
                });
                results.successful++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: row.rowNumber,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        setImportResults(results);
        setCurrentStep('results');
        setIsProcessing(false);
        
        // Notify parent component to refresh data
        onImportComplete();
    };

    const handleExportErrors = () => {
        if (!parseResult?.invalidRows.length) return;
        exportErrorsToCSV(parseResult.invalidRows);
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 'template': return 'Download Template';
            case 'upload': return 'Upload CSV File';
            case 'review': return 'Review Import Data';
            case 'importing': return 'Importing Kiosks';
            case 'results': return 'Import Complete';
            default: return 'Import Kiosks';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Upload className="h-5 w-5 mr-2" />
                        {getStepTitle()}
                    </DialogTitle>
                    <DialogDescription>
                        Import multiple kiosks from a CSV file
                    </DialogDescription>
                </DialogHeader>

                {/* Step 1: Template */}
                {currentStep === 'template' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="h-5 w-5 mr-2" />
                                    Step 1: Download CSV Template
                                </CardTitle>
                                <CardDescription>
                                    Download the template file and fill in your kiosk data
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
                                        <ul className="space-y-1 text-sm text-blue-800">
                                            {getTemplateInstructions().map((instruction, index) => (
                                                <li key={index}>• {instruction}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    
                                    <Button onClick={handleDownloadTemplate} className="w-full">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download CSV Template
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button onClick={() => setCurrentStep('upload')}>
                                Next: Upload File
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Upload */}
                {currentStep === 'upload' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Upload className="h-5 w-5 mr-2" />
                                    Step 2: Upload Your CSV File
                                </CardTitle>
                                <CardDescription>
                                    Select the CSV file you filled out with your kiosk data
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div 
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-lg font-medium text-gray-900 mb-2">
                                        Click to upload CSV file
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        or drag and drop your file here
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Maximum file size: 5MB
                                    </p>
                                </div>
                                
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />

                                {isProcessing && (
                                    <div className="flex items-center justify-center mt-4 text-blue-600">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Processing file...
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setCurrentStep('template')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review */}
                {currentStep === 'review' && parseResult && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Step 3: Review Import Data
                                </CardTitle>
                                <CardDescription>
                                    Review the parsed data and fix any errors before importing
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {parseResult.totalRows - 1}
                                        </div>
                                        <div className="text-sm text-blue-800">Total Rows</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {parseResult.validRows.length}
                                        </div>
                                        <div className="text-sm text-green-800">Valid Rows</div>
                                    </div>
                                    <div className="text-center p-4 bg-red-50 rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">
                                            {parseResult.invalidRows.length}
                                        </div>
                                        <div className="text-sm text-red-800">Invalid Rows</div>
                                    </div>
                                </div>

                                {parseResult.invalidRows.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-red-900">Errors Found:</h4>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={handleExportErrors}
                                            >
                                                <Download className="h-3 w-3 mr-2" />
                                                Export Errors
                                            </Button>
                                        </div>
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                                            {parseResult.invalidRows.slice(0, 10).map((row, index) => (
                                                <div key={index} className="text-sm mb-2">
                                                    <span className="font-medium text-red-800">Row {row.rowNumber}:</span>
                                                    <span className="text-red-700 ml-2">
                                                        {row.errors.join(', ')}
                                                    </span>
                                                </div>
                                            ))}
                                            {parseResult.invalidRows.length > 10 && (
                                                <div className="text-sm text-red-600 italic">
                                                    ... and {parseResult.invalidRows.length - 10} more errors
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {parseResult.validRows.length > 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 className="font-medium text-green-900 mb-2">
                                            Ready to Import ({parseResult.validRows.length} kiosks):
                                        </h4>
                                        <div className="max-h-32 overflow-y-auto">
                                            {parseResult.validRows.slice(0, 5).map((row, index) => (
                                                <div key={index} className="text-sm text-green-800 mb-1">
                                                    • {row.data.address} ({row.data.status})
                                                </div>
                                            ))}
                                            {parseResult.validRows.length > 5 && (
                                                <div className="text-sm text-green-700 italic">
                                                    ... and {parseResult.validRows.length - 5} more kiosks
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <Button 
                                onClick={handleImport} 
                                disabled={parseResult.validRows.length === 0}
                            >
                                Import {parseResult.validRows.length} Kiosks
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Importing */}
                {currentStep === 'importing' && (
                    <div className="space-y-6">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Importing Kiosks...
                                    </h3>
                                    <p className="text-gray-600">
                                        Please wait while we create your kiosks.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 5: Results */}
                {currentStep === 'results' && importResults && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                                    Import Complete
                                </CardTitle>
                                <CardDescription>
                                    Your kiosk import has finished processing
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-3xl font-bold text-green-600">
                                            {importResults.successful}
                                        </div>
                                        <div className="text-sm text-green-800">Successfully Imported</div>
                                    </div>
                                    <div className="text-center p-4 bg-red-50 rounded-lg">
                                        <div className="text-3xl font-bold text-red-600">
                                            {importResults.failed}
                                        </div>
                                        <div className="text-sm text-red-800">Failed</div>
                                    </div>
                                </div>

                                {importResults.errors.length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h4 className="font-medium text-red-900 mb-2">Import Errors:</h4>
                                        <div className="max-h-32 overflow-y-auto">
                                            {importResults.errors.map((error, index) => (
                                                <div key={index} className="text-sm text-red-800 mb-1">
                                                    Row {error.row}: {error.error}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {importResults.successful > 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-green-800">
                                            ✅ {importResults.successful} kiosks have been successfully added to your workspace!
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button onClick={handleClose}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
} 