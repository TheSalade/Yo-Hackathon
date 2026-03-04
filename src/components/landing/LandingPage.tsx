'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { TICKER_VAULTS, VAULT_META } from '@/lib/constants';

function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const mouse = useRef({ x: 0, y: 0 });
    const ring = useRef({ x: 0, y: 0 });
    const raf = useRef<number>(0);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            mouse.current = { x: e.clientX, y: e.clientY };
        };
        document.addEventListener('mousemove', onMove);

        const animate = () => {
            if (cursorRef.current) {
                cursorRef.current.style.left = mouse.current.x + 'px';
                cursorRef.current.style.top = mouse.current.y + 'px';
            }
            ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
            ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
            if (ringRef.current) {
                ringRef.current.style.left = ring.current.x + 'px';
                ringRef.current.style.top = ring.current.y + 'px';
            }
            raf.current = requestAnimationFrame(animate);
        };
        raf.current = requestAnimationFrame(animate);

        document.body.classList.add('custom-cursor');
        return () => {
            document.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(raf.current);
            document.body.classList.remove('custom-cursor');
        };
    }, []);

    return (
        <>
            <div ref={cursorRef} className="cursor" />
            <div ref={ringRef} className="cursor-ring" />
        </>
    );
}

function YodOverlay({ active, onDone }: { active: boolean; onDone: () => void }) {
    const particlesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!active || !particlesRef.current) return;
        const container = particlesRef.current;
        container.innerHTML = '';
        for (let i = 0; i < 24; i++) {
            const p = document.createElement('div');
            const startX = 50 + (Math.random() - 0.5) * 20;
            const startY = 50 + (Math.random() - 0.5) * 20;
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 120;
            const endX = startX + Math.cos(angle) * dist;
            const endY = startY + Math.sin(angle) * dist;
            const size = 2 + Math.random() * 4;
            const isYellow = Math.random() > 0.5;
            const delay = Math.random() * 0.3;

            const style = document.createElement('style');
            style.textContent = `
        @keyframes particle-anim-${i} {
          0% { left:${startX}%;top:${startY}%;opacity:1;transform:scale(1);}
          100% { left:${endX}%;top:${endY}%;opacity:0;transform:scale(0);}
        }
      `;
            document.head.appendChild(style);

            p.style.cssText = `
        position:absolute;
        width:${size}px;height:${size}px;
        background:${isYellow ? '#d4f500' : '#00e87a'};
        border-radius:50%;
        animation:particle-anim-${i} 1s ${delay}s ease-out forwards;
        left:${startX}%;top:${startY}%;
      `;
            container.appendChild(p);
        }

        const t = setTimeout(onDone, 2800);
        return () => clearTimeout(t);
    }, [active, onDone]);

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                background: '#0a0a0a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
                borderRadius: '44px',
                opacity: active ? 1 : 0,
                pointerEvents: active ? 'all' : 'none',
                transition: 'opacity 0.3s',
                overflow: 'hidden',
            }}
        >
            <div ref={particlesRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '44px' }} />
            {active && (
                <>
                    <div style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: '56px',
                        fontWeight: 800,
                        color: '#d4f500',
                        letterSpacing: '-2px',
                        animation: 'yoSpin 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards',
                    }}>YO</div>
                    <div style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '12px',
                        color: '#888',
                        marginTop: '16px',
                        opacity: 0,
                        animation: 'fadeUp 0.5s 0.6s forwards',
                        letterSpacing: '0.05em',
                    }}>Your USDC has been</div>
                    <div style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: '20px',
                        fontWeight: 800,
                        color: '#f5f4f0',
                        marginTop: '8px',
                        opacity: 0,
                        animation: 'fadeUp 0.5s 0.8s forwards',
                        letterSpacing: '-0.5px',
                    }}>YO&apos;d ✦</div>
                </>
            )}
        </div>
    );
}

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
                        ⚡ YO my funds
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

                <YodOverlay active={yodActive} onDone={() => setYodActive(false)} />
            </div>
        </div>
    );
}

export default function LandingPage() {
    const { login, authenticated } = usePrivy();
    const router = useRouter();

    useEffect(() => {
        if (authenticated) {
            router.push('/app');
        }
    }, [authenticated, router]);

    return (
        <>
            <CustomCursor />
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
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="animate-pulse-dot" style={{ width: '8px', height: '8px', background: '#d4f500', borderRadius: '50%' }} />
                    ZYO
                </div>
                <ul style={{ display: 'flex', alignItems: 'center', gap: '32px', fontSize: '13px', letterSpacing: '0.02em', color: '#888', listStyle: 'none' }}>
                    <li><a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f5f4f0')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#888')}>How it works</a></li>
                    <li><a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f5f4f0')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Vaults</a></li>
                    <li><a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f5f4f0')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Docs</a></li>
                </ul>
                <button
                    id="nav-launch-btn"
                    onClick={login}
                    style={{
                        background: '#d4f500',
                        color: '#0a0a0a',
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        fontSize: '13px',
                        padding: '10px 22px',
                        borderRadius: '100px',
                        border: 'none',
                        cursor: 'pointer',
                        letterSpacing: '0.02em',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.04)';
                        e.currentTarget.style.boxShadow = '0 0 24px rgba(212,245,0,0.3)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    Launch App
                </button>
            </nav>

            {/* HERO */}
            <section style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '120px 48px 80px',
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
                                { val: '$180M+', label: 'TVL secured' },
                                { val: '4.8%', label: 'Avg. APY' },
                            ].map(s => (
                                <div key={s.label} style={{ textAlign: 'right' }}>
                                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 700, color: '#f5f4f0', letterSpacing: '-0.5px' }}>{s.val}</div>
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
                                { icon: '⚡', title: 'Instant deposit', desc: 'Drop your USDC, ETH or BTC. Get yoTokens instantly. Start earning in the same block.' },
                                { icon: '🔒', title: 'Risk-adjusted yield', desc: 'YO Protocol routes funds across vetted strategies. You see exactly where your money goes.' },
                                { icon: '🌐', title: 'Multi-chain', desc: 'Base, Ethereum, Arbitrum. One interface, all your savings in one place.' },
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
                            <button
                                id="start-saving-btn"
                                onClick={login}
                                style={{
                                    background: '#d4f500',
                                    color: '#0a0a0a',
                                    fontFamily: 'Syne, sans-serif',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    padding: '12px 24px',
                                    borderRadius: '100px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    letterSpacing: '0.02em',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'scale(1.04)';
                                    e.currentTarget.style.boxShadow = '0 0 24px rgba(212,245,0,0.3)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                Start saving →
                            </button>
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
