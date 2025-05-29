import { redirect } from 'next/navigation';
import { getWorkspaceAccess } from '@/lib/server/workspace-utils';
import { getWorkspaceStats } from '@/lib/server/dashboard-utils';
import DashboardClient from './dashboard-client';

interface PageProps {
    params: Promise<{ id: string }>;
}

/**
 * Server component for workspace dashboard
 * Validates workspace access and fetches data server-side
 */
export default async function DashboardPage({ params }: PageProps) {
    try {
        // Await params before accessing properties
        const { id } = await params;

        // Validate workspace access server-side and fetch stats in parallel
        const [{ workspace, userRole }, stats] = await Promise.all([
            getWorkspaceAccess(id),
            getWorkspaceStats(id)
        ]);

        return (
            <DashboardClient
                workspace={workspace}
                userRole={userRole}
                stats={stats}
            />
        );
    } catch (error) {
        console.error('Dashboard access error:', error);

        // Redirect to workspaces with error message
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        redirect(`/workspaces?error=${encodeURIComponent(errorMessage)}`);
    }
} 