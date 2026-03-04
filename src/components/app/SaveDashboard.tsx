'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { useRouter } from 'next/navigation';
import {
    useVaultState,
    useUserPosition,
    usePreviewDeposit,
    useAllowance,
    useApprove,
    useDeposit,
    useShareBalance,
    useRedeem,
} from '@yo-protocol/react';
import type { VaultId } from '@yo-protocol/core';
import { getAllVaults } from '@yo-protocol/core';
import { VAULT_META } from '@/lib/constants';
import Link from 'next/link';
import { createPortal } from 'react-dom';

// ─── Vault categories for sidebar ────────────────────────────────────────────
const SIDEBAR_VAULTS = [
    {
        category: 'Stablecoins',
        vaults: [
            { symbol: 'yoUSD', asset: 'USDC', chain: 'Base', iconClass: 'c-usd', label: 'USD' },
            { symbol: 'yoEUR', asset: 'EURC', chain: 'Base', iconClass: 'c-eur', label: 'EUR' },
            { symbol: 'yoUSDT', asset: 'USDT', chain: 'Ethereum', iconClass: 'c-usdt', label: 'UST' },
        ],
    },
    {
        category: 'Crypto',
        vaults: [
            { symbol: 'yoETH', asset: 'WETH', chain: 'Ethereum', iconClass: 'c-eth', label: 'ETH' },
            { symbol: 'yoBTC', asset: 'cbBTC', chain: 'Base', iconClass: 'c-btc', label: 'BTC' },
        ],
    },
    {
        category: 'Real World Assets',
        vaults: [
            { symbol: 'yoGOLD', asset: 'XAUt', chain: 'Ethereum', iconClass: 'c-gold', label: 'AU' },
        ],
    },
];

// ─── APY Chart ───────────────────────────────────────────────────────────────
function ApyChart({ seed }: { seed: number }) {
    const [paths, setPaths] = useState({ area: '', line: '' });

    useEffect(() => {
        const w = 600, h = 120, pts = 30;
        const vals: number[] = [];
        let v = 4.0 + seed * 0.5;
        for (let i = 0; i < pts; i++) {
            v += (Math.random() - 0.48) * 0.15;
            v = Math.max(3, Math.min(6, v));
            vals.push(v);
        }
        const min = Math.min(...vals) - 0.2;
        const max = Math.max(...vals) + 0.2;
        const px = (i: number) => (i / (pts - 1)) * w;
        const py = (val: number) => h - ((val - min) / (max - min)) * (h - 20) - 10;

        let d = `M ${px(0)} ${py(vals[0])}`;
        for (let i = 1; i < pts; i++) {
            const cx = (px(i) + px(i - 1)) / 2;
            d += ` C ${cx} ${py(vals[i - 1])}, ${cx} ${py(vals[i])}, ${px(i)} ${py(vals[i])}`;
        }
        setPaths({ area: d + ` L ${px(pts - 1)} ${h} L ${px(0)} ${h} Z`, line: d });
    }, [seed]);

    return (
        <svg viewBox="0 0 600 120" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e87a" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#00e87a" stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d={paths.area} fill="url(#cg)" />
            <path d={paths.line} fill="none" stroke="#00e87a" strokeWidth={1.5} strokeLinecap="round" />
        </svg>
    );
}

