/**
 * API Client Configuration
 * 
 * Type-safe API client using Elysia Eden treaty pattern.
 * Automatically resolves the correct base URL for both
 * development (localhost) and production (Vercel) environments.
 * 
 * @see src/app/api/[[...slugs]]/route.ts - API routes definition
 */
import { treaty } from "@elysiajs/eden";
import type { App } from "../app/api/[[...slugs]]/route";

/**
 * Determines the base URL for API requests.
 * 
 * - Browser: Uses `window.location.origin` for automatic compatibility
 *   with any deployment domain (localhost, Vercel, custom domain)
 * - Server-side: Uses `NEXT_PUBLIC_APP_URL` env var or falls back to localhost
 * 
 * @returns The base URL string for API requests
 */
const getBaseUrl = () => {
    if (typeof window !== "undefined") return window.location.origin;

    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

export const client = treaty<App>(getBaseUrl()).api;