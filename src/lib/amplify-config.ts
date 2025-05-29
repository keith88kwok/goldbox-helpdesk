import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

// Configure Amplify globally and synchronously
let isConfigured = false;

export function configureAmplify() {
    if (!isConfigured) {
        try {
            Amplify.configure(outputs, {
                ssr: true
            });
            console.log('Amplify configured globally with SSR support');
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