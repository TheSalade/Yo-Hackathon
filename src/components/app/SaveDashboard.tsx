'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useChainId, useSwitchChain, useBalance, useReadContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { type VaultId, type VaultConfig, getAllVaults } from '@yo-protocol/core';
import {
    useVaultState,
    useVaults,
    useVaultHistory,
    usePreviewDeposit,
    useAllowance,
    useApprove,
    useDeposit,
    useRedeem,
    useUserPosition,
    useTokenBalance,
} from '@yo-protocol/react';
import Link from 'next/link';
import { AppHeader } from '@/components/shared/AppHeader';
import { YOdAnimation } from './YOdAnimation';
import { VAULT_META } from '@/lib/constants';

// Helper to cleanly format viem errors
const parseError = (e: any): string => {
    if (!e || !e.message) return 'Transaction failed';
    const msg = e.message.toLowerCase();
    if (msg.includes('user rejected') || msg.includes('user denied')) return 'User rejected the request.';
    // If it's a viem error string, try to extract just the first sentence or the "Details:" line
    if (msg.includes('details:')) {
        const detailsMatch = e.message.match(/Details:\s*([^\n]+)/);
        if (detailsMatch && detailsMatch[1]) {
            const detailStr = detailsMatch[1].toLowerCase();
            if (detailStr.includes('user rejected') || detailStr.includes('user denied')) return 'User rejected the request.';
            return detailsMatch[1];
        }
    }
    const clean = e.message.split('Request Arguments:')[0].split('\n')[0].trim();
    return clean || 'Transaction failed';
};

// ─── Types ────────────────────────────────────────────────────────────────────

type TxStep = 'idle' | 'approving' | 'depositing' | 'withdrawing' | 'success' | 'error';

interface VaultDef {
    id: VaultId;
    label: string;         // sidebar short label e.g. "USD"
    asset: string;         // underlying symbol e.g. "USDC"
    chain: string;
    iconKey: string;       // matches CSS class suffix
    symbol: string;        // currency prefix e.g. "$"
}

// ─── Vault catalogue (matches the HTML reference exactly) ─────────────────────

const CATEGORIES: { title: string; vaults: VaultDef[] }[] = [
    {
        title: 'Stablecoins',
        vaults: [
            { id: 'yoUSD', label: 'USD', asset: 'USDC', chain: 'Base', iconKey: 'usd', symbol: '$' },
            { id: 'yoEUR', label: 'EUR', asset: 'EURC', chain: 'Base', iconKey: 'eur', symbol: '€' },
            { id: 'yoUSDT', label: 'USDT', asset: 'USDT', chain: 'Ethereum', iconKey: 'usdt', symbol: '₮' },
        ],
    },
    {
        title: 'Crypto',
        vaults: [
            { id: 'yoETH', label: 'ETH', asset: 'WETH', chain: 'Ethereum, Base', iconKey: 'eth', symbol: 'Ξ' },
            { id: 'yoBTC', label: 'BTC', asset: 'cbBTC', chain: 'Base', iconKey: 'btc', symbol: '₿' },
            { id: 'yoGOLD', label: 'GOLD', asset: 'XAUt', chain: 'Ethereum', iconKey: 'gold', symbol: '🥇' },
        ],
    },
];

const ALL_VAULTS: VaultDef[] = CATEGORIES.flatMap(c => c.vaults);

// ─── Custom Tooltip for Chart ──────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label, metric }: any) => {
    if (active && payload && payload.length) {
        const val = payload[0].value;
        const formatted = metric === 'APY'
            ? `${val.toFixed(2)}%`
            : `$${val >= 1e6 ? (val / 1e6).toFixed(2) + 'M' : val >= 1e3 ? (val / 1e3).toFixed(2) + 'K' : val.toFixed(2)}`;

        return (
            <div style={{ background: '#1a1a1a', border: '1px solid #333', padding: '8px 12px', borderRadius: 8, fontSize: 12, color: '#f5f4f0', fontFamily: 'Syne, sans-serif' }}>
                <div style={{ color: '#888', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 700, color: payload[0].color }}>
                    {formatted}
                </div>
            </div>
        );
    }
    return null;
};

