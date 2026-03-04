'use client';

// No auth guard — /app/* is accessible without a wallet connection.
// The individual components handle the "not connected" state gracefully.
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
