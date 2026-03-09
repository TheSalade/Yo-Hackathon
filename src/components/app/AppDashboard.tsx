'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { AppHeader } from '@/components/shared/AppHeader';
import { VAULT_META } from '@/lib/constants';
import { useAppPositions } from '@/hooks/useAppPositions';
import { useState } from 'react';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';
import { formatUnits } from 'viem';
import { useVaults } from '@yo-protocol/react';

const PRICES: Record<string, number> = {
    yoUSD: 1,
    yoBTC: 65000,
    yoEUR: 1.08,
    yoETH: 2500
};

function TotalBalanceCard() {
    const { positions, isLoading } = useAppPositions();

    const totalUsd = positions.reduce((acc, pos) => {
        if (!pos.hasPosition) return acc;
        const n = Number(formatUnits(pos.assets, pos.decimals));
        const price = PRICES[pos.vault.symbol] || 0;
        return acc + (n * price);
    }, 0);

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

function UserPositionList() {
    const { positions, isLoading, refetch } = useAppPositions();
    const { vaults: vaultsStats } = useVaults();
    const activePositions = positions.filter(p => p.hasPosition);

    const [depositVault, setDepositVault] = useState<any>(null);
    const [withdrawVault, setWithdrawVault] = useState<any>(null);

    if (!isLoading && activePositions.length === 0) return null;

    return (
        <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: '#f5f4f0', letterSpacing: '-0.3px', marginBottom: '16px' }}>Your Positions</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {isLoading ? (
                    <div className="skeleton" style={{ height: '70px', borderRadius: '16px' }} />
                ) : (
                    activePositions.map(pos => {
                        const meta = VAULT_META[pos.vault.symbol as keyof typeof VAULT_META];
                        const amount = Number(formatUnits(pos.assets, pos.decimals));
                        const price = PRICES[pos.vault.symbol] || 0;
                        const usdValue = amount * price;

                        const vaultStat = vaultsStats?.find((v: any) => v.id === pos.vault.symbol);
                        const yieldRaw = vaultStat?.yield?.['7d'] ?? vaultStat?.yield?.['30d'];
                        const displayApyNum = yieldRaw ? Number(yieldRaw) : meta.apy;
                        const displayApy = displayApyNum.toFixed(2);

                        return (
                            <div key={pos.vault.symbol} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <img src={`/yo/${pos.vault.symbol}.svg`} alt={pos.vault.symbol} style={{ width: 40, height: 40, borderRadius: 12 }} />
                                    <div>
                                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: '#f5f4f0' }}>{pos.vault.symbol}</div>
                                        <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {meta.underlyingSymbol}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: '#fff' }}>${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div style={{ fontSize: '12px', color: '#00e87a', fontWeight: 600 }}>{displayApy}% APY</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => setDepositVault(pos.vault)} style={{ background: '#2a2a2a', color: '#f5f4f0', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, fontFamily: 'Syne, sans-serif', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#3a3a3a'} onMouseLeave={e => e.currentTarget.style.background = '#2a2a2a'}>Add funds</button>
                                        <button onClick={() => setWithdrawVault(pos.vault)} style={{ background: 'none', color: '#888', border: '1px solid #333', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, fontFamily: 'Syne, sans-serif', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888'; }}>Withdraw</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {depositVault && <DepositModal vault={depositVault} onClose={() => { setDepositVault(null); refetch(); }} />}
            {withdrawVault && <WithdrawModal vault={withdrawVault} onClose={() => { setWithdrawVault(null); refetch(); }} />}
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

                    <TotalBalanceCard />
                    <UserPositionList />

                    <div style={{ marginTop: '48px', padding: '20px 24px', background: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src="/yo/yo_round.svg" alt="Secure" style={{ width: 22, height: 22 }} />
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
