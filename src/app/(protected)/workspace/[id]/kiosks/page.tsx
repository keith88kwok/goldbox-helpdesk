import { redirect } from 'next/navigation';
import { getWorkspaceKiosks } from '@/lib/server/kiosk-utils';
import KiosksClient from './kiosks-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server component for kiosks page
 * Fetches kiosks data server-side for better performance
 */
export default async function KiosksPage({ params }: PageProps) {
  try {
    // Await params before accessing properties
    const { id } = await params;
    
    // Fetch kiosks data server-side with access validation
    const { kiosks, workspace, userRole } = await getWorkspaceKiosks(id);
    
    return (
      <KiosksClient 
        kiosks={kiosks}
        workspace={workspace}
        userRole={userRole}
      />
    );
  } catch (error) {
    console.error('Kiosks access error:', error);
    
    // Redirect to workspaces with error message
    const errorMessage = error instanceof Error ? error.message : 'Access denied';
    redirect(`/workspaces?error=${encodeURIComponent(errorMessage)}`);
  }
} 