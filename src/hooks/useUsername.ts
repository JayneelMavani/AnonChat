/**
 * @see {@link ../app/page.tsx} - Home page using this hook
 * @see {@link ../app/room/[roomId]/page.tsx} - Chat room page using this hook
 */

"use client";

import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

const STORAGE_KEY = "chat_username";

/**
 * @returns {Object} An object containing the username state
 * @returns {string} returns.username - The generated or retrieved username (empty string while loading)
 */
export const useUsername = () => {
    /**
     * @returns {Promise<string | undefined>} A username in the format "anonymous-{adjective}-{noun}-{id}",
     *                                         or undefined if the API request fails
     * @private
     */
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

    const [username, setUsername] = useState<string>("");

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

    return { username };
};