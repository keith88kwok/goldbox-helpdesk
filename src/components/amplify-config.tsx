'use client';

import { Amplify } from 'aws-amplify';
import { useEffect, useState } from 'react';
import outputs from '../../amplify_outputs.json';

export function AmplifyConfig({ children }: { children: React.ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    try {
      Amplify.configure(outputs);
      console.log('Amplify configured successfully');
      setIsConfigured(true);
    } catch (error) {
      console.error('Failed to configure Amplify:', error);
    }
  }, []);

  // Don't render children until Amplify is configured
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 