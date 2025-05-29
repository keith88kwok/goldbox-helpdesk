import { redirect } from 'next/navigation';
import { getUserWorkspaces } from '@/lib/server/workspace-utils';
import { getServerUserOrNull } from '@/lib/server/auth-utils';
import WorkspacesClient from './workspaces-client';

/**
 * Server component for workspaces page
 * Fetches user workspaces server-side for better performance
 */
export default async function WorkspacesPage() {
  // Check authentication
  const user = await getServerUserOrNull();
  
  if (!user) {
    redirect('/auth/login?reason=authentication_required');
  }

  try {
    // Fetch user's workspaces server-side
    const userWorkspaces = await getUserWorkspaces();
    
    return (
      <WorkspacesClient 
        userWorkspaces={userWorkspaces}
        user={user}
      />
    );
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    
    // Return error state
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Workspaces</h1>
          <p className="text-gray-600 mb-6">
            {error instanceof Error ? error.message : 'Failed to load workspace data'}
          </p>
        </div>
      </div>
    );
  }
} 