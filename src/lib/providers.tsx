'use client';

import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { YieldProvider } from '@yo-protocol/react';
import { wagmiConfig } from '@/lib/wagmi';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: { staleTime: 30_000, refetchInterval: 30_000 },
        },
    }));

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <YieldProvider>
                    {children}
                </YieldProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
