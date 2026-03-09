'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TICKER_VAULTS, VAULT_META } from '@/lib/constants';
import { useTotalTvl } from '@yo-protocol/react';
import { YOdAnimation } from '../app/YOdAnimation';


function PhoneMockup() {
    const [balance, setBalance] = useState(3284.50);
    const [yodActive, setYodActive] = useState(false);

    useEffect(() => {
        const iv = setInterval(() => {
            setBalance(b => b + Math.random() * 0.003);
        }, 800);
        return () => clearInterval(iv);
    }, []);

    return (
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Glow */}
            <div style={{
                position: 'absolute',
                width: '280px', height: '500px',
                background: 'radial-gradient(ellipse, rgba(212,245,0,0.12) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(40px)',
                pointerEvents: 'none',
            }} />

            {/* Phone shell */}
            <div className="animate-float" style={{
                position: 'relative',
                width: '260px',
                height: '540px',
                background: '#111',
                borderRadius: '44px',
                border: '1.5px solid #2a2a2a',
                overflow: 'hidden',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}>
                {/* Notch */}
                <div style={{
                    position: 'absolute',
                    top: '14px', left: '50%',
                    transform: 'translateX(-50%)',
                    width: '80px', height: '26px',
                    background: '#0a0a0a',
                    borderRadius: '20px',
                    zIndex: 10,
                }} />

                {/* Screen */}
                <div style={{
                    position: 'absolute', inset: 0,
                    padding: '60px 18px 24px',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    overflow: 'hidden',
                }}>
                    {/* App header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '15px', color: '#f5f4f0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ width: '5px', height: '5px', background: '#d4f500', borderRadius: '50%' }} className="animate-pulse-dot" />
                            YO
                        </div>
                        <div style={{ width: '26px', height: '26px', background: 'linear-gradient(135deg,#d4f500,#00e87a)', borderRadius: '50%' }} />
                    </div>

                    {/* Balance card */}
                    <div style={{
                        background: 'linear-gradient(145deg,#1a1a1a,#141414)',
                        border: '1px solid #2a2a2a',
                        borderRadius: '20px',
                        padding: '18px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', background: 'radial-gradient(circle,rgba(212,245,0,0.08),transparent)', borderRadius: '50%' }} />
                        <div style={{ fontSize: '9px', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total savings</div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', color: '#f5f4f0', margin: '4px 0' }}>
                            ${balance.toFixed(2)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#00e87a' }}>
                            <div style={{ width: '5px', height: '5px', background: '#00e87a', borderRadius: '50%' }} className="animate-pulse-dot" />
                            <span>+$12.40 earned today</span>
                        </div>
                    </div>

                    {/* Asset chips */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[
                            { name: 'yoUSD', val: '$2,100', apy: '4.2% APY' },
                            { name: 'yoETH', val: '$984', apy: '3.8% APY' },
                            { name: 'yoBTC', val: '$200', apy: '2.9% APY' },
                        ].map(a => (
                            <div key={a.name} style={{ flex: 1, background: '#1a1a1a', border: '1px solid #252525', borderRadius: '14px', padding: '10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '9px', color: '#666', letterSpacing: '0.05em' }}>{a.name}</div>
                                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', fontWeight: 700, color: '#f5f4f0', marginTop: '2px' }}>{a.val}</div>
                                <div style={{ fontSize: '8px', color: '#00e87a', marginTop: '1px' }}>{a.apy}</div>
                            </div>
                        ))}
                    </div>

                    {/* CTA button */}
                    <button
                        onClick={() => !yodActive && setYodActive(true)}
                        style={{
                            width: '100%',
                            background: '#d4f500',
                            color: '#0a0a0a',
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 800,
                            fontSize: '13px',
                            padding: '14px',
                            borderRadius: '16px',
                            border: 'none',
                            cursor: 'pointer',
                            letterSpacing: '0.02em',
                        }}
                    >
                        YO my funds
                    </button>

                    {/* Transaction list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '9px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>Recent activity</div>
                        {[
                            { icon: '↓', type: 'deposit', name: 'Deposited USDC', date: 'Today, 14:32', amount: '+500 yoUSD' },
                            { icon: '✦', type: 'yield', name: 'Yield accrued', date: 'Yesterday', amount: '+$8.20' },
                        ].map((tx, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#141414', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '10px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px',
                                        background: tx.type === 'deposit' ? 'rgba(212,245,0,0.15)' : 'rgba(0,232,122,0.15)',
                                        color: tx.type === 'deposit' ? '#d4f500' : '#00e87a',
                                    }}>{tx.icon}</div>
                                    <div>
                                        <div style={{ fontSize: '10px', color: '#f5f4f0', fontWeight: 500 }}>{tx.name}</div>
                                        <div style={{ fontSize: '8px', color: '#555' }}>{tx.date}</div>
                                    </div>
                                </div>
                                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '10px', fontWeight: 700, color: '#00e87a' }}>{tx.amount}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <YOdAnimation
                    active={yodActive}
                    asset="USDC"
                    vaultId="yoUSD"
                    amount="1,000 yoUSD"
                    onDone={() => setYodActive(false)}
                    inline
                />
            </div>
        </div>
    );
}

export default function LandingPage() {
    const { tvl } = useTotalTvl();
    const currentTvlUsd = tvl.length > 0 ? parseFloat(tvl[tvl.length - 1].tvlUsd) : undefined;
    const tvlFmt = currentTvlUsd
        ? (() => {
            if (currentTvlUsd >= 1_000_000) return `$${(currentTvlUsd / 1_000_000).toFixed(1)}M+`;
            if (currentTvlUsd >= 1_000) return `$${(currentTvlUsd / 1_000).toFixed(1)}K+`;
            return `$${currentTvlUsd.toFixed(0)}+`;
        })()
        : '$180M+';

    const apys = Object.values(VAULT_META).map(m => m.apy);
    const avgApyFmt = apys.length ? (apys.reduce((a, b) => a + b, 0) / apys.length).toFixed(1) + '%' : '4.8%';

    return (
        <>
            <div className="noise-overlay" />

            {/* NAV */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '24px 48px',
                zIndex: 100,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                background: 'rgba(10,10,10,0.6)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/yo/yolo.png" alt="Yolo Logo" style={{ height: 32, width: 'auto' }} />
                </div>

                <Link
                    href="/app/save"
                    id="nav-launch-btn"
                    style={{
                        background: '#d4f500', color: '#0a0a0a',
                        fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px',
                        padding: '10px 22px', borderRadius: '100px',
                        textDecoration: 'none', display: 'inline-block',
                        letterSpacing: '0.02em', transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(212,245,0,0.3)'; }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >Launch App</Link>
            </nav>

            {/* HERO */}
            <section style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                padding: '160px 48px 80px',
                overflow: 'hidden',
            }}>
                {/* Glow orbs */}
                <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'rgba(212,245,0,0.06)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'rgba(0,232,122,0.05)', top: '20%', left: '20%', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />

                <div style={{
                    position: 'relative',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '80px',
                    alignItems: 'center',
                    maxWidth: '1200px',
                    width: '100%',
                    zIndex: 2,
                }}>
                    {/* LEFT */}
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4f500', marginBottom: '20px', fontWeight: 500 }}>
                            Powered by YO Protocol
                        </p>
                        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(36px,4vw,52px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-1.5px', marginBottom: '24px' }}>
                            Your savings,<br />
                            <span style={{ color: '#d4f500' }}>finally</span><br />
                            working hard.
                        </h1>
                        <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#888', maxWidth: '320px', marginLeft: 'auto' }}>
                            Deposit USDC, ETH, or BTC. Earn real onchain yield. No banks. No bullshit.
                        </p>
                        <div style={{ display: 'flex', gap: '32px', justifyContent: 'flex-end', marginTop: '48px' }}>
                            {[
                                { val: tvlFmt, label: 'TVL secured' },
                                { val: avgApyFmt, label: 'Avg. APY' },
                            ].map(s => (
                                <div key={s.label} style={{ textAlign: 'right' }}>
                                    <div suppressHydrationWarning style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 700, color: '#f5f4f0', letterSpacing: '-0.5px' }}>{s.val}</div>
                                    <div style={{ fontSize: '11px', color: '#666', letterSpacing: '0.05em', marginTop: '2px' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CENTER — Phone */}
                    <PhoneMockup />

                    {/* RIGHT */}
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                {
                                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>,
                                    title: 'Instant deposit',
                                    desc: 'Drop your USDC, ETH or BTC. Get yoTokens instantly. Start earning in the same block.'
                                },
                                {
                                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
                                    title: 'Risk-adjusted yield',
                                    desc: 'YO Protocol routes funds across vetted strategies. You see exactly where your money goes.'
                                },
                                {
                                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
                                    title: 'Multi-chain',
                                    desc: 'Base, Ethereum, Arbitrum. One interface, all your savings in one place.'
                                },
                            ].map((f, i) => (
                                <div key={f.title} className="animate-slide-in-right" style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', animationDelay: `${(i + 1) * 0.1}s` }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, background: '#141414' }}>
                                        {f.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: '#f5f4f0', marginBottom: '4px' }}>{f.title}</div>
                                        <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.6 }}>{f.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '40px', alignItems: 'center' }}>
                            <Link
                                href="/app/save"
                                id="start-saving-btn"
                                style={{
                                    background: '#d4f500', color: '#0a0a0a',
                                    fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px',
                                    padding: '12px 24px', borderRadius: '100px',
                                    textDecoration: 'none', display: 'inline-block',
                                    letterSpacing: '0.02em', transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(212,245,0,0.3)'; }}
                                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >Start saving →</Link>
                            <button style={{ color: '#888', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#f5f4f0')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#888')}>
                                Watch demo ↗
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* TICKER */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: 'rgba(10,10,10,0.9)',
                borderTop: '1px solid #1a1a1a',
                padding: '12px 0',
                overflow: 'hidden',
                zIndex: 100,
                backdropFilter: 'blur(12px)',
            }}>
                <div className="animate-ticker" style={{ display: 'flex', gap: '80px', whiteSpace: 'nowrap' }}>
                    {[...TICKER_VAULTS, ...TICKER_VAULTS].map((v, i) => {
                        const meta = VAULT_META[v.id];
                        return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#555', letterSpacing: '0.05em' }}>
                                <span style={{ color: '#888', fontWeight: 500 }}>{v.id}</span>
                                <span style={{ color: '#00e87a', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{meta.apy}% APY</span>
                                <span style={{ color: '#2a2a2a' }}>·</span>
                                <span>{meta.underlyingSymbol} on {v.chain}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
