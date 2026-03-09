'use client';

import { useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useUserHistory } from '@yo-protocol/react';
import type { VaultId } from '@yo-protocol/core';
import type { UserHistoryItem } from '@yo-protocol/core';
import { AppHeader } from '@/components/shared/AppHeader';
import { VAULT_META } from '@/lib/constants';

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_VAULT_IDS: VaultId[] = ['yoUSD', 'yoEUR', 'yoUSDT', 'yoETH', 'yoBTC', 'yoGOLD'];
const S = { syne: { fontFamily: 'Syne, sans-serif' } as React.CSSProperties, border: '1px solid #1e1e1e' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(ts: number | string) {
    const d = new Date(typeof ts === 'number' ? ts * 1000 : ts);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function txTypeLabel(type: string) {
    const t = type.toLowerCase();
    if (t.includes('deposit') || t.includes('mint')) return { label: 'Deposit', color: '#d4f500', icon: '↓', bg: 'rgba(212,245,0,0.12)' };
    if (t.includes('redeem') || t.includes('withdraw') || t.includes('burn')) return { label: 'Withdraw', color: '#ff8c5a', icon: '↑', bg: 'rgba(255,140,90,0.12)' };
    if (t.includes('yield') || t.includes('reward') || t.includes('claim')) return { label: 'Yield', color: '#00e87a', icon: '✦', bg: 'rgba(0,232,122,0.12)' };
    return { label: type, color: '#888', icon: '·', bg: 'rgba(136,136,136,0.12)' };
}

const shortTx = (hash: string) => `${hash.slice(0, 6)}...${hash.slice(-4)}`;

// ─── Single vault rows ────────────────────────────────────────────────────────
function VaultHistoryRows({ vaultId, address }: { vaultId: VaultId; address?: `0x${string}` }) {
    const meta = VAULT_META[vaultId];
    const { history, isLoading } = useUserHistory(vaultId, address, { limit: 50, enabled: !!address });

    if (isLoading) return (
        <>
            {[0, 1, 2].map(i => (
                <tr key={i}>
                    {[1, 2, 3, 4, 5].map(j => (
                        <td key={j} style={{ padding: '14px 20px' }}>
                            <div style={{ height: 14, borderRadius: 4, background: 'linear-gradient(90deg,#1a1a1a 25%,#222 50%,#1a1a1a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );

    if (!history || history.length === 0) return null;

    return (
        <>
            {history.map((item: UserHistoryItem, idx: number) => {
                const tx = txTypeLabel(item.type);
                const explorerBase = (item.network ?? '').toLowerCase().includes('ethereum') ? 'https://etherscan.io/tx/' : 'https://basescan.org/tx/';
                return (
                    <tr key={`${vaultId}-${idx}`} style={{ borderBottom: '1px solid #141414', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#111')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: tx.bg, color: tx.color, fontSize: 13, fontWeight: 700 }}>{tx.icon}</div>
                                <div>
                                    <div style={{ ...S.syne, fontSize: 12, fontWeight: 700, color: tx.color }}>{tx.label}</div>
                                    <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>{item.network}</div>
                                </div>
                            </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                            <div style={{ ...S.syne, fontSize: 12, fontWeight: 700, color: '#f5f4f0' }}>{vaultId}</div>
                            <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>{meta?.underlyingSymbol}</div>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <div style={{ ...S.syne, fontSize: 13, fontWeight: 700, color: '#f5f4f0' }}>
                                {item.assets?.formatted ?? '—'} <span style={{ color: '#555', fontWeight: 400 }}>{meta?.underlyingSymbol}</span>
                            </div>
                            <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>{item.shares?.formatted ?? '—'} {vaultId}</div>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <div style={{ fontSize: 12, color: '#888' }}>{formatDate(item.blockTimestamp)}</div>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <a href={`${explorerBase}${item.transactionHash}`} target="_blank" rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#555', textDecoration: 'none', fontFamily: 'monospace', transition: 'color 0.2s' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#d4f500')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
                                {shortTx(item.transactionHash)} ↗
                            </a>
                        </td>
                    </tr>
                );
            })}
        </>
    );
}

// ─── Connect button (empty state) ─────────────────────────────────────────────
function ConnectWalletBtn() {
    const { connect } = useConnect();
    return (
        <button onClick={() => connect({ connector: injected() })}
            style={{ background: '#d4f500', color: '#0a0a0a', ...S.syne, fontWeight: 800, fontSize: 13, padding: '12px 28px', borderRadius: 100, border: 'none', letterSpacing: '0.02em', marginTop: 24, transition: 'transform 0.15s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(212,245,0,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
            Connect wallet
        </button>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function HistoryDashboard() {
    const { address, isConnected } = useAccount();
    const [filterVault, setFilterVault] = useState<VaultId | 'all'>('all');
    const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdraw'>('all');

    const displayVaults = filterVault === 'all' ? ALL_VAULT_IDS : [filterVault];

    return (
        <>
            <style>{`
                @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.6} }
                @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }
            `}</style>

            <AppHeader active="History" />

            <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f5f4f0', paddingTop: 65, fontFamily: 'DM Sans, sans-serif' }}>
                {!isConnected ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', textAlign: 'center', gap: 16 }}>
                        <img src="/yo/yo_round.svg" alt="History" style={{ width: 48, height: 48 }} />
                        <div style={{ ...S.syne, fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Connect your wallet</div>
                        <div style={{ fontSize: 14, color: '#555', maxWidth: 320, lineHeight: 1.7 }}>
                            Connect your wallet to see your full transaction history across all YO Protocol vaults.
                        </div>
                        <ConnectWalletBtn />
                    </div>
                ) : (
                    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 96px' }}>
                        <div style={{ marginBottom: 32 }}>
                            <div style={{ fontSize: 11, color: '#d4f500', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 500 }}>Transaction History</div>
                            <h1 style={{ ...S.syne, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 6 }}>Your activity ✦</h1>
                            <div style={{ fontSize: 12, color: '#555' }}>All deposits and withdrawals across YO Protocol vaults</div>
                        </div>

                        {/* Filters */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: 4, background: '#141414', border: S.border, borderRadius: 100, padding: 4 }}>
                                {(['all', ...ALL_VAULT_IDS] as const).map(v => {
                                    const active = filterVault === v;
                                    return <button key={v} onClick={() => setFilterVault(v)}
                                        style={{ fontSize: 11, padding: '5px 12px', borderRadius: 100, background: active ? '#f5f4f0' : 'none', color: active ? '#0a0a0a' : '#555', border: 'none', ...S.syne, fontWeight: 700, transition: 'all 0.2s' }}>
                                        {v === 'all' ? 'All vaults' : v}
                                    </button>;
                                })}
                            </div>
                            <div style={{ display: 'flex', gap: 4, background: '#141414', border: S.border, borderRadius: 100, padding: 4 }}>
                                {(['all', 'deposit', 'withdraw'] as const).map(t => {
                                    const active = filterType === t;
                                    return <button key={t} onClick={() => setFilterType(t)}
                                        style={{ fontSize: 11, padding: '5px 12px', borderRadius: 100, background: active ? '#1e1e1e' : 'none', color: active ? '#f5f4f0' : '#555', border: active ? '1px solid #2a2a2a' : '1px solid transparent', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}>
                                        {t === 'all' ? 'All types' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
                                    </button>;
                                })}
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{ border: S.border, borderRadius: 20, overflow: 'hidden', background: '#0d0d0d' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #1e1e1e', background: '#111' }}>
                                        {['Type', 'Vault', 'Amount', 'Date', 'Tx hash'].map((h, i) => (
                                            <th key={h} style={{ padding: '12px 20px', fontSize: 10, color: '#555', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: i >= 2 ? 'right' : 'left', fontFamily: 'DM Sans, sans-serif' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayVaults.map(vid => <VaultHistoryRows key={vid} vaultId={vid} address={address} />)}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ marginTop: 20, fontSize: 11, color: '#333', textAlign: 'center' }}>
                            Showing up to 50 transactions per vault · Data from YO Protocol API
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
