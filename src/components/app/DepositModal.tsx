'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useAllowance, useApprove, useDeposit, usePreviewDeposit, useUserPosition, useVaultState, useShareBalance } from '@yo-protocol/react';
import type { VaultConfig } from '@yo-protocol/core';
import { VAULT_META } from '@/lib/constants';
import { YOdAnimation } from './YOdAnimation';

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

interface DepositModalProps {
    vault: VaultConfig;
    onClose: () => void;
}

type Step = 'input' | 'preview' | 'approving' | 'depositing' | 'done' | 'error';

export function DepositModal({ vault, onClose }: DepositModalProps) {
    const { address } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const meta = VAULT_META[vault.symbol];

    const [amount, setAmount] = useState('');
    const [step, setStep] = useState<Step>('input');
    const [errorMsg, setErrorMsg] = useState('');
    const [yodActive, setYodActive] = useState(false);

    const decimals = vault.underlying.decimals;
    const parsedAmount = amount && !isNaN(Number(amount)) && Number(amount) > 0
        ? parseUnits(amount, decimals)
        : undefined;

    // Preview deposit → how many shares user receives
    const { shares: previewShares } = usePreviewDeposit(vault.symbol, parsedAmount);

    // Check allowance: useAllowance(token, spender, owner)
    const supportedChains = vault.chains as number[];
    const isWrongChain = supportedChains.length > 0 && !supportedChains.includes(chainId);
    const targetChain = supportedChains.includes(chainId) ? chainId : (supportedChains[0] || 8453);
    const assetAddress = vault.underlying.address[targetChain as keyof typeof vault.underlying.address] ?? '0x';
    const { allowance: allowanceData } = useAllowance(assetAddress, vault.address, address);
    const currentAllowance = allowanceData?.allowance ?? BigInt(0);
    const needsApproval = parsedAmount !== undefined && currentAllowance < parsedAmount;

    // Approve hook — token & spender fixed at setup
    const {
        approve,
        isLoading: isApproving,
        isSuccess: approveSuccess,
    } = useApprove({
        token: assetAddress,
        spender: vault.address,
        onError: (e) => {
            setErrorMsg(parseError(e) || 'Approval failed');
            setStep('error');
        },
    });

    // Deposit hook — vault fixed at setup
    const {
        deposit,
        step: depositStep,
        isLoading: isDepositing,
        isSuccess: depositSuccess,
    } = useDeposit({
        vault: vault.symbol,
        onError: (e) => {
            setErrorMsg(parseError(e) || 'Deposit failed');
            setStep('error');
        },
    });

    // Hook into global queries to force refresh on success
    const { refetch: refetchUserPos } = useUserPosition(vault.symbol, address);
    const { refetch: refetchVaultState } = useVaultState(vault.symbol);
    const { refetch: refetchShares } = useShareBalance(vault.symbol, address);

    // Evaluate balance
    const { data: tokenBalanceData, refetch: refetchTokenBalance } = useBalance({
        address,
        token: assetAddress !== '0x' ? (assetAddress as `0x${string}`) : undefined,
        chainId: targetChain as 1 | 8453 | undefined,
        query: {
            enabled: assetAddress !== '0x' && !!targetChain,
        }
    });

    // When deposit succeeds → trigger YO'd and refetch balances
    useEffect(() => {
        if (depositSuccess) {
            setStep('done');
            setYodActive(true);
            refetchUserPos();
            refetchVaultState();
            refetchShares();
            refetchTokenBalance();
        }
    }, [depositSuccess, refetchUserPos, refetchVaultState, refetchShares, refetchTokenBalance]);

    const sharesDisplay = previewShares
        ? Number(formatUnits(previewShares, decimals)).toFixed(4)
        : '—';

    const availableBalanceLabel = tokenBalanceData
        ? Number(formatUnits(tokenBalanceData.value, tokenBalanceData.decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })
        : '—';
    const maxBalanceStr = tokenBalanceData
        ? formatUnits(tokenBalanceData.value, tokenBalanceData.decimals)
        : '0';

    const handlePreview = () => {
        if (!parsedAmount) return;
        setStep('preview');
    };

    const handleConfirm = async () => {
        if (!parsedAmount) return;
        try {
            if (needsApproval) {
                setStep('approving');
                await approve(parsedAmount);
            }
            setStep('depositing');
            await deposit({ token: assetAddress, amount: parsedAmount, chainId });
        } catch (e: unknown) {
            setErrorMsg(parseError(e));
            setStep('error');
        }
    };

    const isLoading = step === 'approving' || step === 'depositing';

    return (
        <>
            <YOdAnimation
                active={yodActive}
                asset={meta.underlyingSymbol}
                vaultId={vault.symbol}
                amount={`${amount} ${vault.symbol}`}
                onDone={() => { setYodActive(false); onClose(); }}
            />

            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, backdropFilter: 'blur(4px)' }}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed',
                top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: 'min(420px, 95vw)',
                background: '#111',
                border: '1px solid #2a2a2a',
                borderRadius: '24px',
                padding: '32px',
                zIndex: 600,
                boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
            }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800, color: '#f5f4f0', letterSpacing: '-0.5px' }}>
                            <img src={`/yo/${vault.symbol}.svg`} alt={vault.symbol} style={{ width: 24, height: 24 }} /> Deposit {meta.underlyingSymbol}
                        </div>
                        <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                            {vault.name} · {meta.apy}% APY
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>✕</button>
                </div>

                {step === 'input' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888', marginBottom: 8 }}>
                            <span>Available to deposit</span>
                            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#f5f4f0' }}>{availableBalanceLabel} {meta.underlyingSymbol}</span>
                        </div>

                        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Amount</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                    id="deposit-amount-input"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700, color: '#f5f4f0', letterSpacing: '-1px' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: '#888', flexShrink: 0 }}>
                                    <img src={`/tokens/${meta.underlyingSymbol.toLowerCase()}.svg`} alt={meta.underlyingSymbol} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                                    {meta.underlyingSymbol}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                            {[25, 50, 75, 100].map((pct) => (
                                <button key={pct} onClick={() => {
                                    const maxNum = parseFloat(maxBalanceStr);
                                    if (isNaN(maxNum) || maxNum <= 0) return;
                                    setAmount(pct === 100 ? maxBalanceStr : (maxNum * (pct / 100)).toString());
                                }}
                                    style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: 8, fontSize: 13, fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#888', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                                    {pct === 100 ? 'Max' : `${pct}%`}
                                </button>
                            ))}
                        </div>

                        {previewShares && parsedAmount && (
                            <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#555' }}>You&apos;ll receive</span>
                                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: '#00e87a' }}>
                                    ~{sharesDisplay} {vault.symbol}
                                </span>
                            </div>
                        )}

                        {needsApproval && (
                            <div style={{ background: 'rgba(212,245,0,0.06)', border: '1px solid rgba(212,245,0,0.15)', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#888' }}>
                                ⚡ Approval required before deposit
                            </div>
                        )}

                        <button
                            id="deposit-preview-btn"
                            onClick={handlePreview}
                            disabled={!parsedAmount}
                            style={{ width: '100%', background: parsedAmount ? '#d4f500' : '#1a1a1a', color: parsedAmount ? '#0a0a0a' : '#555', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px', padding: '16px', borderRadius: '14px', border: 'none', cursor: parsedAmount ? 'pointer' : 'not-allowed', letterSpacing: '0.02em', transition: 'all 0.2s' }}
                        >
                            Preview deposit →
                        </button>
                    </>
                )}

                {step === 'preview' && (
                    <>
                        <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                            {[
                                { label: "You're depositing", value: `${amount} ${meta.underlyingSymbol}`, color: '#f5f4f0' },
                                { label: "You'll receive", value: `~${sharesDisplay} ${vault.symbol}`, color: '#00e87a' },
                                { label: 'APY', value: `${meta.apy}%`, color: '#d4f500' },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '13px', color: '#555' }}>{row.label}</span>
                                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: row.color }}>{row.value}</span>
                                </div>
                            ))}
                            <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: '#555' }}>Network</span>
                                <span style={{ fontSize: '12px', color: '#888' }}>Base</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setStep('input')} style={{ flex: 1, background: '#1a1a1a', color: '#888', fontFamily: 'Syne, sans-serif', fontWeight: 600, padding: '14px', borderRadius: '12px', border: '1px solid #2a2a2a', cursor: 'pointer', fontSize: '14px' }}>
                                Back
                            </button>
                            {isWrongChain ? (
                                <button onClick={() => switchChain({ chainId: supportedChains[0] as 1 | 8453 })} style={{ flex: 2, background: '#333', color: '#f5f4f0', fontFamily: 'Syne, sans-serif', fontWeight: 800, padding: '14px', borderRadius: '12px', border: '1px solid #555', cursor: 'pointer', fontSize: '15px' }}>
                                    Switch Network
                                </button>
                            ) : (
                                <button id="deposit-confirm-btn" onClick={handleConfirm} style={{ flex: 2, background: '#d4f500', color: '#0a0a0a', fontFamily: 'Syne, sans-serif', fontWeight: 800, padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '15px' }}>
                                    {needsApproval ? '⚡ Approve & Deposit' : '⚡ Confirm Deposit'}
                                </button>
                            )}
                        </div>
                    </>
                )}

                {isLoading && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '2px solid #2a2a2a', borderTop: '2px solid #d4f500', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        <div style={{ fontFamily: 'Syne, sans-serif', color: '#f5f4f0', fontSize: '14px', fontWeight: 600 }}>
                            {step === 'approving' ? 'Approving spend...' : `${depositStep === 'waiting' ? 'Confirming onchain...' : 'Submitting deposit...'}`}
                        </div>
                        <div style={{ color: '#555', fontSize: '12px', marginTop: '8px' }}>Check your wallet</div>
                    </div>
                )}

                {step === 'error' && (
                    <div>
                        <div style={{ background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '16px', color: '#ff6060', fontSize: '13px' }}>
                            {errorMsg}
                        </div>
                        <button onClick={() => setStep('input')} style={{ width: '100%', background: '#1a1a1a', color: '#888', fontFamily: 'Syne, sans-serif', padding: '14px', borderRadius: '12px', border: '1px solid #2a2a2a', cursor: 'pointer' }}>
                            Try again
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
