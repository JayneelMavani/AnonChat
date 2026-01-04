import { treaty } from "@elysiajs/eden";
import type { App } from "../app/api/[[...slugs]]/route";

/**
 * API client using Elysia Eden treaty.
 * Uses the current origin in browser, or localhost in server-side contexts.
 */
const getBaseUrl = () => {
    if (typeof window !== "undefined") {
        // Browser: use current origin (works for both dev and production)
        return window.location.origin;
    }
    // Server-side: use environment variable or fallback to localhost
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

export const client = treaty<App>(getBaseUrl()).api;