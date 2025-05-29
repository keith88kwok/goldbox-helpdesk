import { redirect } from 'next/navigation';
import { getWorkspaceTeamDetails } from '@/lib/server/team-utils';
import { getServerUser } from '@/lib/server/auth-utils';
import TeamClient from './team-client';

interface PageProps {
    params: Promise<{ id: string }>;
}

/**
 * Server component for team management page
 * Validates workspace access and fetches team data server-side
 */
export default async function TeamPage({ params }: PageProps) {
    try {
        // Await params before accessing properties
        const { id } = await params;

        // Get current user for permission checks
        const currentUser = await getServerUser();

        // Fetch team data with access validation
        const teamData = await getWorkspaceTeamDetails(id);

        return (
            <TeamClient
                {...teamData}
                workspaceId={id}
                currentUserId={currentUser.id}
            />
        );
    } catch (error) {
        console.error('Team page access error:', error);

        // Await params to get the id for redirect
        const { id } = await params;

        // Redirect to dashboard with error message
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        redirect(`/workspace/${id}/dashboard?error=${encodeURIComponent(errorMessage)}`);
    }
} 