"use client";

import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

const STORAGE_KEY = "chat_username";

const generateUsername = async () => {
  try {
    const adjectives = await fetch("https://api.datamuse.com/words?rel_jjb=person").then(res => res.json());
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];

    const nouns = await fetch("https://api.datamuse.com/words?rel_trg=animal").then(res => res.json());
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `anonymous-${adjective.word}-${noun.word}-${nanoid(5)}`;
  } catch (error) {
    console.error(`Error generating username: ${error}`);
  }
};

export default function Home() {
  const [username, setUsername] = useState<string>("");

  // const updateUsername = async () => {
  //   const newUsername = await generateUsername();
  //   setUsername(newUsername || '');
  // };

  const genAndStoreUsername = async () => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      setUsername(stored);
      return;
    }

    const newUsername = await generateUsername();
    if (newUsername) {
      localStorage.setItem(STORAGE_KEY, newUsername);
      setUsername(newUsername);
    }
  };

  useEffect(() => {
    genAndStoreUsername();
  }, []);

  const { } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();
    }
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">

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

            <button className="w-full bg-zinc-100 text-black p-3 text-sm font-bold hover:bg-zinc-50 hover:text-black transition-colors mt-2 cursor-pointer disabled:opacity-50">
              CREATE SECURE ROOM
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
