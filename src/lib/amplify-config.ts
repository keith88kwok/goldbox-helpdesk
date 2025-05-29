import { Amplify } from 'aws-amplify';
import { CookieStorage } from 'aws-amplify/utils';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import outputs from '../../amplify_outputs.json';

// Configure Amplify globally and synchronously
let isConfigured = false;

export function configureAmplify() {
    if (!isConfigured) {
        try {
            // Configure Amplify with SSR support
            Amplify.configure(outputs, {
                ssr: true
            });

            // Set up Safari-compatible cookie storage
            if (typeof window !== 'undefined') {
                // Enhanced Safari compatibility with cookie storage
                const cookieStorage = new CookieStorage({
                    domain: window.location.hostname.includes('localhost') 
                        ? undefined  // Don't set domain for localhost
                        : window.location.hostname,
                    secure: window.location.protocol === 'https:',
                    sameSite: 'lax', // More compatible with Safari than 'strict'
                    path: '/'
                });

                // Set cookie storage for tokens with fallback
                try {
                    cognitoUserPoolsTokenProvider.setKeyValueStorage(cookieStorage);
                    console.log('✅ Cookie storage configured for Safari compatibility');
                } catch (error) {
                    console.warn('Cookie storage failed, using default storage:', error);
                    // Amplify will fall back to default localStorage
                }
            }

            console.log('Amplify configured globally with SSR and Safari compatibility support');
            isConfigured = true;
        } catch (error) {
            console.error('Failed to configure Amplify:', error);
            throw error;
        }
    }
    return isConfigured;
}

// Configure immediately when this module is imported
configureAmplify(); 