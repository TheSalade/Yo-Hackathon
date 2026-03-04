'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { useRedeem, useShareBalance } from '@yo-protocol/react';
import type { VaultConfig } from '@yo-protocol/core';
import { VAULT_META } from '@/lib/constants';

interface WithdrawModalProps {
    vault: VaultConfig;
    onClose: () => void;
}

type Step = 'input' | 'redeeming' | 'done' | 'error';

export function WithdrawModal({ vault, onClose }: WithdrawModalProps) {
    const { address } = useAccount();
    const meta = VAULT_META[vault.symbol];

    const [amount, setAmount] = useState('');
    const [step, setStep] = useState<Step>('input');
    const [errorMsg, setErrorMsg] = useState('');

    const decimals = vault.underlying.decimals;
    const parsedShares = amount && !isNaN(Number(amount)) && Number(amount) > 0
        ? parseUnits(amount, decimals)
        : undefined;

    // useShareBalance(vault, account) → { shares }
    const { shares: shareBalance } = useShareBalance(vault.symbol, address);
    const maxShares = shareBalance
        ? Number(formatUnits(shareBalance, decimals)).toFixed(4)
        : '0';

    // useRedeem({ vault, onConfirmed, onError }) → { redeem(shares: bigint), step, isLoading, isSuccess }
    const {
        redeem,
        isLoading: isRedeeming,
        isSuccess: redeemSuccess,
        step: redeemStep,
    } = useRedeem({
        vault: vault.symbol,
        onError: (e) => { setErrorMsg(e.message || 'Redemption failed'); setStep('error'); },
    });

    useEffect(() => {
        if (redeemSuccess) setStep('done');
    }, [redeemSuccess]);

    const handleConfirm = async () => {
        if (!parsedShares) return;
        try {
            setStep('redeeming');
            await redeem(parsedShares);
        } catch (e: unknown) {
            const err = e as Error;
            setErrorMsg(err.message || 'Transaction failed');
            setStep('error');
        }
    };

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, backdropFilter: 'blur(4px)' }} />

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800, color: '#f5f4f0', letterSpacing: '-0.5px' }}>
                            Withdraw {meta.underlyingSymbol}
                        </div>
                        <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>Redeem your {vault.symbol} shares</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>✕</button>
                </div>

                {step === 'input' && (
                    <>
                        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#555' }}>Available shares</span>
                            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: '#f5f4f0' }}>{maxShares} {vault.symbol}</span>
                        </div>

                        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Shares to redeem</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                    id="withdraw-amount-input"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700, color: '#f5f4f0', letterSpacing: '-1px' }}
                                />
                                <button onClick={() => setAmount(maxShares)} style={{ background: 'rgba(212,245,0,0.1)', border: '1px solid rgba(212,245,0,0.2)', borderRadius: '8px', padding: '6px 10px', color: '#d4f500', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                                    MAX
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={onClose} style={{ flex: 1, background: '#1a1a1a', color: '#888', fontFamily: 'Syne, sans-serif', fontWeight: 600, padding: '14px', borderRadius: '12px', border: '1px solid #2a2a2a', cursor: 'pointer', fontSize: '14px' }}>
                                Cancel
                            </button>
                            <button
                                id="withdraw-confirm-btn"
                                onClick={handleConfirm}
                                disabled={!parsedShares}
                                style={{ flex: 2, background: parsedShares ? '#f5f4f0' : '#1a1a1a', color: parsedShares ? '#0a0a0a' : '#555', fontFamily: 'Syne, sans-serif', fontWeight: 800, padding: '14px', borderRadius: '12px', border: 'none', cursor: parsedShares ? 'pointer' : 'not-allowed', fontSize: '15px', transition: 'all 0.2s' }}
                            >
                                Request Redeem
                            </button>
                        </div>
                    </>
                )}

                {(step === 'redeeming' || isRedeeming) && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '2px solid #2a2a2a', borderTop: '2px solid #d4f500', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        <div style={{ fontFamily: 'Syne, sans-serif', color: '#f5f4f0', fontSize: '14px', fontWeight: 600 }}>
                            {redeemStep === 'waiting' ? 'Waiting for confirmation...' : 'Processing redemption...'}
                        </div>
                        <div style={{ color: '#555', fontSize: '12px', marginTop: '8px' }}>Check your wallet</div>
                    </div>
                )}

                {step === 'done' && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <div style={{ fontFamily: 'Syne, sans-serif', color: '#f5f4f0', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Redemption submitted</div>
                        <div style={{ color: '#555', fontSize: '12px', marginBottom: '24px' }}>Funds will arrive within the redemption window</div>
                        <button onClick={onClose} style={{ background: '#d4f500', color: '#0a0a0a', fontFamily: 'Syne, sans-serif', fontWeight: 700, padding: '14px 32px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>Done</button>
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
