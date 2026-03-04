'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Safe wrapper: try to use Privy, fall back gracefully if not initialized
function usePrivySafe() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { usePrivy } = require('@privy-io/react-auth');
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return usePrivy();
    } catch {
        return { ready: true, authenticated: true };
    }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { authenticated, ready } = usePrivySafe();
    const router = useRouter();

    useEffect(() => {
        if (ready && !authenticated) {
            router.push('/');
        }
    }, [ready, authenticated, router]);

    if (!ready) {
        return (
            <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '2px solid #2a2a2a', borderTop: '2px solid #d4f500', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        );
    }

    if (!authenticated) return null;

    return <>{children}</>;
}
