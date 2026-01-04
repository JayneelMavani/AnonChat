/**
 * @module lib/realtime
 *
 * @see {@link ./realtime-client.ts} - Client-side React hook for subscribing to realtime events
 * @see {@link ../app/api/realtime/route.ts} - SSE endpoint handler for realtime connections
 * @see {@link ../app/api/[[...slugs]]/route.ts} - API routes that emit realtime events
 */

import { InferRealtimeEvents, Realtime } from "@upstash/realtime";
import { redis } from "@/lib/redis";
import z from "zod";

const message = z.object({
    id: z.string(),
    sender: z.string(),
    text: z.string(),
    timestamp: z.number(),
    roomId: z.string(),
    token: z.string().optional(),
});

const schema = {
    chat: {
        message,
        destroy: z.object({
            isDestroyed: z.literal(true),
        })
    }
};

export const realtime = new Realtime({ schema, redis });

/**
 * @see {@link ./realtime-client.ts} - Uses this type for the useRealtime hook
 */
export type RealtimeEvents = InferRealtimeEvents<typeof realtime>;

/**
 * @see {@link ../app/api/[[...slugs]]/route.ts} - Uses this type when creating messages
 */
export type Message = z.infer<typeof message>;