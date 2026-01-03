import { redis } from '@/lib/redis';
import { Elysia, t } from 'elysia';
import { nanoid } from 'nanoid';

const roomTtlSec = 60 * 10;

const rooms = new Elysia({ prefix: "/room" }).post(
    "/create", async () => {
        const roomId = nanoid();

        await redis.hset(`meta:${roomId}`, {
            connected: [],
            createdAt: Date.now(),
        });

        await redis.expire(`meta:${roomId}`, roomTtlSec);

        return { roomId };
    }
);

const app = new Elysia({ prefix: "/api" }).use(rooms);

export const GET = app.fetch;
export const POST = app.fetch;

export type App = typeof app;