import { NextRequest, NextResponse } from "next/server";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplify-utils";

export async function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Only check authentication for workspace routes to reduce conflicts
    // Let client-side AuthContext handle other authentication logic
    const authenticated = await runWithAmplifyServerContext({
        nextServerContext: { request, response },
        operation: async (contextSpec) => {
            try {
                const session = await fetchAuthSession(contextSpec, {});
                return session.tokens !== undefined;
            } catch (error) {
                console.log("Middleware auth check failed:", error);
                return false;
            }
        },
    });

    if (authenticated) {
        return response;
    }

    // Only redirect if accessing workspace routes
    // Let client-side handle other auth redirects to prevent SSR conflicts
    if (request.nextUrl.pathname.startsWith('/workspace')) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Only protect workspace routes to reduce SSR authentication conflicts
         * Let client-side AuthContext handle other routes for better UX
         */
        "/workspace/:path*",
    ],
}; 