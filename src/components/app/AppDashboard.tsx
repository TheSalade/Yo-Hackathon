'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Link from 'next/link';
import { AppHeader } from '@/components/shared/AppHeader';
import { getAllVaults, type VaultConfig } from '@yo-protocol/core';
import { useUserBalances } from '@yo-protocol/react';
import { VaultCard } from './VaultCard';
import { APP_VAULTS } from '@/lib/constants';

function TotalBalanceCard({ address }: { address?: `0x${string}` }) {
    const { balances, isLoading } = useUserBalances(address);

    const totalUsd = balances?.totalBalanceUsd ? Number(balances.totalBalanceUsd) : 0;
    const hasBalance = totalUsd > 0;

    return (
        <div style={{
            background: 'linear-gradient(145deg, #151515, #111)',
            border: '1px solid #2a2a2a',
            borderRadius: '24px',
            padding: '32px',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '32px',
        }}>
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(212,245,0,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Total savings</div>
            {isLoading ? (
                <div className="skeleton" style={{ height: '48px', width: '200px', marginBottom: '12px' }} />
            ) : (
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, color: '#f5f4f0', letterSpacing: '-2px', marginBottom: '12px', lineHeight: 1 }}>
                    ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', background: '#00e87a', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '13px', color: '#00e87a' }}>
                    {hasBalance ? 'Earning yield live on Base' : 'No positions yet — deposit to start earning'}
                </span>
            </div>
        </div>
    );
}

function ConnectWalletBtn() {
    const { connect } = useConnect();
    return (
        <button
            onClick={() => connect({ connector: injected() })}
            style={{ background: '#d4f500', color: '#0a0a0a', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', letterSpacing: '0.03em' }}
        >
            Connect wallet
        </button>
    );
}

export function AppDashboard() {
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();

    const vaults: VaultConfig[] = getAllVaults().filter(v =>
        APP_VAULTS.includes(v.symbol as typeof APP_VAULTS[number])
    );

    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected';

    return (
        <>
            <style>{`
                @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.6} }
                @keyframes pulse2 { 0%,100%{box-shadow:0 0 0 0 rgba(0,232,122,0.4)} 70%{box-shadow:0 0 0 6px rgba(0,232,122,0)} }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }
            `}</style>

            <AppHeader active="Dashboard" />

            <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f5f4f0', paddingTop: 65 }}>
                <div className="noise-overlay" />

                {/* Main content */}
                <main style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px 96px' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4f500', marginBottom: '12px', fontWeight: 500 }}>Your Dashboard</p>
                        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#f5f4f0', letterSpacing: '-1px', lineHeight: 1.1 }}>
                            Savings working hard ✦
                        </h1>
                    </div>

                    <TotalBalanceCard address={address} />

                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: '#f5f4f0', letterSpacing: '-0.3px' }}>Available Vaults</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555' }}>
                            <div style={{ width: '6px', height: '6px', background: '#00e87a', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                            Live on Base
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        {vaults.map(vault => <VaultCard key={vault.symbol} vault={vault} />)}
                    </div>

                    <div style={{ marginTop: '48px', padding: '20px 24px', background: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '20px' }}>🔒</div>
                        <div>
                            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: '#f5f4f0', marginBottom: '2px' }}>Non-custodial &amp; audited</div>
                            <div style={{ fontSize: '12px', color: '#555' }}>Your funds are secured by YO Protocol smart contracts on Base. You retain full custody at all times.</div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
