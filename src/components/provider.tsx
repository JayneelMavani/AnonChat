/**
 * @fileoverview Application-wide context providers
 *
 * @module components/provider
 *
 * @see {@link ../app/layout.tsx} - Root layout that uses this provider
 * @see {@link ../lib/realtime-client.ts} - Realtime hooks enabled by RealtimeProvider
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RealtimeProvider } from "@upstash/realtime/client";
import { useState } from "react";

/**
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render within the providers
 * @returns {JSX.Element} The wrapped children with all providers applied
 */
export const Providers = ({ children }: { children: React.ReactNode; }) => {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <RealtimeProvider>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </RealtimeProvider>);
};