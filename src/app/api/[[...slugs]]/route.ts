/**
 * @fileoverview Main API routes for the anonymous chat application.
 *
 * @module api/[[...slugs]]/route
 *
 * Room Endpoints (`/api/room`)
 * - `POST /api/room/create` - Create a new chat room
 * - `GET /api/room/ttl?roomId=xxx` - Get remaining TTL for a room (auth required)
 * - `DELETE /api/room?roomId=xxx` - Delete a room and notify clients (auth required)
 *
 * Message Endpoints (`/api/messages`)
 * - `POST /api/messages?roomId=xxx` - Send a message to a room (auth required)
 * - `GET /api/messages?roomId=xxx` - Get all messages in a room (auth required)
 *
 * @see {@link ./auth.ts} - Authentication middleware for protected routes
 * @see {@link ../../lib/realtime.ts} - Realtime event emission
 * @see {@link ../../lib/client.ts} - Type-safe client that consumes these endpoints
 */

import { redis } from '@/lib/redis';
import { Elysia, t } from 'elysia';
import { nanoid } from 'nanoid';
import { authMiddlware } from './auth';
import { z } from 'zod';
import { Message, realtime } from '@/lib/realtime';

const roomTtlSec = 60 * 10;

/**
 * Room management routes.
 * 
 * Redis keys used:
 * - `meta:{roomId}` - Hash containing room metadata (connected users, createdAt)
 * - `messages:{roomId}` - List of messages in the room
 * - `{roomId}` - Additional room data
 */
const rooms = new Elysia({ prefix: "/room" })
    /**
     * Create a new chat room.
     * @route POST /api/room/create
     * @returns {{ roomId: string }} The newly created room ID
     */
    .post(
        "/create", async () => {
            const roomId = nanoid();

            await redis.hset(`meta:${roomId}`, {
                connected: [],
                createdAt: Date.now(),
            });

            await redis.expire(`meta:${roomId}`, roomTtlSec);

            return { roomId };
        }
    )
    .use(authMiddlware)
    /**
     * Get the remaining time-to-live for a room.
     * @route GET /api/room/ttl
     * @query {string} roomId - The room ID to check
     * @returns {{ ttl: number }} Remaining seconds until room expires (0 if expired)
     * @requires Authentication via x-auth-token cookie
     */
    .get("/ttl", async ({ auth }) => {
        const ttl = await redis.ttl(`meta:${auth.roomId}`);

        return { ttl: ttl > 0 ? ttl : 0 };
    }, {
        query: z.object({
            roomId: z.string()
        })
    })
    /**
     * Delete a chat room and all associated data.
     * Emits a "chat.destroy" event to notify connected clients before deletion.
     * @route DELETE /api/room
     * @query {string} roomId - The room ID to delete
     * @requires Authentication via x-auth-token cookie
     * @fires chat.destroy - Notifies all clients that the room is being destroyed
     */
    .delete("/", async ({ auth }) => {
        await realtime.channel(auth.roomId).emit("chat.destroy", { isDestroyed: true });

        await Promise.all([
            redis.del(auth.roomId),
            redis.del(`meta:${auth.roomId}`),
            redis.del(`messages:${auth.roomId}`),
        ]);
    }, {
        query: z.object({
            roomId: z.string()
        })
    });

/**
 * Message handling routes.
 *
 * Redis keys used:
 * - `messages:{roomId}` - List of messages stored as JSON objects
 */
const messages = new Elysia({ prefix: "/messages" })
    .use(authMiddlware)
    /**
     * Send a new message to a chat room.
     * Stores the message in Redis and emits a realtime event to all connected clients.
     * Message TTL is synchronized with the room's remaining TTL.
     *
     * @route POST /api/messages
     * @query {string} roomId - The room to send the message to
     * @body {string} sender - The sender's display name (max 100 chars)
     * @body {string} text - The message content (max 1000 chars)
     * @requires Authentication via x-auth-token cookie
     * @fires chat.message - Broadcasts the new message to all room subscribers
     * @throws {Error} If the room does not exist
     */
    .post("/", async ({ auth, body }) => {
        const { sender, text } = body;
        const { roomId } = auth;

        const roomExists = await redis.exists((`meta:${roomId}`));

        if (!roomExists) throw new Error("Room does not exist");

        const message: Message = {
            id: nanoid(),
            sender,
            text,
            timestamp: Date.now(),
            roomId,
        };

        await redis.rpush(`messages:${roomId}`, { ...message, token: auth.token });
        await realtime.channel(roomId).emit("chat.message", message);

        const remaining = await redis.ttl(`meta:${roomId}`);

        await redis.expire(`messages:${roomId}`, remaining);
        await redis.expire(`history:${roomId}`, remaining);
        await redis.expire(roomId, remaining);
    }, {
        query: z.object({ roomId: z.string() }),
        body: z.object({
            sender: z.string().max(100),
            text: z.string().max(1000),
        })
    })
    /**
     * Retrieve all messages from a chat room.
     * Returns messages with token information for ownership verification.
     * The token is only included for messages sent by the requesting user.
     *
     * @route GET /api/messages
     * @query {string} roomId - The room to retrieve messages from
     * @returns {{ messages: Message[] }} Array of messages with optional token field
     * @requires Authentication via x-auth-token cookie
     */
    .get("/", async ({ auth }) => {
        const messages = await redis.lrange<Message>(`messages:${auth.roomId}`, 0, -1);

        return {
            messages: messages.map((message) => ({
                ...message, token: message.token === auth.token
                    ? message.token
                    : undefined
            }))
        };
    }, {
        query: z.object({ roomId: z.string() })
    });

/**
 * Main Elysia application instance combining all route groups.
 * Mounted at `/api` prefix and used by Next.js route handlers.
 */
const app = new Elysia({ prefix: "/api" }).use(rooms).use(messages);

export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE = app.fetch;

/**
 * @see {@link ../../lib/client.ts} - Type-safe API client using this type
 */
export type App = typeof app;