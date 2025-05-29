import { client } from './amplify-client';
import { inviteUser } from './admin-utils';

/**
 * Test utilities for validating our backend setup
 * Use these functions to test the system after deployment
 */

/**
 * Test basic data operations
 */
export async function testDataOperations() {
    console.log('🧪 Testing basic data operations...');

    try {
        // Test workspace creation
        const workspaceId = `test-workspace-${Date.now()}`;
        const { data: workspace, errors: workspaceErrors } = await client.models.Workspace.create({
            workspaceId: workspaceId,
            name: 'Test Workspace',
            description: 'A test workspace for validation',
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        if (workspaceErrors || !workspace) {
            console.error('❌ Workspace creation failed:', workspaceErrors);
            return false;
        }

        console.log('✅ Workspace created:', workspace.name);

        // Test workspace listing
        const { data: workspaces, errors: listErrors } = await client.models.Workspace.list();

        if (listErrors) {
            console.error('❌ Workspace listing failed:', listErrors);
            return false;
        }

        console.log('✅ Workspace listing successful, found:', workspaces?.length, 'workspaces');

        // Clean up test workspace
        if (workspace?.id) {
            await client.models.Workspace.delete({ id: workspace.id });
            console.log('✅ Test workspace cleaned up');
        }

        return true;
    } catch (error) {
        console.error('❌ Data operations test failed:', error);
        return false;
    }
}

/**
 * Test user invitation flow (requires deployed function)
 */
export async function testUserInvitation() {
    console.log('🧪 Testing user invitation flow...');

    try {
        // First create a test workspace
        const workspaceId = `test-invitation-workspace-${Date.now()}`;
        const { data: workspace, errors: workspaceErrors } = await client.models.Workspace.create({
            workspaceId: workspaceId,
            name: 'Test Invitation Workspace',
            description: 'Testing user invitation',
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        if (workspaceErrors || !workspace) {
            console.error('❌ Test workspace creation failed:', workspaceErrors);
            return false;
        }

        // Test user invitation
        const inviteResult = await inviteUser({
            email: 'test@example.com',
            username: 'testuser',
            givenName: 'Test',
            familyName: 'User',
            workspaceId: workspace.id!,
            role: 'MEMBER',
            sendInviteEmail: false,
        });

        if (!inviteResult.success) {
            console.error('❌ User invitation failed:', inviteResult.error);
            return false;
        }

        console.log('✅ User invitation successful:', inviteResult.message);

        // Verify user was created in database
        const { data: users, errors: userErrors } = await client.models.User.list({
            filter: { username: { eq: 'testuser' } }
        });

        if (userErrors) {
            console.error('❌ User verification failed:', userErrors);
            return false;
        }

        if (!users || users.length === 0) {
            console.error('❌ User not found in database');
            return false;
        }

        console.log('✅ User found in database:', users[0].name);

        // Clean up
        if (workspace?.id) {
            await client.models.Workspace.delete({ id: workspace.id });
        }
        if (users[0]?.id) {
            await client.models.User.delete({ id: users[0].id });
        }

        console.log('✅ Test cleanup completed');
        return true;
    } catch (error) {
        console.error('❌ User invitation test failed:', error);
        return false;
    }
}

/**
 * Run all tests
 */
export async function runAllTests() {
    console.log('🚀 Starting backend validation tests...\n');

    const dataTest = await testDataOperations();
    console.log('');

    const inviteTest = await testUserInvitation();
    console.log('');

    if (dataTest && inviteTest) {
        console.log('🎉 All tests passed! Backend is working correctly.');
    } else {
        console.log('❌ Some tests failed. Check the errors above.');
    }

    return dataTest && inviteTest;
} 