// ─── YO'd Overlay Portal ─────────────────────────────────────────────────────
function YodOverlay({ active, amount, asset, apy, onDone }: { active: boolean; amount: string; asset: string; apy: number; onDone: () => void }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (active) {
            const t = setTimeout(onDone, 3200);
            return () => clearTimeout(t);
        }
    }, [active, onDone]);

    if (!mounted) return null;

    return createPortal(
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.95)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 500, opacity: active ? 1 : 0, pointerEvents: active ? 'all' : 'none',
            transition: 'opacity 0.3s', backdropFilter: 'blur(20px)',
        }}>
            <style>{`
        @keyframes ringPulse { 0%,100%{box-shadow:0 0 0 0 rgba(212,245,0,0.1)} 50%{box-shadow:0 0 0 20px rgba(212,245,0,0)} }
        @keyframes yoSpin { to { transform: scale(1) rotate(0deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .yod-logo-animate { animation: yoSpin 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards; transform: scale(0) rotate(-180deg); }
        .yod-label-animate { opacity:0; animation: fadeUp 0.5s 0.7s forwards; }
        .yod-amount-animate { opacity:0; animation: fadeUp 0.5s 0.9s forwards; }
        .yod-sub-animate { opacity:0; animation: fadeUp 0.5s 1.1s forwards; }
      `}</style>
            <ParticlesCanvas active={active} />
            <div style={{
                width: 140, height: 140, borderRadius: '50%',
                border: '1px solid rgba(212,245,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'ringPulse 2s ease-in-out infinite',
            }}>
                {active && (
                    <div className="yod-logo-animate" style={{
                        fontFamily: 'Syne, sans-serif', fontSize: 48, fontWeight: 800, color: '#d4f500',
                    }}>YO</div>
                )}
            </div>
            <div className="yod-label-animate" style={{ fontSize: 13, color: '#666', marginTop: 24, letterSpacing: '0.05em' }}>
                Your funds have been
            </div>
            <div className="yod-amount-animate" style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: '#f5f4f0', marginTop: 8 }}>
                {amount} {asset} YO'd ✦
            </div>
            <div className="yod-sub-animate" style={{ fontSize: 13, color: '#00e87a', marginTop: 6 }}>
                ✦ Earning {apy}% APY
            </div>
        </div>,
        document.body
    );
}

