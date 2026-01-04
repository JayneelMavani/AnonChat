/**
 * Room Access Proxy Middleware
 * 
 * @see {@link src/app/api/[[...slugs]]/auth.ts} - Reads the x-auth-token cookie for API auth
 * @see {@link src/app/api/[[...slugs]]/route.ts} - Creates rooms and stores metadata in Redis
 * @see {@link ../README.md} - Configuration docs for changing room member limits
 */

import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { nanoid } from "nanoid";

/**
 * Middleware function that controls access to chat rooms.
 * 
 * Flow:
 * 1. Validates the room URL format
 * 2. Checks if room exists in Redis
 * 3. Validates existing user tokens or enforces room capacity
 * 4. Generates and stores new auth token for new users
 * 
 * @param req - The incoming Next.js request
 * @returns NextResponse - Redirect on error, or next() to allow access
 */
export const proxy = async (req: NextRequest) => {
    const pathname = req.nextUrl.pathname;

    // Extract roomId from URL path
    const roomMatch = pathname.match(/^\/room\/([^/]+)$/);

    if (!roomMatch) return NextResponse.redirect(new URL("/", req.url));

    const roomId = roomMatch[1];

    const meta = await redis.hgetall<{ connected: string[], createdAt: number; }>(`meta:${roomId}`);

    // Room doesn't exist - redirect with error
    if (!meta) return NextResponse.redirect(new URL("/?error=room-not-found", req.url));

    // Check if user already has a valid token for this room
    const existingToken = req.cookies.get("x-auth-token")?.value;

    if (existingToken && meta.connected.includes(existingToken)) return NextResponse.next();

    // Room is full - redirect with error
    if (meta.connected.length >= 2) return NextResponse.redirect(new URL("/?error=room-full", req.url));

    const response = NextResponse.next();
    const token = nanoid();

    /**
     * @see src/app/api/[[...slugs]]/auth.ts
     */
    response.cookies.set("x-auth-token", token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });

    /**
     * @see src/app/api/[[...slugs]]/auth.ts
     */
    await redis.hset(`meta:${roomId}`, {
        connected: [...meta.connected, token],
        createdAt: meta.createdAt,
    });

    return response;
};

export const config = {
    matcher: "/room/:path*",
};