// ─── Custom RAF cursor (matches HTML cursor logic) ────────────────────────────

function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let mx = 0, my = 0, rx = 0, ry = 0, af = 0;
        const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
        document.addEventListener('mousemove', onMove);
        const loop = () => {
            if (dotRef.current) {
                dotRef.current.style.left = `${mx - 6}px`;
                dotRef.current.style.top = `${my - 6}px`;
            }
            rx += (mx - rx) * 0.12;
            ry += (my - ry) * 0.12;
            if (ringRef.current) {
                ringRef.current.style.left = `${rx - 18}px`;
                ringRef.current.style.top = `${ry - 18}px`;
            }
            af = requestAnimationFrame(loop);
        };
        af = requestAnimationFrame(loop);
        return () => { document.removeEventListener('mousemove', onMove); cancelAnimationFrame(af); };
    }, []);

    return (
        <>
            <div ref={dotRef} style={{ position: 'fixed', width: 12, height: 12, background: '#d4f500', borderRadius: '50%', pointerEvents: 'none', zIndex: 9999, mixBlendMode: 'difference' }} />
            <div ref={ringRef} style={{ position: 'fixed', width: 36, height: 36, border: '1px solid rgba(212,245,0,0.4)', borderRadius: '50%', pointerEvents: 'none', zIndex: 9998, transition: 'left 0.4s cubic-bezier(0.23,1,0.32,1),top 0.4s cubic-bezier(0.23,1,0.32,1)' }} />
        </>
    );
}

// ─── APY Badge for vault sidebar ─────────────────────────────────────────────

function VaultApyBadge({ id }: { id: VaultId }) {
    const meta = VAULT_META[id];
    const { vaults } = useVaults();

    // yield['7d'] is a decimal ratio (e.g. '0.0555' = 5.55%)
    // tvl.formatted is the TVL in USD
    const statItem = vaults?.find(v => v.id === id);
    const yieldRaw = statItem?.yield?.['7d'] ?? statItem?.yield?.['30d'];
    const apy = yieldRaw ? Number(yieldRaw).toFixed(2) : (meta?.apy ?? '—');

    return <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: '#00e87a' }}>{apy}%</span>;
}

// ─── Connect button (used in deposit panel when wallet not connected) ─────────

