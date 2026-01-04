/**
 * @fileoverview Home page / lobby for the anonymous chat application.
 *
 * @module app/page
 *
 * ## URL Parameters
 * - `?destroyed=true` - Shows notification that the previous room was destroyed
 * - `?error=room-not-found` - Shows error when attempting to join a non-existent room
 * - `?error=room-full` - Shows error when room has reached max capacity
 *
 * @see {@link ./room/[roomId]/page.tsx} - Chat room page navigated to after creation
 * @see {@link ../hooks/useUsername.ts} - Username generation hook
 * @see {@link ../lib/client.ts} - API client for room creation
 */

"use client";

import { useUsername } from "@/hooks/useUsername";
import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Root page component wrapped in Suspense for useSearchParams support.
 *
 * @returns {JSX.Element} Suspense-wrapped Lobby component
 */
const Page = () => {
  return (
    <Suspense>
      <Lobby />;
    </Suspense>
  );
};

/**
 * Displays:
 * - Notification banners for destroyed rooms or errors
 * - User's anonymous identity (generated username)
 * - Button to create a new secure chat room
 *
 * @returns {JSX.Element} The lobby interface
 */
function Lobby() {
  const { username } = useUsername();
  const router = useRouter();
  const searchParams = useSearchParams();

  const wasDestroyed = searchParams.get("destroyed") === "true";
  const error = searchParams.get("error");

  /**
   * Mutation to create a new chat room.
   * On success, navigates to the newly created room.
   *
   * @see {@link client.room.create.post} - API endpoint for room creation
   */
  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();

      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);
      }
    }
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">

        {wasDestroyed && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM DESTROYED</p>
            <p className="text-zinc-500 text-xs mt-1">All messages were permanently deleted.</p>
          </div>
        )}

        {error === "room-not-found" && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM NOT FOUND</p>
            <p className="text-zinc-500 text-xs mt-1">This room may have expired or never existed.</p>
          </div>
        )}

        {error === "room-full" && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM FULL</p>
            <p className="text-zinc-500 text-xs mt-1">This room has reached its maximum capacity.</p>
          </div>
        )}

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-green-500">{">"}private_chat</h1>
          <p className="text-zinc-500 text-sm">Welcome to the anonymous chat room. Your identity is secure and private.</p>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">

              <label className="flex items-center text-zinc-500">Your Identity</label>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-400 font-mono">
                  {username}
                </div>
              </div>

            </div>

            <button onClick={() => createRoom()} className="w-full bg-zinc-100 text-black p-3 text-sm font-bold hover:bg-zinc-50 hover:text-black transition-colors mt-2 cursor-pointer disabled:opacity-50">
              CREATE SECURE ROOM
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}

export default Page;