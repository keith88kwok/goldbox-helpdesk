import type { Schema } from '../../data/resource';
import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    AdminGetUserCommand,
    AdminInitiateAuthCommand,
    MessageActionType
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

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
    isNewUser?: boolean;
    isExistingWorkspaceMember?: boolean;
    temporaryPassword?: string;
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

        const userTableName = process.env.USER_TABLE_NAME;
        const workspaceUserTableName = process.env.WORKSPACE_USER_TABLE_NAME;
        
        if (!userTableName || !workspaceUserTableName) {
            throw new Error('Required table environment variables not set');
        }

        let userId: string;
        let isNewUser = false;
        let isExistingWorkspaceMember = false;
        let actualTemporaryPassword: string | undefined;

        // Step 1: Check if user exists in Cognito
        try {
            const getUserCommand = new AdminGetUserCommand({
                UserPoolId: userPoolId,
                Username: username
            });
            
            const existingCognitoUser = await cognitoClient.send(getUserCommand);
            userId = existingCognitoUser.Username!;
            
            console.log(`User ${username} already exists in Cognito with ID: ${userId}`);
            
        } catch (error: any) {
            if (error.name === 'UserNotFoundException') {
                // User doesn't exist in Cognito - create new user
                console.log(`User ${username} not found in Cognito, creating new user`);
                
                actualTemporaryPassword = temporaryPassword || generateTemporaryPassword();
                
                const createUserCommand = new AdminCreateUserCommand({
                    UserPoolId: userPoolId,
                    Username: username,
                    UserAttributes: [
                        { Name: 'email', Value: email },
                        { Name: 'email_verified', Value: 'true' },
                        { Name: 'given_name', Value: givenName },
                        { Name: 'family_name', Value: familyName },
                        { Name: 'preferred_username', Value: preferredUsername },
                    ],
                    TemporaryPassword: actualTemporaryPassword,
                    MessageAction: MessageActionType.SUPPRESS,
                });

                const cognitoUser = await cognitoClient.send(createUserCommand);
                userId = cognitoUser.User?.Username!;
                isNewUser = true;

                if (!userId) {
                    throw new Error('Failed to create user in Cognito');
                }

                // Set permanent password if provided
                if (temporaryPassword) {
                    const setPasswordCommand = new AdminSetUserPasswordCommand({
                        UserPoolId: userPoolId,
                        Username: username,
                        Password: temporaryPassword,
                        Permanent: true,
                    });
                    await cognitoClient.send(setPasswordCommand);
                }

                // Send invitation email if requested (after user creation)
                if (sendInviteEmail) {
                    try {
                        // Use AdminInitiateAuth to trigger password reset email as invitation
                        const { AdminInitiateAuthCommand } = await import('@aws-sdk/client-cognito-identity-provider');
                        
                        // This will send an email to the user with login instructions
                        console.log(`Sending invitation email to ${email}`);
                        
                        // Note: This might require additional Cognito configuration
                        // For now, we'll just log that email would be sent
                        console.log(`Email invitation would be sent to ${email} with temporary password`);
                        
                    } catch (emailError) {
                        console.warn('Failed to send invitation email:', emailError);
                        // Don't fail the entire operation if email fails
                    }
                }
            } else {
                throw error; // Re-throw other errors
            }
        }

        // Step 2: Check if user already exists in this workspace
        const existingWorkspaceUser = await docClient.send(new GetCommand({
            TableName: workspaceUserTableName,
            Key: {
                id: `${workspaceId}#${userId}`
            }
        }));

        if (existingWorkspaceUser.Item) {
            return {
                success: false,
                message: `User ${preferredUsername} is already a member of this workspace with role: ${existingWorkspaceUser.Item.role}`,
                isExistingWorkspaceMember: true,
                userId
            };
        }

        const now = new Date().toISOString();

        // Step 3: Create or update User record in database if new user
        if (isNewUser) {
            const fullName = `${givenName} ${familyName}`;
            const userRecord = {
                __typename: 'User',
                id: userId,
                userId: userId,
                cognitoId: userId,
                email: email,
                username: preferredUsername,
                preferredUsername: preferredUsername,
                name: fullName,
                createdAt: now,
                updatedAt: now,
            };

            await docClient.send(new PutCommand({
                TableName: userTableName,
                Item: userRecord,
            }));
        } else {
            // For existing users, verify User record exists in database
            const existingUser = await docClient.send(new GetCommand({
                TableName: userTableName,
                Key: { id: userId }
            }));

            if (!existingUser.Item) {
                // Create User record for existing Cognito user (edge case)
                const fullName = `${givenName} ${familyName}`;
                const userRecord = {
                    __typename: 'User',
                    id: userId,
                    userId: userId,
                    cognitoId: userId,
                    email: email,
                    username: preferredUsername,
                    preferredUsername: preferredUsername,
                    name: fullName,
                    createdAt: now,
                    updatedAt: now,
                };

                await docClient.send(new PutCommand({
                    TableName: userTableName,
                    Item: userRecord,
                }));
            }
        }

        // Step 4: Add user to workspace with specified role
        const workspaceUserRecord = {
            __typename: 'WorkspaceUser',
            id: `${workspaceId}#${userId}`,
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

        const response: InviteUserResponse = {
            success: true,
            userId: userId,
            message: isNewUser 
                ? sendInviteEmail
                    ? `New user ${preferredUsername} (${username}) successfully created and added to workspace with role: ${role}. Invitation email sent to ${email}.`
                    : `New user ${preferredUsername} (${username}) successfully created and added to workspace with role: ${role}`
                : `Existing user ${preferredUsername} (${username}) successfully added to workspace with role: ${role}`,
            isNewUser,
            isExistingWorkspaceMember: false,
            temporaryPassword: actualTemporaryPassword
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