export function SaveDashboard() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    // Active vault
    const [activeId, setActiveId] = useState<VaultId>('yoUSD');
    const active = ALL_VAULTS.find(v => v.id === activeId)!;
    const meta = VAULT_META[activeId];

    // Chart
    const [chartTab, setChartTab] = useState('30D');
    const [metricTab, setMetricTab] = useState<'APY' | 'TVL'>('APY');

    // Panel
    const [panelMode, setPanelMode] = useState<'deposit' | 'withdraw'>('deposit');

    // We will parse `amountStr` later after fetching `vaultState` for decimals.
    const [amountStr, setAmountStr] = useState('');
    const amountNum = parseFloat(amountStr) || 0;

    // ── SDK hooks ──
    // useVaults: all vaults summary data (APY, TVL) from the API
    // yield['7d'] is a decimal ratio — multiply by 100 to get %
    // tvl.formatted gives the formatted TVL string
    const { vaults } = useVaults();
    const statItem = vaults?.find(v => v.id === activeId);
    const yieldRaw = statItem?.yield?.['7d'] ?? statItem?.yield?.['30d'];
    const activeApyNum = yieldRaw ? Number(yieldRaw) : meta.apy;
    const activeApyStr = activeApyNum.toFixed(2);

    // useVaultState: on-chain vault data (totalAssets, assetDecimals)
    const { vaultState, isLoading: tvlLoading, refetch: refetchVaultState } = useVaultState(activeId);

    // useVaultHistory: APY & TVL timeseries for the chart
    const { yieldHistory, tvlHistory } = useVaultHistory(activeId);

    // userPos initialization is moved below to safely consume resolvedChainId and vaultAddr
    // Token addresses — use Base (8453) first, fallback to Ethereum mainnet (1)
    // We get them from the SDK vault config via getAllVaults()
    const [tokenAddr, setTokenAddr] = useState<`0x${string}`>('0x');
    const [vaultAddr, setVaultAddr] = useState<`0x${string}`>('0x');
    const [supportedChains, setSupportedChains] = useState<number[]>([]);
    const [resolvedChainId, setResolvedChainId] = useState<number | undefined>(undefined);

    useEffect(() => {
        const cfg = getAllVaults().find(v => v.symbol === activeId);
        if (!cfg) return;
        const chains = cfg.chains as number[];
        setSupportedChains(chains);

        // Prefer current chain if supported, else fallback to the target chain (Base > first available)
        const fallbackChain = chains.includes(8453) ? 8453 : chains[0];
        const resolvedChain = chains.includes(chainId) ? chainId : fallbackChain;
        setResolvedChainId(resolvedChain);

        const ta = (cfg.underlying.address[resolvedChain as keyof typeof cfg.underlying.address] ?? '0x') as `0x${string}`;
        const va = cfg.address as `0x${string}`;
        setTokenAddr(ta);
        setVaultAddr(va);
    }, [activeId, chainId]);

    // Compute decimals and parsed amounts safely
    const decimals = vaultState?.assetDecimals ?? 6;
    const parsedAmt = amountNum > 0 ? parseUnits(amountStr, decimals) : undefined;

    const { shares: previewShares } = usePreviewDeposit(activeId, parsedAmt);

    // useUserPosition: Dedicated SDK hook to fetch user's position in this specific vault.
    const { position: activePos, refetch: refetchUserPos } = useUserPosition(activeId, address, {
        enabled: !!address && !!resolvedChainId
    });

    const userPos = {
        shares: activePos?.shares ?? 0n,
        assets: activePos?.assets ?? 0n
    };

    // useTokenBalance: Dedicated SDK hook to fetch user's underlying token balance.
    const { balance: tokenBalance, refetch: refetchTokenBalance } = useTokenBalance(
        tokenAddr !== '0x' ? tokenAddr : undefined,
        address,
        {
            enabled: tokenAddr !== '0x' && !!resolvedChainId && !!address
        }
    );

    // Evaluate displayable balance string and exact number
    const availableBalanceLabel = panelMode === 'deposit'
        ? (tokenBalance ? Number(formatUnits(tokenBalance.balance, tokenBalance.decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 }) : '—')
        : (userPos.assets > 0n ? Number(formatUnits(userPos.assets, decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 }) : '—');

    const maxNumberValueStr = panelMode === 'deposit'
        ? (tokenBalance ? formatUnits(tokenBalance.balance, tokenBalance.decimals) : '0')
        : (userPos.assets > 0n ? formatUnits(userPos.assets, decimals) : '0');

    // removed duplicate hooks because they have been moved above.

    const { allowance: allowanceRes } = useAllowance(tokenAddr, vaultAddr, address);
    const currentAllowance = allowanceRes?.allowance ?? BigInt(0);
    const needsApproval = !!parsedAmt && currentAllowance < parsedAmt;

    // ── TX state ──
    const [txStep, setTxStep] = useState<TxStep>('idle');
    const [errMsg, setErrMsg] = useState('');
    const [yodActive, setYodActive] = useState(false);
    const [yodAmt, setYodAmt] = useState('');

    const { approve } = useApprove({ token: tokenAddr, spender: vaultAddr, onError: (e: any) => { setErrMsg(parseError(e)); setTxStep('error'); } });
    const { deposit } = useDeposit({ vault: activeId, onError: (e: any) => { setErrMsg(parseError(e)); setTxStep('error'); } });
    const { redeem } = useRedeem({ vault: activeId, onError: (e: any) => { setErrMsg(parseError(e)); setTxStep('error'); } });
    const handleDeposit = useCallback(async () => {
        if (!parsedAmt) return;
        setErrMsg('');
        try {
            if (needsApproval) {
                setTxStep('approving');
                await approve(parsedAmt);
            }
            setTxStep('depositing');
            await deposit({ token: tokenAddr, amount: parsedAmt, chainId });

            // On Success
            setYodAmt(amountStr);
            setYodActive(true);
            setTxStep('idle'); // Changed from 'success' to 'idle' for consistency with withdraw
            setAmountStr('');
            refetchUserPos();
            refetchVaultState();
            refetchTokenBalance();
        } catch (e: unknown) {
            setErrMsg(parseError(e));
            setTxStep('error');
        }
    }, [parsedAmt, needsApproval, approve, deposit, tokenAddr, chainId, amountStr, refetchUserPos, refetchTokenBalance]);

    const handleWithdraw = useCallback(async () => {
        if (!userPos.shares) return;
        setErrMsg('');
        try {
            setTxStep('withdrawing');
            await redeem(userPos.shares);

            // On Success
            setTxStep('idle');
            setAmountStr('');
            refetchUserPos();
            refetchVaultState();
            refetchTokenBalance();
        } catch (e: any) {
            setErrMsg(parseError(e));
            setTxStep('error');
        }
    }, [userPos.shares, redeem, refetchUserPos, refetchVaultState, refetchTokenBalance]);

    // ── Formatted display values ──
    // TVL: use the API-provided tvl.formatted from useVaults when available,
    // fall back to on-chain totalAssets conversion
    const tvlFmt = (() => {
        // Prefer API TVL formatted (already in USD)
        if (statItem?.tvl?.formatted) {
            const n = Number(statItem.tvl.formatted);
            if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
            if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
            return `$${n.toFixed(2)}`;
        }
        // Fallback: on-chain totalAssets
        if (tvlLoading || !vaultState) return '—';
        const n = Number(formatUnits(vaultState.totalAssets, vaultState.assetDecimals));
        if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
        return `$${n.toFixed(2)}`;
    })();

    // User position from useUserPosition
    const userAssets = (userPos && vaultState)
        ? Number(formatUnits(userPos.assets, vaultState.assetDecimals))
        : 0;
    const userShares = userPos
        ? Number(formatUnits(userPos.shares, decimals))
        : 0;

    // ── Chart Data Calculation ──
    const chartData = (() => {
        const history = metricTab === 'APY' ? yieldHistory : tvlHistory;
        if (!history || history.length === 0) return [];
        const days = chartTab === '7D' ? 7 : chartTab === '30D' ? 30 : 90;
        return history.slice(-days).map(d => ({
            date: new Date(d.timestamp * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
            value: metricTab === 'APY' ? Number(d.value) * 100 : Number(d.value)
        }));
    })();
    const chartColor = metricTab === 'APY' ? '#00e87a' : '#d4f500';

    const previewYoTokens = previewShares
        ? Number(formatUnits(previewShares, decimals)).toFixed(4)
        : (amountNum * 0.9997).toFixed(4);

    const dailyYield = amountNum > 0 ? (amountNum * activeApyNum / 100 / 365).toFixed(4) : '—';
    const yearlyYield = amountNum > 0 ? (amountNum * activeApyNum / 100).toFixed(2) : '—';

    const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '—';

    // Determine chain status
    const isWrongChain = supportedChains.length > 0 && !supportedChains.includes(chainId);

    // Switch vault
    const selectVault = (v: VaultDef) => {
        setActiveId(v.id);
        setPanelMode('deposit');
        setAmountStr('');
        setTxStep('idle');
        setErrMsg('');

        // Ensure synchronous execution for wallet popup (avoids Rabby/MetaMask anti-spam blocks)
        const chainMapping: Record<string, number> = {
            'Base': 8453,
            'Ethereum': 1
        };
        const supportedChainsStr = v.chain.split(', ');
        const supportedChainIds = supportedChainsStr.map(c => chainMapping[c]).filter(Boolean);

        if (supportedChainIds.length > 0 && !supportedChainIds.includes(chainId)) {
            const targetChain = supportedChainIds.includes(8453) ? 8453 : supportedChainIds[0];
            if (switchChain) {
                switchChain({ chainId: targetChain as 1 | 8453 }, { onError: () => { } });
            }
        }
    };

    // ── Icon CSS map ──
    const IC: Record<string, { bg: string; color: string }> = {
        usd: { bg: 'rgba(212,245,0,0.12)', color: '#d4f500' },
        eth: { bg: 'rgba(100,150,255,0.12)', color: '#7b9fff' },
        btc: { bg: 'rgba(255,160,50,0.12)', color: '#ffa032' },
        eur: { bg: 'rgba(100,220,200,0.12)', color: '#64dcc8' },
        gold: { bg: 'rgba(255,200,50,0.12)', color: '#ffc832' },
        usdt: { bg: 'rgba(80,200,120,0.12)', color: '#50c878' },
    };
    const ic = (key: string) => IC[key] ?? IC.usd;

    // ── Shared sub-styles ──
    const S = {
        syne: { fontFamily: 'Syne, sans-serif' } as React.CSSProperties,
        dm: { fontFamily: 'DM Sans, sans-serif' } as React.CSSProperties,
        border: '1px solid #1e1e1e',
    };

    const btnLabel = txStep === 'approving' ? 'Approving...'
        : txStep === 'depositing' ? 'Depositing...'
            : txStep === 'withdrawing' ? 'Withdrawing...'
                : panelMode === 'deposit' ? 'YO my funds'
                    : 'Withdraw funds';

    const isInsufficient = parsedAmt && (
        panelMode === 'deposit'
            ? parsedAmt > (tokenBalance?.balance ?? 0n)
            : parsedAmt > userPos.assets
    );

    const btnDisabled = !parsedAmt || ['approving', 'depositing', 'withdrawing'].includes(txStep) || !!isInsufficient;
    const finalBtnLabel = isInsufficient ? 'Insufficient balance' : btnLabel;

    return (
        <>
            {/* ── Global style injection ── */}
            <style>{`
        body { cursor: none !important; }
        body::before {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 1; opacity: 0.6;
        }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.6} }
        @keyframes yoSpin { to { transform: scale(1) rotate(0deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }
        .vault-item:hover { background: #141414 !important; border-color: #1e1e1e !important; }
        .chart-tab:hover:not(.ctab-active) { color: #f5f4f0 !important; }
        .quick-btn:hover { border-color: #d4f500 !important; color: #d4f500 !important; background: rgba(212,245,0,0.05) !important; }
        .deposit-btn:hover:not(:disabled) { transform: scale(1.02) !important; box-shadow: 0 8px 32px rgba(212,245,0,0.25) !important; }
        .deposit-btn:active:not(:disabled) { transform: scale(0.98) !important; }
        .deposit-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent); transform:translateX(-100%); transition:transform 0.6s; }
        .deposit-btn:hover::after { transform: translateX(100%); }
        .panel-tab:hover { color: #f5f4f0 !important; }
        .nav-tab:hover { color: #f5f4f0 !important; }
        .max-btn:hover { opacity: 0.7 !important; }
      `}</style>

            <CustomCursor />

            <YOdAnimation
                active={yodActive}
                asset={active.asset}
                vaultId={active.id}
                amount={yodAmt}
                onDone={() => { setYodActive(false); setTxStep('idle'); }}
            />

            <AppHeader active="Save" />


            {/* ════════════ 3-COL LAYOUT ════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 340px', minHeight: '100vh', paddingTop: 65, position: 'relative', zIndex: 2 }}>

                {/* ━━━ SIDEBAR ━━━ */}
                <aside style={{ borderRight: S.border, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 8, position: 'sticky', top: 65, height: 'calc(100vh - 65px)', overflowY: 'auto' }}>
                    {CATEGORIES.map((cat, ci) => (
                        <div key={cat.title}>
                            <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 4, marginTop: ci === 0 ? 0 : 16 }}>
                                {cat.title}
                            </div>
                            {cat.vaults.map(v => {
                                const isActive = v.id === activeId;
                                const col = ic(v.iconKey);
                                return (
                                    <div
                                        key={v.id}
                                        className="vault-item"
                                        onClick={() => selectVault(v)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 14px', borderRadius: 14,
                                            border: isActive ? '1px solid #2a2a2a' : '1px solid transparent',
                                            background: isActive ? '#181818' : 'transparent',
                                            cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                                        }}
                                    >
                                        {/* Yellow active marker */}
                                        {isActive && (
                                            <div style={{ position: 'absolute', left: -1, top: '20%', bottom: '20%', width: 2, background: '#d4f500', borderRadius: '0 2px 2px 0' }} />
                                        )}
                                        {/* Icon */}
                                        <img src={`/yo/${v.id}.svg`} alt={v.id} style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ ...S.syne, fontSize: 13, fontWeight: 700, color: '#f5f4f0' }}>{v.id}</div>
                                            <div style={{ fontSize: 10, color: '#555' }}>{v.asset} · {v.chain}</div>
                                        </div>
                                        {/* APY */}
                                        <VaultApyBadge id={v.id} />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </aside>

                {/* ━━━ MAIN ━━━ */}
                <main style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 28, overflowY: 'auto' }}>

                    {/* Vault hero */}
                    <div style={{ background: 'linear-gradient(135deg,#141414,#111)', border: S.border, borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden' }}>
                        {/* Glow */}
                        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, background: 'radial-gradient(circle,rgba(212,245,0,0.08),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

                        {/* Top row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <img src={`/yo/${active.id}.svg`} alt={active.id} style={{ width: 52, height: 52, borderRadius: 16 }} />
                                <div>
                                    <div style={{ ...S.syne, fontSize: 28, fontWeight: 800, letterSpacing: '-1px' }}>{active.id}</div>
                                    <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{active.asset} deposited, yield accrued in {active.asset} — {active.chain}</div>
                                </div>
                            </div>
                            {/* Live badge */}
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.2)', color: '#00e87a', fontSize: 11, ...S.syne, fontWeight: 700, padding: '6px 14px', borderRadius: 100 }}>
                                <div style={{ width: 5, height: 5, background: '#00e87a', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                                Live
                            </div>
                        </div>

                        {/* Stats grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
                            {[
                                { label: 'Current APY', val: `${activeApyStr}%`, color: '#00e87a', sub: '30-day average' },
                                { label: 'Total Value Locked', val: tvlFmt, color: '#d4f500', sub: 'across all depositors' },
                                {
                                    label: 'Your position',
                                    val: userAssets > 0 ? `${active.symbol}${userAssets.toLocaleString(undefined, { maximumFractionDigits: 4 })}` : '—',
                                    color: '#f5f4f0',
                                    sub: userAssets > 0 ? `earning ${activeApyStr}% APY` : 'No deposit yet',
                                },
                            ].map(s => (
                                <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: S.border, borderRadius: 16, padding: 18 }}>
                                    <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
                                    <div style={{ ...S.dm, fontSize: 20, fontWeight: 700, letterSpacing: '-0.2px', color: s.color }}>{s.val}</div>
                                    <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{s.sub}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Metrics Chart */}
                    <div style={{ background: '#141414', border: S.border, borderRadius: 20, padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div style={{ ...S.syne, fontSize: 14, fontWeight: 700 }}>History</div>
                                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8 }}>
                                    {(['APY', 'TVL'] as const).map(m => (
                                        <button key={m}
                                            onClick={() => setMetricTab(m)}
                                            style={{
                                                fontSize: 11, padding: '4px 10px', borderRadius: 6,
                                                background: metricTab === m ? '#333' : 'transparent',
                                                color: metricTab === m ? '#fff' : '#888',
                                                cursor: 'pointer', ...S.dm, fontWeight: 600, border: 'none', transition: 'all 0.2s'
                                            }}>
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 4 }}>
                                {['7D', '30D', '90D'].map(t => {
                                    const a = chartTab === t;
                                    return (
                                        <button key={t} className={`chart-tab ${a ? 'ctab-active' : ''}`}
                                            onClick={() => setChartTab(t)}
                                            style={{ fontSize: 11, padding: '5px 12px', borderRadius: 100, background: a ? '#1e1e1e' : 'none', border: `1px solid ${a ? '#1e1e1e' : 'transparent'}`, color: a ? '#f5f4f0' : '#555', cursor: 'pointer', ...S.dm, transition: 'all 0.2s' }}>
                                            {t}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div style={{ height: 140 }}>
                            <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                                <AreaChart data={chartData} style={{ outline: 'none' }}>
                                    <XAxis dataKey="date" hide />
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={chartColor} stopOpacity={0.2} />
                                            <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip content={<ChartTooltip metric={metricTab} />} cursor={{ stroke: '#333', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={chartColor}
                                        strokeWidth={2}
                                        fill="url(#chartGradient)"
                                        isAnimationActive={false}
                                        style={{ outline: 'none' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Your Position */}
                    <div style={{ background: '#141414', border: S.border, borderRadius: 20, padding: 24 }}>
                        <div style={{ ...S.syne, fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Your Position</div>
                        {userAssets > 0 ? (
                            <>
                                {[
                                    ['Deposited', `${userAssets.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${active.asset}`, '#f5f4f0'],
                                    ['yoTokens held', `${userShares.toFixed(4)} ${active.id}`, '#f5f4f0'],
                                    ['Current value', `${active.symbol}${userAssets.toLocaleString(undefined, { maximumFractionDigits: 4 })}`, '#f5f4f0'],
                                    ['Current APY', `${activeApyStr}%`, '#00e87a'],
                                ].map(([k, v, c], i, arr) => (
                                    <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? S.border : 'none' }}>
                                        <span style={{ fontSize: 12, color: '#888' }}>{k}</span>
                                        <span style={{ ...S.syne, fontSize: 13, fontWeight: 700, color: c as string }}>{v}</span>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 24, color: '#555', fontSize: 13 }}>
                                No deposit yet. Start saving to see your position here.
                            </div>
                        )}
                    </div>
                </main>

                {/* ━━━ RIGHT PANEL ━━━ */}
                <aside style={{ borderLeft: S.border, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 65, height: 'calc(100vh - 65px)', overflowY: 'auto' }}>

                    <div style={{ ...S.syne, fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>Deposit</div>

                    {/* Deposit / Withdraw tabs */}
                    <div style={{ display: 'flex', gap: 4, background: '#141414', border: S.border, borderRadius: 100, padding: 4 }}>
                        {(['deposit', 'withdraw'] as const).map(m => {
                            const a = panelMode === m;
                            return (
                                <button key={m} className="panel-tab"
                                    onClick={() => { setPanelMode(m); setAmountStr(''); setTxStep('idle'); setErrMsg(''); }}
                                    style={{ flex: 1, textAlign: 'center', fontSize: 12, ...S.syne, fontWeight: 700, padding: 8, borderRadius: 100, border: 'none', background: a ? '#f5f4f0' : 'none', color: a ? '#0a0a0a' : '#555', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize' }}>
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </button>
                            );
                        })}
                    </div>

                    {/* Amount input */}
                    <div>
                        <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.05em', marginBottom: 10, textTransform: 'uppercase' }}>Amount</div>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#141414', border: S.border, borderRadius: 16, padding: '16px 18px', transition: 'border-color 0.2s' }}
                            onFocus={e => (e.currentTarget.style.borderColor = '#d4f500')}
                            onBlur={e => (e.currentTarget.style.borderColor = '#1e1e1e')}>
                            <input
                                type="number"
                                placeholder="0"
                                value={amountStr}
                                onChange={e => setAmountStr(e.target.value)}
                                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', ...S.syne, fontSize: 24, fontWeight: 800, color: '#f5f4f0', letterSpacing: '-0.5px', width: 0, minWidth: 0 }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 100, padding: '6px 12px', ...S.syne, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                <img src={`/tokens/${active.asset.toLowerCase()}.svg`} alt={active.asset} style={{ width: 18, height: 18, borderRadius: '50%' }} />
                                {active.asset}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555', marginTop: 10 }}>
                            <span>Balance: <strong style={{ color: '#f5f4f0' }}>{availableBalanceLabel} {panelMode === 'deposit' ? active.asset : active.symbol}</strong></span>
                            <button className="max-btn" onClick={() => setAmountStr(maxNumberValueStr)} style={{ color: '#d4f500', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', ...S.dm, transition: 'opacity 0.2s' }}>MAX</button>
                        </div>
                    </div>

                    {/* Quick percentages */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[25, 50, 75, 100].map((pct) => (
                            <button key={pct} className="quick-btn" onClick={() => {
                                const maxNum = parseFloat(maxNumberValueStr);
                                if (isNaN(maxNum) || maxNum <= 0) return;
                                const valStr = (maxNum * (pct / 100)).toString();
                                // if there's e notations from toString due to super small numbers, we parse it nicely
                                // but for simplicity formatUnits was already done, so we can just set string
                                setAmountStr(pct === 100 ? maxNumberValueStr : valStr);
                            }}
                                style={{ flex: 1, background: '#141414', border: S.border, borderRadius: 10, padding: 9, fontSize: 12, ...S.syne, fontWeight: 700, color: '#888', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                                {pct === 100 ? 'Max' : `${pct}%`}
                            </button>
                        ))}
                    </div>

                    {/* Preview box (only when amount > 0) */}
                    {amountNum > 0 && (
                        <div style={{ background: 'rgba(212,245,0,0.04)', border: '1px solid rgba(212,245,0,0.12)', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { k: 'You deposit', v: `${amountNum.toLocaleString()} ${active.asset}`, green: false },
                                { k: 'You receive', v: `${previewYoTokens} ${active.id}`, green: false },
                            ].map(r => (
                                <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                    <span style={{ color: '#666' }}>{r.k}</span>
                                    <span style={{ ...S.syne, fontWeight: 700, color: '#f5f4f0' }}>{r.v}</span>
                                </div>
                            ))}
                            <div style={{ height: 1, background: 'rgba(212,245,0,0.08)' }} />
                            {[
                                { k: 'Est. daily yield', v: `+${active.symbol}${dailyYield}` },
                                { k: 'Est. yearly yield', v: `+${active.symbol}${yearlyYield}` },
                                { k: 'Exchange rate', v: `1 ${active.asset} = ${(0.9997).toFixed(4)} ${active.id}` },
                            ].map(r => (
                                <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                    <span style={{ color: '#666' }}>{r.k}</span>
                                    <span style={{ ...S.syne, fontWeight: 700, color: r.k.includes('yield') ? '#00e87a' : '#f5f4f0' }}>{r.v}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error message */}
                    {txStep === 'error' && errMsg && (
                        <div style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)', borderRadius: 12, padding: '12px 16px', color: '#ff6060', fontSize: 12 }}>
                            {errMsg}
                        </div>
                    )}

                    {/* Approval hint */}
                    {needsApproval && txStep === 'idle' && (
                        <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
                            Approval required before deposit
                        </div>
                    )}

                    {/* CTA button */}
                    {isWrongChain ? (
                        <button
                            className="deposit-btn"
                            onClick={() => switchChain({ chainId: supportedChains[0] as 1 | 8453 })}
                            style={{
                                width: '100%', padding: 16,
                                background: '#333', color: '#f5f4f0',
                                ...S.syne, fontWeight: 800, fontSize: 15,
                                border: '1px solid #555', borderRadius: 16, cursor: 'pointer',
                                letterSpacing: '0.02em', transition: 'all 0.2s', flexShrink: 0
                            }}>
                            Switch Network
                        </button>
                    ) : (
                        <button
                            className="deposit-btn"
                            disabled={btnDisabled}
                            onClick={panelMode === 'deposit' ? handleDeposit : handleWithdraw}
                            style={{
                                width: '100%', padding: 16,
                                background: '#d4f500', color: '#0a0a0a',
                                ...S.syne, fontWeight: 800, fontSize: 15,
                                border: 'none', borderRadius: 16, cursor: btnDisabled ? 'not-allowed' : 'pointer',
                                letterSpacing: '0.02em',
                                transition: 'transform 0.15s, box-shadow 0.2s',
                                position: 'relative', overflow: 'hidden',
                                opacity: btnDisabled ? 0.5 : 1,
                                flexShrink: 0
                            }}>
                            {finalBtnLabel}
                        </button>
                    )}

                    {/* Security note */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, color: '#444', lineHeight: 1.6 }}>
                        <span style={{ color: '#555', flexShrink: 0, marginTop: 1 }}></span>
                        <span>Your funds are secured by YO Protocol smart contracts, audited by independent security researchers. You can withdraw at any time.</span>
                    </div>

                </aside>
            </div>
        </>
    );
}
