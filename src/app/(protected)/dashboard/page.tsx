import { redirect } from 'next/navigation';
import { getUserWorkspaces } from '@/lib/server/workspace-utils';
import { getGlobalDashboardStats } from '@/lib/server/dashboard-utils';
import { getServerUserOrNull } from '@/lib/server/auth-utils';
import DashboardClient from './dashboard-client';

/**
 * Server component for main dashboard page (landing page)
 * Fetches user workspaces and global stats server-side for better performance
 */
export default async function DashboardPage() {
  // Check authentication
  const user = await getServerUserOrNull();
  
  if (!user) {
    redirect('/auth/login?reason=authentication_required');
  }

  try {
    // Fetch user's workspaces and global stats in parallel
    const [userWorkspaces, globalStats] = await Promise.all([
      getUserWorkspaces(),
      getGlobalDashboardStats(user.id)
    ]);
    
    return (
      <DashboardClient 
        userWorkspaces={userWorkspaces}
        user={user}
        globalStats={globalStats}
      />
    );
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Return error state
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h1>
          <p className="text-gray-600 mb-6">
            {error instanceof Error ? error.message : 'Failed to load dashboard data'}
          </p>
          <a 
            href="/auth/login" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }
} 