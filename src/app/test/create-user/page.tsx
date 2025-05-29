'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { client } from '@/lib/amplify-client';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/lib/amplify-client';

export default function CreateUserPage() {
    const [formData, setFormData] = useState({
        email: 'test@example.com',
        username: 'test@example.com',
        preferredUsername: 'testuser',
        givenName: 'Test',
        familyName: 'User',
        workspaceName: 'Test Workspace',
        role: 'ADMIN' as 'ADMIN' | 'MEMBER' | 'VIEWER',
        temporaryPassword: 'TempPass123!',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string>('');

    // Create a client with API key for testing
    const apiKeyClient = generateClient<Schema>({
        authMode: 'apiKey'
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            
            // Auto-sync username with email since Cognito requires username to be email
            if (name === 'email') {
                newData.username = value;
            }
            
            return newData;
        });
    };

    const createTestUser = async () => {
        setIsLoading(true);
        setResult('');

        try {
            // Create a workspace first using API key
            const workspaceId = `workspace-${Date.now()}`;
            const { data: workspace, errors: workspaceErrors } = await apiKeyClient.models.Workspace.create({
                workspaceId: workspaceId,
                name: formData.workspaceName,
                description: 'Test workspace for user creation',
                createdBy: 'system',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            if (workspaceErrors || !workspace) {
                throw new Error(`Failed to create workspace: ${workspaceErrors?.[0]?.message || 'Unknown error'}`);
            }

            // Use the new GraphQL query to invite the user
            console.log('Calling inviteUser with:', {
                email: formData.email,
                username: formData.username,
                preferredUsername: formData.preferredUsername,
                givenName: formData.givenName,
                familyName: formData.familyName,
                workspaceId: workspace.id!,
                role: formData.role,
                temporaryPassword: formData.temporaryPassword,
                sendInviteEmail: false,
            });

            const { data: inviteResult, errors: inviteErrors } = await apiKeyClient.queries.inviteUser({
                email: formData.email,
                username: formData.username,
                preferredUsername: formData.preferredUsername,
                givenName: formData.givenName,
                familyName: formData.familyName,
                workspaceId: workspace.id!,
                role: formData.role,
                temporaryPassword: formData.temporaryPassword,
                sendInviteEmail: false,
            });

            console.log('InviteUser response:', { inviteResult, inviteErrors });

            if (inviteErrors && inviteErrors.length > 0) {
                throw new Error(`Failed to invite user: ${inviteErrors.map(e => e.message).join(', ')}`);
            }

            if (!inviteResult) {
                throw new Error('No response from invite user function');
            }

            const result = JSON.parse(inviteResult as string);
            console.log('Parsed result:', result);
            
            if (result.success) {
                setResult(`✅ User created successfully!

                Login Details:
                - Username: ${formData.username}
                - Password: ${formData.temporaryPassword}
                - Workspace: ${formData.workspaceName}
                - Role: ${formData.role}
                - User ID: ${result.userId}

                ✨ This user can now login at /auth/login`);
            } else {
                setResult(`❌ Failed to create user: ${result.error || result.message || 'Unknown error'}`);
            }

        } catch (error: any) {

            setResult(`❌ Error: ${error.message}`);
            console.error('Create user error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Create Test User
                    </h1>
                    
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="text-sm font-medium text-green-800 mb-2">Ready for Testing!</h3>
                        <p className="text-sm text-green-700">
                            This creates a complete user with Cognito authentication and database records.
                            The user will be able to login immediately.
                        </p>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                        <FormField
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={isLoading}
                        />
                        
                        <FormField
                            label="Login Username (Auto-synced with Email)"
                            name="username"
                            type="email"
                            value={formData.username}
                            onChange={handleInputChange}
                            disabled={true}
                            hint="This is used for login and must be an email address"
                        />
                        
                        <FormField
                            label="Preferred Username (Display Name)"
                            name="preferredUsername"
                            type="text"
                            value={formData.preferredUsername}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            hint="This is the user-friendly display name (e.g., 'testuser')"
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="First Name"
                                name="givenName"
                                type="text"
                                value={formData.givenName}
                                onChange={handleInputChange}
                                disabled={isLoading}
                            />
                            
                            <FormField
                                label="Last Name"
                                name="familyName"
                                type="text"
                                value={formData.familyName}
                                onChange={handleInputChange}
                                disabled={isLoading}
                            />
                        </div>
                        
                        <FormField
                            label="Workspace Name"
                            name="workspaceName"
                            type="text"
                            value={formData.workspaceName}
                            onChange={handleInputChange}
                            disabled={isLoading}
                        />
                        
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="MEMBER">Member</option>
                                <option value="VIEWER">Viewer</option>
                            </select>
                        </div>

                        <FormField
                            label="Temporary Password"
                            name="temporaryPassword"
                            type="text"
                            value={formData.temporaryPassword}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            hint="Password must contain uppercase, lowercase, number, and special character"
                        />
                    </div>

                    <Button
                        onClick={createTestUser}
                        isLoading={isLoading}
                        disabled={isLoading}
                        className="w-full mb-6"
                    >
                        {isLoading ? 'Creating User...' : 'Create User & Workspace'}
                    </Button>

                    {result && (
                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-line">
                            {result}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 