import { defineFunction } from '@aws-amplify/backend';

/**
 * Admin User Invitation Function
 * 
 * Handles the complete user invitation workflow:
 * 1. Creates user in Cognito with admin privileges
 * 2. Creates corresponding User record in DynamoDB
 * 3. Adds user to specified workspace with role
 * 4. Sends invitation email (optional)
 * 
 * Note: Assigned to data stack to avoid circular dependency
 */
export const inviteUser = defineFunction({
    name: 'inviteUser',
    entry: './handler.ts',
    timeoutSeconds: 30,
    resourceGroupName: 'data', // Assign to data stack to resolve circular dependency
}); 