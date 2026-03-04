'use client';

import { useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'viem/chains';
import { wagmiConfig } from '@/lib/wagmi';
import { YieldProvider } from '@yo-protocol/react';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';

function SetupBanner() {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
            background: '#d4f500', color: '#0a0a0a',
            padding: '10px 24px',
            textAlign: 'center',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
        }}>
            ⚡ Dev mode — Add your <strong>NEXT_PUBLIC_PRIVY_APP_ID</strong> to{' '}
            <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>.env.local</code>{' '}
            to enable authentication.{' '}
            <a href="https://dashboard.privy.io" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>Get your App ID →</a>
        </div>
    );
}

function MockProviders({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    return (
        <QueryClientProvider client={queryClient}>
            <SetupBanner />
            <div style={{ paddingTop: '44px' }}>{children}</div>
        </QueryClientProvider>
    );
}

function FullProviders({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: { staleTime: 30_000, refetchInterval: 30_000 },
        },
    }));

    return (
        <PrivyProvider
            appId={PRIVY_APP_ID}
            config={{
                defaultChain: base,
                supportedChains: [base],
                loginMethods: ['email', 'wallet'],
                embeddedWallets: {
                    ethereum: { createOnLogin: 'users-without-wallets' },
                },
                appearance: {
                    theme: 'dark',
                    accentColor: '#d4f500',
                    showWalletLoginFirst: false,
                    walletChainType: 'ethereum-only',
                },
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={wagmiConfig}>
                    <YieldProvider>
                        {children}
                    </YieldProvider>
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
    // Validate Privy App ID format (must be a non-empty string starting with "cl")
    const hasValidPrivyId = PRIVY_APP_ID.length > 10 && PRIVY_APP_ID.startsWith('cl');

    if (!hasValidPrivyId) {
        return <MockProviders>{children}</MockProviders>;
    }

    return <FullProviders>{children}</FullProviders>;
}
