/**
 * @module app/room/[roomId]/page
 *
 * @see {@link ../../lib/client.ts} - API client for server communication
 * @see {@link ../../lib/realtime-client.ts} - Real-time event subscription
 * @see {@link ../../hooks/useUsername.ts} - Username generation hook
 */

"use client";

import { useUsername } from "@/hooks/useUsername";
import { client } from "@/lib/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useRealtime } from "@/lib/realtime-client";

/**
 * @param {number} seconds - Total seconds remaining
 * @returns {string} Formatted time string (e.g., "5:30", "0:05")
 */
const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Page = () => {
    const params = useParams();
    const roomId = params.roomId as string;

    const router = useRouter();

    const { username } = useUsername();
    const [copyStatus, setCopyStatus] = useState("COPY");
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    /**
     * Fetches all messages for the current room.
     * Automatically refetched when `chat.message` realtime events are received.
     *
     * @property {Message[]} data.messages - Array of messages with sender, text, and timestamp
     * @property {Function} refetch - Function to manually trigger a message refresh
     *
     * @see {@link client.messages.get} - API endpoint called by this query
     * @see {@link useRealtime} - Triggers refetch on `chat.message` events (line 98)
     */
    const { data: messages, refetch } = useQuery({
        queryKey: ["messages", roomId],
        queryFn: async () => {
            const res = await client.messages.get({ query: { roomId } });

            return res.data;
        }
    });

    /**
     * Fetches the remaining ttl for the current room.
     *
     * @property {number} data.ttl - Remaining seconds until room expires
     *
     * @see {@link client.room.ttl.get} - API endpoint called by this query
     * @see {@link timeRemaining} - State initialized from this data (line 70)
     * @see {@link formatTimeRemaining} - Formats TTL for display
     */
    const { data: ttlData } = useQuery({
        queryKey: ["ttl", roomId],
        queryFn: async () => {
            const res = await client.room.ttl.get({ query: { roomId } });

            return res.data;
        }
    });

    /**
     * Syncs the server ttl value to local state when data is fetched.
     *
     * @see {@link ttlData} - Query data source for initial TTL value
     * @see {@link timeRemaining} - Local state updated by this effect
     */
    useEffect(() => {
        if (ttlData?.ttl !== undefined) setTimeRemaining(ttlData.ttl);
    }, [ttlData]);

    /**
     * Countdown timer effect that decrements `timeRemaining` every second.
     * Handles room expiration by redirecting to the home page when the timer reaches zero.
     *
     * Behavior:
     * - Exits early if `timeRemaining` is null or negative
     * - Redirects to `/?destroyed=true` when timer hits 0
     * - Decrements counter every 1000ms via setInterval
     * - Cleans up interval on unmount or dependency change
     *
     * @see {@link timeRemaining} - State being decremented
     * @see {@link formatTimeRemaining} - Formats the value for display in header
     */
    useEffect(() => {
        if (timeRemaining === null || timeRemaining < 0) return;
        if (timeRemaining === 0) {
            router.push("/?destroyed=true");
            return;
        }

        const interval = setInterval(() => {
            setTimeRemaining((prevVal) => {
                if (prevVal === null || prevVal < 0) {
                    clearInterval(interval);
                    return 0;
                }

                return prevVal - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining, router]);

    /**
     * Mutation to send a new message to the current room.
     *
     * @param {Object} params - Mutation parameters
     * @param {string} params.text - The message text to send
     * @property {Function} mutate - Aliased as `sendMessage`, triggers the mutation
     * @property {boolean} isPending - True while the message is being sent
     *
     * @see {@link client.messages.post} - API endpoint called by this mutation
     * @see {@link username} - Sender name from useUsername hook
     * @see SEND button - Triggers this mutation (line 225)
     */
    const { mutate: sendMessage, isPending } = useMutation({
        mutationFn: async ({ text }: { text: string; }) => {
            await client.messages.post({ sender: username, text }, { query: { roomId } });

            setInput("");
        }
    });

    /**
     * Handles incoming events to update the UI in real-time.
     *
     * Event handlers:
     * - `chat.message`: Triggers a refetch of the messages query to display new messages
     * - `chat.destroy`: Redirects to home page when the room is destroyed by any user
     *
     * @see {@link ../../lib/realtime-client.ts} - Source of the useRealtime hook
     * @see {@link refetch} - Called on `chat.message` to refresh the message list
     * @see {@link destroyRoom} - Mutation that triggers `chat.destroy` event server-side
     */
    useRealtime({
        channels: [roomId],
        events: ["chat.message", "chat.destroy"],
        onData: ({ event }) => {
            if (event === "chat.message") refetch();
            if (event === "chat.destroy") router.push("/?destroyed=true");
        }
    });

    /**
     * Mutation to manually destroy the current room.
     * The server emits a `chat.destroy` event before deletion, notifying all connected clients.
     *
     * @property {Function} mutate - Aliased as `destroyRoom`, triggers the mutation
     *
     * @see {@link client.room.delete} - API endpoint called by this mutation
     * @see DESTROY NOW button - Triggers this mutation (line 172)
     * @see {@link useRealtime} - Handles `chat.destroy` event to redirect users
     */
    const { mutate: destroyRoom } = useMutation({
        mutationFn: async () => {
            await client.room.delete(null, { query: { roomId } });
        }
    });

    /**
     * @see {@link copyStatus} - State that controls the button text ("COPY" or "COPIED!")
     * @see COPY button - Triggers this function (line 166)
     */
    const copyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopyStatus("COPIED!");
        setTimeout(() => {
            setCopyStatus("COPY");
        }, 2000);
    };

    return <main className="flex flex-col h-screen max-h-screen overflow-hidden">
        <header className="border-b border-zinc-800 p-4 flex items-center justify-between bg-zinc-900/30">
            <div className="flex items-center gap-4">

                <div className="flex flex-col">
                    <span className="text-xs text-zinc-500 uppercase">Room ID</span>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-green-500">{roomId}</span>
                        <button onClick={copyLink} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 transition-colors">{copyStatus}</button>
                    </div>
                </div>

                <div className="h-8 w-px bg-zinc-800" />

                <div className="flex flex-col">
                    <span className="text-xs text-zinc-500 uppercase">Self Destruct</span>

                    <span className={`text-sm font-bold flex items-center gap-2
                        ${timeRemaining !== null && timeRemaining < 60
                            ? "text-red-500"
                            : "text-amber-500"
                        }`}>
                        {timeRemaining !== null
                            ? formatTimeRemaining(timeRemaining)
                            : "--:--"
                        }
                    </span>
                </div>
            </div>

            <button
                onClick={() => destroyRoom()}
                className="text-xs bg-zinc-800 hover:bg-red-600 px-3 py-1.5 rounded text-zinc-400 hover:text-white font-bold transition-all group flexitems-center gap-2 disabled:opacity-50"
            >
                <span className="group-hover:animate-pulse">💣</span>
                DESTROY NOW
            </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages?.messages.length === 0
                && (<div className="flex items-center justify-center h-full">
                    <p className="text-zinc-600 text-sm font-mono">
                        No messages yet, start the conversation!
                    </p>
                </div>)
            }

            {messages?.messages.map((message) => (
                <div key={message.id} className="flex flex-col items-start">
                    <div className="max-w-[80%] group">

                        <div className="flex items-baseline gap-3 mb-1">
                            <span className={
                                `text-xs font-bold ${message.sender === username
                                    ? "text-green-500"
                                    : "text-blue-500"}`
                            }>
                                {message.sender === username ? "YOU" : message.sender}
                            </span>

                            <span className="text-[10px] text-zinc-600">
                                {format(message.timestamp, 'HH:mm')}
                            </span>
                        </div>

                        <p className="text-sm text-zinc-300 leading-relaxed break-all">{message.text}</p>
                    </div>
                </div>
            ))}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">

            <div className="flex gap-4">
                <div className="flex-1 relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 animate-pulse">{">"}</span>
                    <input
                        autoFocus
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type message..."
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && input.trim()) {
                                sendMessage({ text: input });

                                inputRef.current?.focus;
                            }
                        }}
                        className="w-full bg-black border border-zinc-800 focus:border-zinc-700 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-700 py-3 pl-8 pr-4 text-sm"
                    />
                </div>

                <button
                    onClick={() => {
                        sendMessage({ text: input });
                        inputRef.current?.focus();
                    }}
                    disabled={!input.trim() || isPending}
                    className="bg-zinc-800 text-zinc-400 px-6 text-sm font-bold hover:text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    SEND
                </button>
            </div>

        </div>

    </main>;
};

export default Page;;