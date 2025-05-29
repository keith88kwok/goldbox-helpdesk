import type { Schema } from '../../data/resource';
import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    MessageActionType
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Initialize AWS clients
const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION || 'ap-east-1',
});

const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-east-1',
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface InviteUserResponse {
    success: boolean;
    userId?: string;
    message: string;
    error?: string;
}

export const handler: Schema["inviteUser"]["functionHandler"] = async (event) => {
    try {
        // Get arguments from the event
        const { 
            email, 
            username, 
            preferredUsername,
            givenName, 
            familyName, 
            workspaceId, 
            role, 
            temporaryPassword, 
            sendInviteEmail 
        } = event.arguments;

        // Validate required fields
        if (!email || !username || !preferredUsername || !givenName || !familyName || !workspaceId || !role) {
            return {
                success: false,
                message: 'Missing required fields',
            };
        }

        const userPoolId = process.env.USER_POOL_ID;
        if (!userPoolId) {
            throw new Error('USER_POOL_ID environment variable not set');
        }

        // Step 1: Create user in Cognito
        const createUserCommand = new AdminCreateUserCommand({
            UserPoolId: userPoolId,
            Username: username, // This is the email for login
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'email_verified', Value: 'true' },
                { Name: 'given_name', Value: givenName },
                { Name: 'family_name', Value: familyName },
                { Name: 'preferred_username', Value: preferredUsername }, // This is the display name
            ],
            TemporaryPassword: temporaryPassword || generateTemporaryPassword(),
            MessageAction: sendInviteEmail ? MessageActionType.RESEND : MessageActionType.SUPPRESS,
        });

        const cognitoUser = await cognitoClient.send(createUserCommand);
        const userId = cognitoUser.User?.Username;

        if (!userId) {
            throw new Error('Failed to create user in Cognito');
        }

        // Step 2: Create User record in DynamoDB directly
        const userTableName = process.env.USER_TABLE_NAME;
        if (!userTableName) {
            throw new Error('USER_TABLE_NAME environment variable not set');
        }
        
        const fullName = `${givenName} ${familyName}`;
        const now = new Date().toISOString();

        const userRecord = {
            __typename: 'User',
            id: userId,
            userId: userId,
            cognitoId: userId,
            email: email,
            username: preferredUsername, // Store the preferred username in our database
            name: fullName,
            createdAt: now,
            updatedAt: now,
        };

        await docClient.send(new PutCommand({
            TableName: userTableName,
            Item: userRecord,
        }));

        // Step 3: Add user to workspace with specified role
        const workspaceUserTableName = process.env.WORKSPACE_USER_TABLE_NAME;
        if (!workspaceUserTableName) {
            throw new Error('WORKSPACE_USER_TABLE_NAME environment variable not set');
        }
        
        const workspaceUserRecord = {
            __typename: 'WorkspaceUser',
            id: `${workspaceId}#${userId}`, // Composite key
            workspaceId: workspaceId,
            userId: userId,
            role: role,
            joinedAt: now,
            createdAt: now,
            updatedAt: now,
        };

        await docClient.send(new PutCommand({
            TableName: workspaceUserTableName,
            Item: workspaceUserRecord,
        }));

        // Step 4: Set permanent password if provided
        if (temporaryPassword) {
            const setPasswordCommand = new AdminSetUserPasswordCommand({
                UserPoolId: userPoolId,
                Username: username, // Use email for login
                Password: temporaryPassword,
                Permanent: false, // User will need to change on first login
            });

            await cognitoClient.send(setPasswordCommand);
        }

        const response: InviteUserResponse = {
            success: true,
            userId: userId,
            message: `User ${preferredUsername} (${username}) successfully invited and added to workspace`,
        };

        return response;

    } catch (error) {
        console.error('Error inviting user:', error);

        const response: InviteUserResponse = {
            success: false,
            message: 'Failed to invite user',
            error: error instanceof Error ? error.message : error as string,
        };

        return response;
    }
};

/**
 * Generate a temporary password for new users
 */
function generateTemporaryPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each required character type
    password += 'A'; // uppercase
    password += 'a'; // lowercase  
    password += '1'; // number
    password += '!'; // special char

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
} 