function ParticlesCanvas({ active }: { active: boolean }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!active || !ref.current) return;
        const container = ref.current;
        container.innerHTML = '';
        for (let i = 0; i < 40; i++) {
            const p = document.createElement('div');
            const size = 3 + Math.random() * 5;
            const sx = 30 + Math.random() * 40;
            const sy = 30 + Math.random() * 40;
            const angle = Math.random() * Math.PI * 2;
            const dist = 100 + Math.random() * 300;
            const ex = sx + (Math.cos(angle) * dist / window.innerWidth) * 100;
            const ey = sy + (Math.sin(angle) * dist / window.innerHeight) * 100;
            const color = Math.random() > 0.5 ? '#d4f500' : '#00e87a';
            const delay = Math.random() * 0.4;
            const kf = document.createElement('style');
            kf.textContent = `@keyframes gp${i}{0%{left:${sx}%;top:${sy}%;opacity:1;transform:scale(1)}100%{left:${ex}%;top:${ey}%;opacity:0;transform:scale(0)}}`;
            document.head.appendChild(kf);
            p.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:${color};border-radius:50%;left:${sx}%;top:${sy}%;opacity:0;animation:gp${i} 1.2s ${delay}s ease-out forwards;`;
            container.appendChild(p);
        }
    }, [active]);

    return <div ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SaveDashboard() {
    const { address, isConnected } = useAccount();

    // Active vault
    const [activeSymbol, setActiveSymbol] = useState('yoUSD');
    const allSDKVaults = getAllVaults();
    const activeVaultConfig = allSDKVaults.find(v => v.symbol === activeSymbol) ?? allSDKVaults[0];
    const meta = VAULT_META[activeSymbol as keyof typeof VAULT_META];

    // Chart
    const [chartSeed, setChartSeed] = useState(0);
    const [chartTab, setChartTab] = useState('7D');

    // Panel tab
    const [panelMode, setPanelMode] = useState<'deposit' | 'withdraw'>('deposit');

    // Amount input
    const [amountStr, setAmountStr] = useState('');
    const decimals = activeVaultConfig?.underlying?.decimals ?? 6;
    const amtNum = parseFloat(amountStr) || 0;
    const parsedAmt = amtNum > 0 ? parseUnits(amountStr, decimals) : undefined;

    // Typed vault symbol
    const vaultId = activeSymbol as VaultId;

    // SDK hooks (real on-chain data)
    const { vaultState, isLoading: stateLoading } = useVaultState(vaultId);
    const { position: userPosition } = useUserPosition(vaultId, address);
    const { shares: previewShares } = usePreviewDeposit(vaultId, parsedAmt);
    const { shares: userShares } = useShareBalance(vaultId, address);

    const assetAddress = (activeVaultConfig?.underlying?.address?.[8453]
        ?? activeVaultConfig?.underlying?.address?.[1]
        ?? '0x') as `0x${string}`;
    const vaultAddress = (activeVaultConfig?.address ?? '0x') as `0x${string}`;

    const { allowance: allowanceResult } = useAllowance(assetAddress, vaultAddress, address);
    const currentAllowance = allowanceResult?.allowance ?? BigInt(0);
    const needsApproval = !!parsedAmt && currentAllowance < parsedAmt;

    // TX state
    const [txStep, setTxStep] = useState<'idle' | 'approving' | 'depositing' | 'withdrawing' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [yodActive, setYodActive] = useState(false);
    const [yodAmount, setYodAmount] = useState('');

    const { approve } = useApprove({
        token: assetAddress,
        spender: vaultAddress,
        onError: (e: Error) => { setErrorMsg(e.message); setTxStep('error'); },
    });

    const { deposit, isSuccess: depositDone } = useDeposit({
        vault: vaultId,
        onError: (e: Error) => { setErrorMsg(e.message); setTxStep('error'); },
    });

    const { redeem, isSuccess: redeemDone } = useRedeem({
        vault: vaultId,
        onError: (e: Error) => { setErrorMsg(e.message); setTxStep('error'); },
    });

    useEffect(() => {
        if (depositDone) {
            setYodAmount(amountStr);
            setYodActive(true);
            setTxStep('success');
            setAmountStr('');
        }
    }, [depositDone]);

    useEffect(() => {
        if (redeemDone) {
            setTxStep('idle');
            setAmountStr('');
        }
    }, [redeemDone]);

    const handleDeposit = useCallback(async () => {
        if (!parsedAmt) return;
        try {
            setErrorMsg('');
            if (needsApproval) {
                setTxStep('approving');
                await approve(parsedAmt);
            }
            setTxStep('depositing');
            await deposit({ token: assetAddress, amount: parsedAmt, chainId: 8453 });
        } catch (e: any) {
            setErrorMsg(e?.message ?? 'Transaction failed');
            setTxStep('error');
        }
    }, [parsedAmt, needsApproval, approve, deposit, assetAddress]);

    const handleWithdraw = useCallback(async () => {
        if (!parsedAmt || !userShares) return;
        try {
            setErrorMsg('');
            setTxStep('withdrawing');
            await redeem(userShares);
        } catch (e: any) {
            setErrorMsg(e?.message ?? 'Transaction failed');
            setTxStep('error');
        }
    }, [parsedAmt, userShares, redeem]);

    // Formatted values
    const tvlFormatted = vaultState
        ? (() => {
            const n = Number(formatUnits(vaultState.totalAssets, vaultState.assetDecimals));
            if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
            if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
            return `$${n.toFixed(2)}`;
        })()
        : '—';

    const userAssets = userPosition && vaultState
        ? Number(formatUnits(userPosition.assets, vaultState.assetDecimals))
        : 0;
    const userTokens = userPosition
        ? Number(formatUnits(userPosition.shares, decimals))
        : 0;

    const yoReceived = previewShares
        ? Number(formatUnits(previewShares, decimals)).toFixed(4)
        : amtNum > 0 ? (amtNum * 0.9997).toFixed(4) : '—';

    const dailyYield = amtNum > 0 ? (amtNum * meta.apy / 100 / 365).toFixed(4) : '0';
    const yearlyYield = amtNum > 0 ? (amtNum * meta.apy / 100).toFixed(2) : '0';

    const shortAddr = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : '—';

    // Icon color class
    const iconClass = (sym: string) => {
        if (sym.includes('ETH')) return 'c-eth';
        if (sym.includes('BTC')) return 'c-btc';
        if (sym.includes('EUR')) return 'c-eur';
        if (sym.includes('GOLD')) return 'c-gold';
        if (sym.includes('USDT')) return 'c-usdt';
        return 'c-usd';
    };

    return (
        <>
            {/* STYLE TAG — scoped CSS matching original HTML pixel-perfect */}
            <style>{`
        body.save-page { cursor: none !important; }
        .s-cursor { position:fixed;width:12px;height:12px;background:#d4f500;border-radius:50%;pointer-events:none;z-index:9999;mix-blend-mode:difference;transform:translate(-50%,-50%); }
        .s-ring { position:fixed;width:36px;height:36px;border:1px solid rgba(212,245,0,0.4);border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:left 0.4s cubic-bezier(0.23,1,0.32,1),top 0.4s cubic-bezier(0.23,1,0.32,1); }
        .s-nav { position:fixed;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:18px 40px;border-bottom:1px solid #1e1e1e;backdrop-filter:blur(16px);background:rgba(10,10,10,0.8);z-index:100; }
        .s-layout { display:grid;grid-template-columns:280px 1fr 340px;gap:0;min-height:100vh;padding-top:65px;position:relative;z-index:2; }
        .s-sidebar { border-right:1px solid #1e1e1e;padding:32px 24px;display:flex;flex-direction:column;gap:8px;position:sticky;top:65px;height:calc(100vh - 65px);overflow-y:auto; }
        .s-main { padding:40px;display:flex;flex-direction:column;gap:28px;overflow-y:auto;min-height:0; }
        .s-panel { border-left:1px solid #1e1e1e;padding:32px 28px;display:flex;flex-direction:column;gap:20px;position:sticky;top:65px;height:calc(100vh - 65px);overflow-y:auto; }
        .sidebar-label { font-size:10px;color:#555;letter-spacing:0.15em;text-transform:uppercase;padding:0 12px;margin-bottom:4px;margin-top:16px; }
        .sidebar-label:first-of-type { margin-top:0; }
        .v-item { display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;border:1px solid transparent;cursor:pointer;transition:all 0.2s;position:relative; }
        .v-item:hover { background:#141414;border-color:#1e1e1e; }
        .v-item.active { background:#181818;border-color:#2a2a2a; }
        .v-item.active::before { content:'';position:absolute;left:-1px;top:20%;bottom:20%;width:2px;background:#d4f500;border-radius:0 2px 2px 0; }
        .v-icon { width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-family:'Syne',sans-serif;font-size:11px;flex-shrink:0; }
        .c-usd { background:rgba(212,245,0,0.12);color:#d4f500; }
        .c-eth { background:rgba(100,150,255,0.12);color:#7b9fff; }
        .c-btc { background:rgba(255,160,50,0.12);color:#ffa032; }
        .c-eur { background:rgba(100,220,200,0.12);color:#64dcc8; }
        .c-gold { background:rgba(255,200,50,0.12);color:#ffc832; }
        .c-usdt { background:rgba(80,200,120,0.12);color:#50c878; }
        .v-hero { background:linear-gradient(135deg,#141414,#111);border:1px solid #1e1e1e;border-radius:24px;padding:32px;position:relative;overflow:hidden; }
        .v-glow { position:absolute;top:-60px;right:-60px;width:240px;height:240px;background:radial-gradient(circle,rgba(212,245,0,0.08),transparent 70%);border-radius:50%;pointer-events:none; }
        .vstat { background:rgba(255,255,255,0.03);border:1px solid #1e1e1e;border-radius:16px;padding:18px; }
        .s-card { background:#141414;border:1px solid #1e1e1e;border-radius:20px;padding:24px; }
        .p-tab { flex:1;text-align:center;font-size:12px;font-family:'Syne',sans-serif;font-weight:700;padding:8px;border-radius:100px;border:none;background:none;color:#555;cursor:pointer;transition:all 0.2s; }
        .p-tab.active { background:#f5f4f0;color:#0a0a0a; }
        .inp-row { display:flex;align-items:center;background:#141414;border:1px solid #1e1e1e;border-radius:16px;padding:16px 18px;transition:border-color 0.2s; }
        .inp-row:focus-within { border-color:#d4f500; }
        .q-btn { flex:1;background:#141414;border:1px solid #1e1e1e;border-radius:10px;padding:9px;font-size:12px;font-family:'Syne',sans-serif;font-weight:700;color:#888;cursor:pointer;transition:all 0.2s;text-align:center; }
        .q-btn:hover { border-color:#d4f500;color:#d4f500;background:rgba(212,245,0,0.05); }
        .prev-box { background:rgba(212,245,0,0.04);border:1px solid rgba(212,245,0,0.12);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:10px; }
        .d-btn { width:100%;padding:16px;background:#d4f500;color:#0a0a0a;font-family:'Syne',sans-serif;font-weight:800;font-size:15px;border:none;border-radius:16px;cursor:pointer;letter-spacing:0.02em;transition:transform 0.15s,box-shadow 0.2s;position:relative;overflow:hidden; }
        .d-btn:hover:not(:disabled) { transform:scale(1.02);box-shadow:0 8px 32px rgba(212,245,0,0.25); }
        .d-btn:active:not(:disabled) { transform:scale(0.98); }
        .d-btn:disabled { opacity:0.5;cursor:not-allowed; }
        .d-btn::after { content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);transform:translateX(-100%);transition:transform 0.6s; }
        .d-btn:hover::after { transform:translateX(100%); }
        .chart-tab-btn { font-size:11px;padding:5px 12px;border-radius:100px;background:none;border:1px solid transparent;color:#555;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s; }
        .chart-tab-btn.active { border-color:#1e1e1e;color:#f5f4f0;background:#1e1e1e; }
        .pos-row { display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #1e1e1e; }
        .pos-row:last-child { border-bottom:none; }
        @keyframes dot-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.6} }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1e1e1e;border-radius:2px; }
      `}</style>

            <CustomCursor />

            {/* Noise overlay */}
            <div style={{
                position: 'fixed', inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
                pointerEvents: 'none', zIndex: 1, opacity: 0.6,
            }} />

            <YodOverlay
                active={yodActive}
                amount={yodAmount}
                asset={meta.underlyingSymbol}
                apy={meta.apy}
                onDone={() => { setYodActive(false); setTxStep('idle'); }}
            />

            {/* NAV */}
            <nav className="s-nav">
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, background: '#d4f500', borderRadius: '50%', animation: 'dot-pulse 2s infinite' }} />
                    Zyo
                </div>
                <div style={{ display: 'flex', gap: 4, background: '#141414', border: '1px solid #1e1e1e', borderRadius: 100, padding: 4 }}>
                    <button style={{ fontSize: 12, padding: '7px 18px', borderRadius: 100, background: '#1e1e1e', color: '#f5f4f0', border: 'none', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>Save</button>
                    <Link href="/app" style={{ fontSize: 12, padding: '7px 18px', borderRadius: 100, color: '#555', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Dashboard</Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#141414', border: '1px solid #1e1e1e', borderRadius: 100, padding: '8px 16px', fontSize: 12, color: '#888' }}>
                    <div style={{ width: 6, height: 6, background: '#00e87a', borderRadius: '50%', animation: 'dot-pulse 2s infinite' }} />
                    {isConnected ? shortAddr : 'Not connected'}
                </div>
            </nav>

            {/* 3-COLUMN LAYOUT */}
            <div className="s-layout">

                {/* ── SIDEBAR ── */}
                <aside className="s-sidebar">
                    {SIDEBAR_VAULTS.map((group, gi) => (
                        <div key={group.category}>
                            <div className="sidebar-label" style={{ marginTop: gi === 0 ? 0 : 16 }}>{group.category}</div>
                            {group.vaults.map(v => (
                                <div
                                    key={v.symbol}
                                    className={`v-item ${activeSymbol === v.symbol ? 'active' : ''}`}
                                    onClick={() => { setActiveSymbol(v.symbol); setChartSeed(s => s + 1); setAmountStr(''); setTxStep('idle'); setErrorMsg(''); }}
                                >
                                    <div className={`v-icon ${v.iconClass}`}>{v.label}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#f5f4f0' }}>{v.symbol}</div>
                                        <div style={{ fontSize: 10, color: '#555' }}>{v.asset} · {v.chain}</div>
                                    </div>
                                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: '#00e87a' }}>
                                        {VAULT_META[v.symbol as keyof typeof VAULT_META]?.apy ?? '—'}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </aside>

                {/* ── MAIN ── */}
                <main className="s-main">

                    {/* Hero */}
                    <div className="v-hero">
                        <div className="v-glow" />
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div className={`v-icon ${iconClass(activeSymbol)}`} style={{ width: 52, height: 52, borderRadius: 16, fontSize: 14 }}>
                                    {meta.emoji}
                                </div>
                                <div>
                                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-1px' }}>{activeSymbol}</div>
                                    <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{meta.underlyingSymbol} deposited, yield accrued in {meta.underlyingSymbol} — {activeVaultConfig?.network ?? 'Base'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.2)', color: '#00e87a', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 700, padding: '6px 14px', borderRadius: 100 }}>
                                <div style={{ width: 5, height: 5, background: '#00e87a', borderRadius: '50%', animation: 'dot-pulse 2s infinite' }} /> Live
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
                            <div className="vstat">
                                <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Current APY</div>
                                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#00e87a' }}>{meta.apy}%</div>
                                <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>7-day average</div>
                            </div>
                            <div className="vstat">
                                <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Total Value Locked</div>
                                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#d4f500' }}>
                                    {stateLoading ? <span style={{ display: 'inline-block', width: 60, height: 22, background: 'linear-gradient(90deg,#1a1a1a 25%,#252525 50%,#1a1a1a 75%)', backgroundSize: '200% 100%', borderRadius: 6, animation: 'shimmer 1.5s infinite' }} /> : tvlFormatted}
                                </div>
                                <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>across all depositors</div>
                            </div>
                            <div className="vstat">
                                <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Your position</div>
                                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
                                    {userAssets > 0 ? `${userAssets.toLocaleString(undefined, { maximumFractionDigits: 4 })}` : '—'}
                                </div>
                                <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
                                    {userAssets > 0 ? `earning ${meta.apy}% APY` : 'No deposit yet'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* APY Chart */}
                    <div className="s-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700 }}>APY History</div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {['7D', '30D', '90D'].map(t => (
                                    <button key={t} className={`chart-tab-btn ${chartTab === t ? 'active' : ''}`}
                                        onClick={() => { setChartTab(t); setChartSeed(s => s + 1); }}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ position: 'relative', height: 120 }}>
                            <ApyChart seed={chartSeed} />
                        </div>
                    </div>

                    {/* Your Position */}
                    <div className="s-card">
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Your Position</div>
                        {userAssets > 0 ? (
                            <>
                                <div className="pos-row"><span style={{ fontSize: 12, color: '#888' }}>Deposited value</span><span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700 }}>{userAssets.toLocaleString(undefined, { maximumFractionDigits: 4 })} {meta.underlyingSymbol}</span></div>
                                <div className="pos-row"><span style={{ fontSize: 12, color: '#888' }}>{activeSymbol} shares</span><span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700 }}>{userTokens.toFixed(4)} {activeSymbol}</span></div>
                                <div className="pos-row"><span style={{ fontSize: 12, color: '#888' }}>Current APY</span><span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#00e87a' }}>{meta.apy}%</span></div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px', color: '#555', fontSize: 13 }}>
                                No deposit yet. Start saving to see your position here.
                            </div>
                        )}
                    </div>
                </main>

                {/* ── RIGHT PANEL ── */}
                <aside className="s-panel">
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>Deposit</div>

                    {/* Deposit / Withdraw tabs */}
                    <div style={{ display: 'flex', gap: 4, background: '#141414', border: '1px solid #1e1e1e', borderRadius: 100, padding: 4 }}>
                        <button className={`p-tab ${panelMode === 'deposit' ? 'active' : ''}`} onClick={() => { setPanelMode('deposit'); setAmountStr(''); setTxStep('idle'); }}>Deposit</button>
                        <button className={`p-tab ${panelMode === 'withdraw' ? 'active' : ''}`} onClick={() => { setPanelMode('withdraw'); setAmountStr(''); setTxStep('idle'); }}>Withdraw</button>
                    </div>

                    {/* Amount input */}
                    <div>
                        <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.05em', marginBottom: 10, textTransform: 'uppercase' }}>Amount</div>
                        <div className="inp-row">
                            <input
                                type="number"
                                placeholder="0"
                                value={amountStr}
                                onChange={e => setAmountStr(e.target.value)}
                                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#f5f4f0', letterSpacing: '-0.5px', width: 0, minWidth: 0 }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 100, padding: '6px 12px', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(212,245,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#d4f500', fontWeight: 800 }}>
                                    {meta.emoji}
                                </div>
                                {meta.underlyingSymbol}
                            </div>
                        </div>
                        {panelMode === 'deposit' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555', marginTop: 10 }}>
                                <span>Balance: <strong style={{ color: '#f5f4f0' }}>—</strong></span>
                                <button onClick={() => setAmountStr('2500')} style={{ color: '#d4f500', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans' }}>MAX</button>
                            </div>
                        )}
                    </div>

                    {/* Quick amounts (deposit only) */}
                    {panelMode === 'deposit' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['100', '500', '1000', '2500'].map((v, i) => (
                                <button key={v} className="q-btn" onClick={() => setAmountStr(v)}>
                                    {['$100', '$500', '$1K', 'MAX'][i]}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Preview box */}
                    {parsedAmt && panelMode === 'deposit' && (
                        <div className="prev-box">
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ color: '#666' }}>You deposit</span>
                                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#f5f4f0' }}>{amountStr} {meta.underlyingSymbol}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ color: '#666' }}>You receive</span>
                                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#f5f4f0' }}>~{yoReceived} {activeSymbol}</span>
                            </div>
                            <div style={{ height: 1, background: 'rgba(212,245,0,0.08)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ color: '#666' }}>Est. daily yield</span>
                                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#00e87a' }}>+${dailyYield}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ color: '#666' }}>Est. yearly yield</span>
                                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#00e87a' }}>+${yearlyYield}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ color: '#666' }}>Exchange rate</span>
                                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#f5f4f0' }}>1 {meta.underlyingSymbol} ≈ {(0.9997).toFixed(4)} {activeSymbol}</span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {txStep === 'error' && errorMsg && (
                        <div style={{ background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.2)', borderRadius: 12, padding: '12px 16px', color: '#ff6060', fontSize: 12 }}>
                            {errorMsg}
                        </div>
                    )}

                    {/* Approval notice */}
                    {needsApproval && txStep === 'idle' && (
                        <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
                            ⚡ Approval required before deposit
                        </div>
                    )}

                    {/* CTA Button */}
                    <button
                        className="d-btn"
                        onClick={panelMode === 'deposit' ? handleDeposit : handleWithdraw}
                        disabled={!parsedAmt || txStep === 'approving' || txStep === 'depositing' || txStep === 'withdrawing'}
                    >
                        {txStep === 'approving' ? '⏳ Approving...' :
                            txStep === 'depositing' ? '⏳ Depositing...' :
                                txStep === 'withdrawing' ? '⏳ Withdrawing...' :
                                    panelMode === 'deposit' ? '⚡ YO my funds' : '↓ Withdraw funds'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, color: '#444', lineHeight: 1.6 }}>
                        <span style={{ color: '#555', flexShrink: 0, marginTop: 1 }}>🔒</span>
                        <span>Your funds are secured by YO Protocol smart contracts, audited by independent security researchers. You can withdraw at any time.</span>
                    </div>
                </aside>
            </div>
        </>
    );
}

// ─── Custom Cursor ────────────────────────────────────────────────────────────
function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.body.classList.add('save-page');
        let mx = 0, my = 0, rx = 0, ry = 0;
        let raf: number;

        const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
        document.addEventListener('mousemove', onMove);

        const loop = () => {
            if (cursorRef.current) {
                cursorRef.current.style.left = mx + 'px';
                cursorRef.current.style.top = my + 'px';
            }
            rx += (mx - rx) * 0.12;
            ry += (my - ry) * 0.12;
            if (ringRef.current) {
                ringRef.current.style.left = rx + 'px';
                ringRef.current.style.top = ry + 'px';
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        return () => {
            document.body.classList.remove('save-page');
            document.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <>
            <div ref={cursorRef} className="s-cursor" />
            <div ref={ringRef} className="s-ring" />
        </>
    );
}
