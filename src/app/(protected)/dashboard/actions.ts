'use server';

import { createWorkspace } from '@/lib/server/workspace-utils';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createWorkspaceAction(formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        // Create the workspace
        const workspace = await createWorkspace({
            name,
            description: description || undefined
        });

        // Revalidate the dashboard page to show the new workspace
        revalidatePath('/dashboard');

        // Return success with workspace data
        return {
            success: true,
            workspace,
            message: 'Workspace created successfully'
        };

    } catch (error) {
        console.error('Error creating workspace:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create workspace'
        };
    }
}

export async function createWorkspaceAndRedirectAction(formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        // Create the workspace
        const workspace = await createWorkspace({
            name,
            description: description || undefined
        });

        // Revalidate the dashboard page
        revalidatePath('/dashboard');

        // Redirect to the new workspace dashboard
        redirect(`/workspace/${workspace.id}/dashboard`);

    } catch (error) {
        console.error('Error creating workspace:', error);
        // On error, redirect back to dashboard with error message
        const errorMessage = error instanceof Error ? error.message : 'Failed to create workspace';
        redirect(`/dashboard?error=${encodeURIComponent(errorMessage)}`);
    }
} 