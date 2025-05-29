import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { inviteUser } from './functions/invite-user/resource';

/**
 * Kiosk Maintenance Helpdesk Backend Configuration
 * 
 * Includes:
 * - Authentication (Cognito)
 * - Data (DynamoDB + GraphQL)
 * - Storage (S3 for attachments)
 * - Functions (Admin user invitation accessible via GraphQL query)
 * 
 * @see https://docs.amplify.aws/react/build-a-backend/
 */
const backend = defineBackend({
    auth,
    data,
    storage,
    inviteUser,
});

// Add environment variables to the invite function
backend.inviteUser.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);
backend.inviteUser.addEnvironment('AMPLIFY_BRANCH', backend.auth.resources.userPool.node.tryGetContext('amplifyBranch') || 'main');
backend.inviteUser.addEnvironment('AMPLIFY_APP_ID', backend.auth.resources.userPool.node.tryGetContext('amplifyAppId') || 'local');
backend.inviteUser.addEnvironment('USER_TABLE_NAME', backend.data.resources.tables['User'].tableName);
backend.inviteUser.addEnvironment('WORKSPACE_USER_TABLE_NAME', backend.data.resources.tables['WorkspaceUser'].tableName);

// Grant the invite function admin permissions to Cognito
backend.inviteUser.resources.lambda.addToRolePolicy(
    new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            'cognito-idp:AdminCreateUser',
            'cognito-idp:AdminSetUserPassword',
            'cognito-idp:AdminGetUser',
            'cognito-idp:AdminUpdateUserAttributes',
        ],
        resources: [backend.auth.resources.userPool.userPoolArn],
    })
);

// Grant the invite function permissions to DynamoDB tables
backend.inviteUser.resources.lambda.addToRolePolicy(
    new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            'dynamodb:PutItem',
            'dynamodb:GetItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
            'dynamodb:Query',
            'dynamodb:Scan',
        ],
        resources: [
            // Wildcard for all DynamoDB tables created by Amplify
            `arn:aws:dynamodb:${process.env.CDK_DEFAULT_REGION || 'ap-east-1'}:${process.env.CDK_DEFAULT_ACCOUNT}:table/*`,
        ],
    })
);
