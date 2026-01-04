/**
 * @fileoverview Server-Sent Events (SSE) endpoint for real-time communication.
 *
 * @module api/realtime/route
 *
 * 1. Client establishes SSE connection to `/api/realtime?channel={roomId}`
 * 2. Server keeps connection open and streams events as they occur
 * 3. Events are pushed from server to client when `realtime.channel().emit()` is called
 *
 * @see {@link ../../lib/realtime.ts} - Realtime instance and event schema
 * @see {@link ../../lib/realtime-client.ts} - Client-side useRealtime hook
 * @see {@link ../[[...slugs]]/route.ts} - API routes that emit realtime events
 */

import { handle } from "@upstash/realtime";
import { realtime } from "@/lib/realtime";

/**
 * @route GET /api/realtime
 * @query {string} channel - The channel (roomId) to subscribe to
 * @returns {ReadableStream} Server-Sent Events stream
 */
export const GET = handle({ realtime });