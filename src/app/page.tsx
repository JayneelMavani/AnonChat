"use client";

/**
 * Main page component for the anonymous chat application.
 * This page serves as the lobby where users can create a new chat room.
 * It uses Suspense to handle any potential loading states for the Lobby component.
 *
 * References:
 * - Next.js: Framework for React applications with server-side rendering and routing (https://nextjs.org/).
 * - @tanstack/react-query: Library for data fetching and state management in React (https://tanstack.com/query/).
 * - React: Library for building user interfaces (https://react.dev/).
 * - Custom hook: useUsername (src/hooks/useUsername.ts) - Generates and manages anonymous usernames.
 * - API client: client (src/lib/client.ts) - Type-safe API client using Elysia Eden treaty.
 */

import { useUsername } from "@/hooks/useUsername";
import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const Page = () => {
  return (
    <Suspense>
      <Lobby />;
    </Suspense>
  );
};

/**
 * Lobby component: The main interface for users to enter the chat application.
 * Displays the user's identity (generated anonymously), allows creating a new secure room,
 * and shows error messages based on URL search parameters (e.g., room destroyed, not found, or full).
 *
 * The component uses:
 * - useUsername: To fetch or generate a unique anonymous username stored in localStorage.
 * - useRouter: For programmatic navigation to the created room.
 * - useSearchParams: To read error states from the URL (e.g., after redirection).
 * - useMutation: To handle the asynchronous room creation API call.
 */
function Lobby() {
  // Hook to get the current user's anonymous username (generated via Datamuse API and nanoid)
  const { username } = useUsername();
  // Hook for programmatic navigation in Next.js
  const router = useRouter();
  // Hook to access URL search parameters for error handling
  const searchParams = useSearchParams();

  // Check if the room was destroyed (indicated by 'destroyed=true' in URL)
  const wasDestroyed = searchParams.get("destroyed") === "true";
  // Get any error type from URL params (e.g., 'room-not-found', 'room-full')
  const error = searchParams.get("error");

  // Mutation to create a new room using TanStack Query
  // Calls the API endpoint to create a room and navigates to it on success
  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      // Make a POST request to the room creation endpoint via the type-safe client
      const res = await client.room.create.post();

      if (res.status === 200) {
        // Navigate to the newly created room page
        router.push(`/room/${res.data?.roomId}`);
      }
    }
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">

        {/* Conditional display: Show message if the room was destroyed (e.g., after admin action) */}
        {wasDestroyed && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM DESTROYED</p>
            <p className="text-zinc-500 text-xs mt-1">All messages were permanently deleted.</p>
          </div>
        )}

        {/* Conditional display: Show message if attempting to join a non-existent room */}
        {error === "room-not-found" && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM NOT FOUND</p>
            <p className="text-zinc-500 text-xs mt-1">This room may have expired or never existed.</p>
          </div>
        )}

        {/* Conditional display: Show message if the room has reached maximum capacity */}
        {error === "room-full" && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM FULL</p>
            <p className="text-zinc-500 text-xs mt-1">This room has reached its maximum capacity.</p>
          </div>
        )}

        {/* Main application title and welcome message */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-green-500">{">"}private_chat</h1>
          <p className="text-zinc-500 text-sm">Welcome to the anonymous chat room. Your identity is secure and private.</p>
        </div>

        {/* Container for user identity display and room creation action */}
        <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">

              <label className="flex items-center text-zinc-500">Your Identity</label>

              {/* Display the user's generated anonymous username */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-400 font-mono">
                  {username}
                </div>
              </div>

            </div>

            {/* Button to trigger room creation; disabled during mutation if needed */}
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