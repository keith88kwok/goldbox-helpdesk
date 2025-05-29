import { redirect } from 'next/navigation';
import { getWorkspaceAccess } from '@/lib/server/workspace-utils';
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
    
    // Validate workspace access server-side
    const { workspace, userRole } = await getWorkspaceAccess(id);
    
    return (
      <DashboardClient 
        workspace={workspace}
        userRole={userRole}
      />
    );
  } catch (error) {
    console.error('Dashboard access error:', error);
    
    // Redirect to workspaces with error message
    const errorMessage = error instanceof Error ? error.message : 'Access denied';
    redirect(`/workspaces?error=${encodeURIComponent(errorMessage)}`);
  }
} 