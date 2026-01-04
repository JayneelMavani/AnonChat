/**
 * @fileoverview Authentication middleware for the anonymous chat API.
 *
 * This module provides Elysia middleware that validates user authentication
 * for protected API routes. It uses a cookie-based token system where each
 * user receives a unique token when joining a room.
 *
 * @module api/[[...slugs]]/auth
 *
 * ## Authentication Flow
 * 1. User joins a room and receives a unique token stored in `x-auth-token` cookie
 * 2. Token is added to the room's `connected` array in Redis
 * 3. Subsequent requests validate the token against the room's connected users
 *
 * @see {@link file://./route.ts} - API routes that use this middleware
 * @see {@link file://../../lib/redis.ts} - Redis client for token validation
 */

import { redis } from "@/lib/redis";
import Elysia from "elysia";

/**
 * Custom error class for authentication failures.
 * Triggers a 401 Unauthorized response when thrown.
 */
class AuthError extends Error {
    /**
     * Creates a new AuthError instance.
     * @param {string} message - Error message describing the authentication failure
     */
    constructor(message: string) {
        super(message);
        this.name = "AuthError";
    }
}

/**
 * Elysia authentication middleware for protecting API routes.
 *
 * This middleware:
 * 1. Extracts `roomId` from query parameters and `x-auth-token` from cookies
 * 2. Validates that both values are present
 * 3. Checks if the token is in the room's connected users list in Redis
 * 4. Derives an `auth` object with roomId, token, and connected users for route handlers
 *
 * @example
 * // Using the middleware in a route
 * const protectedRoutes = new Elysia()
 *   .use(authMiddlware)
 *   .get("/protected", ({ auth }) => {
 *     console.log(auth.roomId, auth.token);
 *   });
 *
 * @throws {AuthError} When roomId or token is missing
 * @throws {AuthError} When token is not valid for the specified room
 */
export const authMiddlware = new Elysia({
    name: "auth"
})
    .error({ AuthError })
    /**
     * Error handler that converts AuthError to 401 Unauthorized response.
     */
    .onError(({ code, set }) => {
        if (code === "AuthError") {
            set.status = 401;
            return { error: "Unauthorized" };
        }
    })
    /**
     * Derives authentication context from request.
     * Validates the token and provides auth object to downstream handlers.
     *
     * @param {Object} context - Elysia request context
     * @param {Object} context.query - Query parameters containing roomId
     * @param {Object} context.cookie - Request cookies containing x-auth-token
     * @returns {{ auth: { roomId: string, token: string, connected: string[] } }}
     *          Authentication context with room and user information
     */
    .derive({ as: "scoped" }, async ({ query, cookie }) => {
        const roomId = query.roomId;
        const token = cookie["x-auth-token"].value as string | undefined;

        if (!roomId || !token) throw new AuthError("Missing roomId or token");

        const connected = await redis.hget<string[]>(`meta:${roomId}`, "connected");

        if (!connected?.includes(token)) throw new AuthError("Invalid token for the specified room");

        return { auth: { roomId, token, connected } };
    });