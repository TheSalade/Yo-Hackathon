'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { getAllVaults, type VaultConfig } from '@yo-protocol/core';
import { useUserBalances } from '@yo-protocol/react';
import { VaultCard } from './VaultCard';
import { APP_VAULTS } from '@/lib/constants';

function TotalBalanceCard({ address }: { address?: `0x${string}` }) {
    // useUserBalances(address) → { balances: UserBalances | undefined }
    // UserBalances.totalBalanceUsd is a string
    const { balances, isLoading } = useUserBalances(address);

    const totalUsd = balances?.totalBalanceUsd
        ? Number(balances.totalBalanceUsd)
        : 0;
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
            {/* Glow effect */}
            <div style={{
                position: 'absolute',
                top: '-60px', right: '-60px',
                width: '200px', height: '200px',
                background: 'radial-gradient(circle, rgba(212,245,0,0.07) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />

            <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
                Total savings
            </div>

            {isLoading ? (
                <div className="skeleton" style={{ height: '48px', width: '200px', marginBottom: '12px' }} />
            ) : (
                <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 'clamp(36px, 5vw, 56px)',
                    fontWeight: 800,
                    color: '#f5f4f0',
                    letterSpacing: '-2px',
                    marginBottom: '12px',
                    lineHeight: 1,
                }}>
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

export function AppDashboard() {
    const { user, logout } = usePrivy();
    const { address } = useAccount();

    const vaults: VaultConfig[] = getAllVaults().filter(v =>
        APP_VAULTS.includes(v.symbol as typeof APP_VAULTS[number])
    );

    const shortAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : user?.email?.address?.slice(0, 20) ?? 'Connected';

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f5f4f0' }}>
            {/* Background noise */}
            <div className="noise-overlay" />

            {/* Header */}
            <header style={{
                position: 'sticky', top: 0,
                zIndex: 100,
                background: 'rgba(10,10,10,0.8)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                backdropFilter: 'blur(16px)',
                padding: '0 48px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '20px', color: '#f5f4f0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', background: '#d4f500', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                    ZYO
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '100px',
                        padding: '6px 14px',
                    }}>
                        <div style={{
                            width: '24px', height: '24px',
                            background: 'linear-gradient(135deg, #d4f500, #00e87a)',
                            borderRadius: '50%',
                            flexShrink: 0,
                        }} />
                        <span style={{ fontSize: '13px', color: '#888', fontFamily: 'monospace' }}>{shortAddress}</span>
                    </div>

                    <button
                        id="disconnect-btn"
                        onClick={logout}
                        style={{
                            background: 'none',
                            border: '1px solid #2a2a2a',
                            color: '#555',
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 600,
                            fontSize: '12px',
                            padding: '8px 16px',
                            borderRadius: '100px',
                            cursor: 'pointer',
                            letterSpacing: '0.05em',
                            transition: 'border-color 0.2s, color 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#f5f4f0'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555'; }}
                    >
                        Disconnect
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px 96px' }}>
                {/* Page title */}
                <div style={{ marginBottom: '32px' }}>
                    <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4f500', marginBottom: '12px', fontWeight: 500 }}>
                        Your Dashboard
                    </p>
                    <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#f5f4f0', letterSpacing: '-1px', lineHeight: 1.1 }}>
                        Savings working hard ✦
                    </h1>
                </div>

                {/* Total balance */}
                <TotalBalanceCard address={address} />

                {/* Vaults section */}
                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: '#f5f4f0', letterSpacing: '-0.3px' }}>
                        Available Vaults
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555' }}>
                        <div style={{ width: '6px', height: '6px', background: '#00e87a', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                        Live on Base
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px',
                }}>
                    {vaults.map(vault => (
                        <VaultCard key={vault.symbol} vault={vault} />
                    ))}
                </div>

                {/* Info footer */}
                <div style={{
                    marginTop: '48px',
                    padding: '20px 24px',
                    background: '#111',
                    border: '1px solid #1e1e1e',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                    <div style={{ fontSize: '20px' }}>🔒</div>
                    <div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: '#f5f4f0', marginBottom: '2px' }}>Non-custodial & audited</div>
                        <div style={{ fontSize: '12px', color: '#555' }}>Your funds are secured by YO Protocol smart contracts on Base. You retain full custody at all times.</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
