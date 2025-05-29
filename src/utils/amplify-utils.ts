import { cookies } from "next/headers";
import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth/server";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data";
import outputs from "../../amplify_outputs.json";
import type { Schema } from "@/lib/amplify-client";

// Export Schema type for use in other modules
export type { Schema };

export const { runWithAmplifyServerContext } = createServerRunner({
    config: outputs,
});

export const cookiesClient = generateServerClientUsingCookies<Schema>({
    config: outputs,
    cookies,
});

/**
 * Get authenticated user on server-side
 * Returns user info or null if not authenticated
 */
export async function AuthGetCurrentUserServer() {
    try {
        const user = await runWithAmplifyServerContext({
            nextServerContext: { cookies },
            operation: (contextSpec: Parameters<typeof getCurrentUser>[0]) => getCurrentUser(contextSpec),
        });
        return user;
    } catch (error) {
        console.log("User not authenticated on server:", error);
        return null;
    }
}

/**
 * Get auth session on server-side
 * Returns session or null if not authenticated
 */
export async function getServerAuthSession() {
    try {
        const session = await runWithAmplifyServerContext({
            nextServerContext: { cookies },
            operation: (contextSpec: Parameters<typeof fetchAuthSession>[0]) => fetchAuthSession(contextSpec),
        });
        return session;
    } catch (error) {
        console.log("No auth session found:", error);
        return null;
    }
}

/**
 * Check if user is authenticated on server-side
 */
export async function isAuthenticatedServer(): Promise<boolean> {
    try {
        const session = await getServerAuthSession();
        return session?.tokens !== undefined;
    } catch {
        return false;
    }
} 