'use client';

import Link from 'next/link';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

type ActiveTab = 'Save' | 'History' | 'Dashboard';

const NAV_TABS = [
    { label: 'Save', href: '/app/save' },
    { label: 'History', href: '/app/history' },
    { label: 'Dashboard', href: '/app/dashboard' },
] as const;

function ConnectWalletBtn() {
    const { connect } = useConnect();
    return (
        <button
            onClick={() => connect({ connector: injected() })}
            style={{
                background: '#d4f500', color: '#0a0a0a',
                fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12,
                padding: '8px 18px', borderRadius: 100, border: 'none',
                letterSpacing: '0.03em',
                transition: 'transform 0.15s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(212,245,0,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            Connect wallet
        </button>
    );
}

function NetworkSwitcher() {
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    const isBase = chainId === 8453;
    const isEth = chainId === 1;

    const btnStyle = (active: boolean): React.CSSProperties => ({
        fontFamily: 'Syne, sans-serif',
        fontSize: 10,
        fontWeight: 700,
        padding: '4px 10px',
        borderRadius: 100,
        border: active ? '1px solid #d4f500' : '1px solid #2a2a2a',
        background: active ? 'rgba(212,245,0,0.1)' : 'none',
        color: active ? '#d4f500' : '#555',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: 4
    });

    return (
        <div style={{ display: 'flex', gap: 6, background: '#141414', padding: '4px', borderRadius: 100, border: '1px solid #1e1e1e' }}>
            <button
                onClick={() => switchChain({ chainId: 8453 })}
                style={btnStyle(isBase)}
            >
                <img src="/blockchains/base.svg" alt="Base" style={{ width: 12, height: 12, borderRadius: '50%' }} />
                Base
            </button>
            <button
                onClick={() => switchChain({ chainId: 1 })}
                style={btnStyle(isEth)}
            >
                <img src="/blockchains/ethereum.svg" alt="Eth" style={{ width: 12, height: 12, borderRadius: '50%' }} />
                Ethereum
            </button>
        </div>
    );
}

export function AppHeader({ active }: { active: ActiveTab }) {
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            zIndex: 100,
            background: 'rgba(10,10,10,0.8)',
            borderBottom: '1px solid #1e1e1e',
            backdropFilter: 'blur(16px)',
            padding: '20px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}>

            <Link href="/" style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <img src="/yo/yolo.png" alt="Yolo Logo" style={{ height: 28, width: 'auto' }} />
            </Link>

            <div style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex', gap: 4,
                background: '#141414', border: '1px solid #1e1e1e',
                borderRadius: 100, padding: 4,
            }}>
                {NAV_TABS.map(({ label, href }) => {
                    const isActive = label === active;
                    const pill = (
                        <span style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: 12, padding: '7px 18px', borderRadius: 100,
                            color: isActive ? '#f5f4f0' : '#555',
                            background: isActive ? '#1e1e1e' : 'none',
                            display: 'inline-block',
                            transition: 'color 0.2s',
                        }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#f5f4f0'; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#555'; }}
                        >{label}</span>
                    );
                    return isActive
                        ? <span key={label}>{pill}</span>
                        : <Link key={label} href={href} style={{ textDecoration: 'none' }}>{pill}</Link>;
                })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                {isConnected && <NetworkSwitcher />}
                {isConnected ? (
                    <>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: '#141414', border: '1px solid #1e1e1e',
                            borderRadius: 100, padding: '8px 16px',
                            fontSize: 12, color: '#888',
                        }}>
                            <div style={{ width: 6, height: 6, background: '#00e87a', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                            {shortAddr}
                        </div>
                        <button
                            onClick={() => disconnect()}
                            style={{
                                background: 'none', border: '1px solid #2a2a2a', color: '#555',
                                fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 12,
                                padding: '8px 16px', borderRadius: 100, letterSpacing: '0.05em',
                                transition: 'border-color 0.2s, color 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#f5f4f0'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555'; }}
                        >
                            Disconnect
                        </button>
                    </>
                ) : (
                    <ConnectWalletBtn />
                )}
            </div>
        </nav>
    );
}
