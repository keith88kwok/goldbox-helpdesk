'use client';

import { useState } from 'react';
import { testDataOperations, testUserInvitation, runAllTests } from '@/lib/test-utils';
import { AmplifyConfig } from '@/components/amplify-config';

function TestPageContent() {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<string[]>([]);

    const addResult = (message: string) => {
        setResults(prev => [...prev, message]);
    };

    const clearResults = () => {
        setResults([]);
    };

    const runDataTest = async () => {
        setIsLoading(true);
        clearResults();
        addResult('🧪 Starting data operations test...');

        try {
            const success = await testDataOperations();
            addResult(success ? '✅ Data test completed successfully!' : '❌ Data test failed!');
        } catch (error) {
            addResult(`❌ Data test error: ${error}`);
        }

        setIsLoading(false);
    };

    const runInviteTest = async () => {
        setIsLoading(true);
        clearResults();
        addResult('🧪 Starting user invitation test...');

        try {
            const success = await testUserInvitation();
            addResult(success ? '✅ Invitation test completed successfully!' : '❌ Invitation test failed!');
        } catch (error) {
            addResult(`❌ Invitation test error: ${error}`);
        }

        setIsLoading(false);
    };

    const runFullTest = async () => {
        setIsLoading(true);
        clearResults();
        addResult('🚀 Starting complete backend validation...');

        try {
            const success = await runAllTests();
            addResult(success ? '🎉 All tests passed!' : '❌ Some tests failed!');
        } catch (error) {
            addResult(`❌ Test suite error: ${error}`);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Backend Testing Dashboard
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <button
                            onClick={runDataTest}
                            disabled={isLoading}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Test Data Operations
                        </button>

                        <button
                            onClick={runInviteTest}
                            disabled={isLoading}
                            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Test User Invitation
                        </button>

                        <button
                            onClick={runFullTest}
                            disabled={isLoading}
                            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Run All Tests
                        </button>
                    </div>

                    <div className="border-t pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Test Results</h2>
                            <button
                                onClick={clearResults}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Clear Results
                            </button>
                        </div>

                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm min-h-[200px] max-h-[400px] overflow-y-auto">
                            {results.length === 0 ? (
                                <div className="text-gray-500">No tests run yet. Click a button above to start testing.</div>
                            ) : (
                                results.map((result, index) => (
                                    <div key={index} className="mb-1">
                                        {result}
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="text-yellow-400 animate-pulse">
                                    ⏳ Running tests...
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Testing Information</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• <strong>Data Operations</strong>: Tests basic CRUD operations on Workspace model</li>
                            <li>• <strong>User Invitation</strong>: Tests the complete user creation and workspace assignment flow</li>
                            <li>• <strong>All Tests</strong>: Runs comprehensive validation of the entire backend system</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TestPage() {
    return (
        <AmplifyConfig>
            <TestPageContent />
        </AmplifyConfig>
    );
} 