import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource for the Kiosk Maintenance Helpdesk
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
    loginWith: {
        email: true,
    },
    userAttributes: {
        email: {
            mutable: true,
            required: true,
        },
        preferredUsername: {
            mutable: true,
            required: true,
        },
        givenName: {
            mutable: true,
            required: true,
        },
        familyName: {
            mutable: true,
            required: true,
        },
    },
});
