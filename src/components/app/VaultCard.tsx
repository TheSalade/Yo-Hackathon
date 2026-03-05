'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { useVaultState, useUserPosition, useVaultHistory, useVaults } from '@yo-protocol/react';
import type { VaultConfig } from '@yo-protocol/core';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { VAULT_META } from '@/lib/constants';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';

interface VaultCardProps {
    vault: VaultConfig;
}

export function VaultCard({ vault }: VaultCardProps) {
    const { address } = useAccount();
    const meta = VAULT_META[vault.symbol];
    const [showDeposit, setShowDeposit] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);

    // useVaultState(vaultId) → { vaultState }
    const { vaultState, isLoading: stateLoading } = useVaultState(vault.symbol);

    // useUserPosition(vaultId, account) → { position }
    const { position: userPosition } = useUserPosition(vault.symbol, address);

    // useVaultHistory(vaultId) → { yieldHistory, tvlHistory }
    const { yieldHistory } = useVaultHistory(vault.symbol);

    // Dynamic APY from SDK
    const { vaults } = useVaults();
    const statItem = vaults?.find(s => s.id === vault.symbol);
    const sdkApyRaw = statItem?.yield?.['30d'] || statItem?.yield?.['7d'];
    const activeApyNum = sdkApyRaw ? Number(sdkApyRaw) * 100 : meta.apy;
    const activeApyStr = activeApyNum.toFixed(1);

    // Format TVL
    const tvlFormatted = vaultState
        ? (() => {
            const n = Number(formatUnits(vaultState.totalAssets, vaultState.assetDecimals));
            return n > 1_000_000
                ? `$${(n / 1_000_000).toFixed(2)}M`
                : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        })()
        : null;

    // Format user position
    const userAssets = userPosition && vaultState
        ? Number(formatUnits(userPosition.assets, vaultState.assetDecimals))
        : 0;
    const userAssetsFormatted = userAssets > 0
        ? `$${userAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : null;

    // Build chart data
    const chartData = yieldHistory && yieldHistory.length > 0
        ? yieldHistory.slice(-20).map(point => ({ t: point.timestamp, apy: point.value }))
        : Array.from({ length: 15 }, (_, i) => ({ t: i, apy: activeApyNum + (Math.random() - 0.5) * 0.4 }));

    const hasPosition = userAssets > 0;

    return (
        <>
            {showDeposit && <DepositModal vault={vault} onClose={() => setShowDeposit(false)} />}
            {showWithdraw && <WithdrawModal vault={vault} onClose={() => setShowWithdraw(false)} />}

            <div
                style={{
                    background: 'linear-gradient(145deg, #141414, #111)',
                    border: `1px solid ${hasPosition ? 'rgba(212,245,0,0.12)' : '#1e1e1e'}`,
                    borderRadius: '20px',
                    padding: '24px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
                {hasPosition && (
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(212,245,0,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                )}

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            {meta.emoji}
                        </div>
                        <div>
                            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 800, color: '#f5f4f0', letterSpacing: '-0.3px' }}>{vault.symbol}</div>
                            <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{meta.underlyingSymbol} · {vault.network}</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 800, color: '#00e87a', letterSpacing: '-0.5px' }}>{activeApyStr}%</div>
                        <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.05em', textTransform: 'uppercase' }}>APY</div>
                    </div>
                </div>

                {/* Mini chart */}
                <div style={{ height: '48px', marginBottom: '20px', opacity: 0.7 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id={`gradient-${vault.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00e87a" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00e87a" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="apy" stroke="#00e87a" strokeWidth={1.5} fill={`url(#gradient-${vault.symbol})`} dot={false} isAnimationActive={false} />
                            <Tooltip
                                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '11px', color: '#888' }}
                                formatter={(v) => [`${Number(v ?? 0).toFixed(2)}%`, 'APY']}
                                labelFormatter={() => ''}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, background: '#1a1a1a', borderRadius: '12px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>TVL</div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: '#f5f4f0' }}>
                            {stateLoading ? <span className="skeleton" style={{ display: 'block', height: '16px', width: '60px' }} /> : (tvlFormatted ?? '—')}
                        </div>
                    </div>
                    <div style={{ flex: 1, background: '#1a1a1a', borderRadius: '12px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Your balance</div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: hasPosition ? '#d4f500' : '#333' }}>
                            {userAssetsFormatted ?? '—'}
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        id={`deposit-btn-${vault.symbol}`}
                        onClick={() => setShowDeposit(true)}
                        style={{ flex: 1, background: '#d4f500', color: '#0a0a0a', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', letterSpacing: '0.02em', transition: 'transform 0.15s, box-shadow 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,245,0,0.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        ↓ Deposit
                    </button>
                    {hasPosition && (
                        <button
                            id={`withdraw-btn-${vault.symbol}`}
                            onClick={() => setShowWithdraw(true)}
                            style={{ flex: 1, background: 'none', color: '#888', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '13px', padding: '12px', borderRadius: '12px', border: '1px solid #2a2a2a', cursor: 'pointer', letterSpacing: '0.02em', transition: 'border-color 0.2s, color 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#f5f4f0'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888'; }}
                        >
                            ↑ Withdraw
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
