# Anon Chat

A self-destructing anonymous chat room application built with Next.js, Upstash Redis, and Upstash Realtime.

## Features

- 🔒 Anonymous chat rooms with auto-generated IDs
- ⏱️ Self-destructing rooms with configurable TTL
- 👥 Room member limits
- ⚡ Real-time messaging with Upstash Realtime
- 🍪 Token-based authentication

## Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:

```env
UPSTASH_REDIS_REST_URL=your_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_redis_rest_token
```

Get these from: https://console.upstash.com/redis

## Configuration

### Room Self-Destruct Time (TTL)

The room TTL (time-to-live) determines how long a room exists before it auto-destructs. 

To change the default 10-minute TTL, edit [src/app/api/[[...slugs]]/route.ts](src/app/api/[[...slugs]]/route.ts):

```ts
// Current: 10 minutes (60 seconds * 10)
const roomTtlSec = 60 * 10;

// Example: 30 minutes
const roomTtlSec = 60 * 30;

// Example: 1 hour
const roomTtlSec = 60 * 60;
```

### Maximum Room Members

The maximum number of users allowed in a room is set to 2 by default.

To change this limit, edit [src/proxy.ts](src/proxy.ts):

```ts
// Current: 2 members max
if (meta.connected.length >= 2) return NextResponse.redirect(new URL("/?error=room-full", req.url));

// Example: 5 members max
if (meta.connected.length >= 5) return NextResponse.redirect(new URL("/?error=room-full", req.url));
```

### Message Limits

Message content limits are defined in [src/app/api/[[...slugs]]/route.ts](src/app/api/[[...slugs]]/route.ts):

```ts
body: z.object({
    sender: z.string().max(100),  // Max username length: 100 characters
    text: z.string().max(1000),   // Max message length: 1000 characters
})
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Docker

### Build the Image

```bash
docker build -t anon-chat .
```

### Run the Container

```bash
docker run -p 3000:3000 \
  -e UPSTASH_REDIS_REST_URL=your_redis_rest_url \
  -e UPSTASH_REDIS_REST_TOKEN=your_redis_rest_token \
  anon-chat
```

### Using Docker Compose

A `docker-compose.yaml` is included with health checks configured.

First, set up your environment:

```bash
cp .env.example .env
# Edit .env with your Upstash credentials
```

Then run:

```bash
# Start the container
docker compose up -d

# View logs
docker compose logs -f

# Stop the container
docker compose down
```

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)
- [Upstash Realtime](https://upstash.com/docs/realtime/overall/getstarted)

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home/lobby page - create rooms
│   ├── layout.tsx                  # Root layout with providers
│   ├── room/
│   │   └── [roomId]/
│   │       └── page.tsx            # Chat room interface
│   └── api/
│       ├── [[...slugs]]/
│       │   ├── route.ts            # REST API (rooms, messages)
│       │   └── auth.ts             # Authentication middleware
│       └── realtime/
│           └── route.ts            # SSE endpoint for realtime events
├── components/
│   └── provider.tsx                # React context providers
├── hooks/
│   └── useUsername.ts              # Anonymous username generation
├── lib/
│   ├── client.ts                   # Type-safe API client (Eden Treaty)
│   ├── redis.ts                    # Upstash Redis client
│   ├── realtime.ts                 # Realtime event schema & instance
│   └── realtime-client.ts          # Client-side realtime hook
└── proxy.ts                        # Middleware for room access control
```

### Key Modules

| Module | Description |
|--------|-------------|
| `lib/realtime.ts` | Defines the realtime event schema (`chat.message`, `chat.destroy`) and exports the configured Upstash Realtime instance |
| `lib/client.ts` | Type-safe API client using Eden Treaty, inferred from the Elysia app type |
| `hooks/useUsername.ts` | Generates and persists anonymous usernames using Datamuse API |
| `api/[[...slugs]]/route.ts` | Main API routes for room CRUD and messaging |
| `api/realtime/route.ts` | SSE endpoint for real-time event streaming |

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
