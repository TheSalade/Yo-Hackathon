'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface YOdAnimationProps {
    active: boolean;
    asset: string;
    vaultId: string;
    amount: string;
    onDone: () => void;
    inline?: boolean;
}

export function YOdAnimation({ active, asset, vaultId, amount, onDone, inline }: YOdAnimationProps) {
    const particlesRef = useRef<HTMLDivElement>(null);
    const styleRefs = useRef<HTMLStyleElement[]>([]);
    const onDoneRef = useRef(onDone);

    useEffect(() => {
        onDoneRef.current = onDone;
    }, [onDone]);

    const spawnParticles = useCallback(() => {
        if (!particlesRef.current) return;
        const container = particlesRef.current;
        container.innerHTML = '';

        // Clean up old particle styles
        styleRefs.current.forEach(s => s.remove());
        styleRefs.current = [];

        for (let i = 0; i < 28; i++) {
            const startX = 50 + (Math.random() - 0.5) * 20;
            const startY = 45 + (Math.random() - 0.5) * 20;
            const angle = Math.random() * Math.PI * 2;
            const dist = 80 + Math.random() * 180;
            const endX = startX + Math.cos(angle) * dist;
            const endY = startY + Math.sin(angle) * dist;
            const size = 3 + Math.random() * 5;
            const isYellow = Math.random() > 0.45;
            const delay = Math.random() * 0.4;
            const duration = 0.8 + Math.random() * 0.4;
            const keyframeName = `yo-particle-${Date.now()}-${i}`;

            const style = document.createElement('style');
            style.textContent = `
        @keyframes ${keyframeName} {
          0% { left:${startX}%;top:${startY}%;opacity:1;transform:scale(1);}
          100% { left:${endX}%;top:${endY}%;opacity:0;transform:scale(0);}
        }
      `;
            document.head.appendChild(style);
            styleRefs.current.push(style);

            const p = document.createElement('div');
            p.style.cssText = `
        position:absolute;
        width:${size}px;height:${size}px;
        background:${isYellow ? '#d4f500' : '#00e87a'};
        border-radius:50%;
        animation:${keyframeName} ${duration}s ${delay}s ease-out forwards;
        left:${startX}%;top:${startY}%;
        pointer-events:none;
      `;
            container.appendChild(p);
        }
    }, []);

    useEffect(() => {
        if (!active) return;
        spawnParticles();
        const t = setTimeout(() => {
            onDoneRef.current();
            styleRefs.current.forEach(s => s.remove());
            styleRefs.current = [];
        }, 3500);
        return () => clearTimeout(t);
    }, [active, spawnParticles]);

    if (typeof window === 'undefined') return null;
    if (!active) return null;

    // Use lowercased asset for base token (e.g. usdc, weth)
    const baseAsset = asset.toLowerCase();

    // CSS Keyframes string for the token transformation
    const animationStyles = `
      @keyframes tokenSpinIn {
          0%   { transform: scale(0) rotate(0deg); opacity: 0; }
          15%  { transform: scale(1) rotate(360deg); opacity: 1; }
          70%  { transform: scale(1) rotate(1080deg); opacity: 1; filter: brightness(1); }
          85%  { transform: scale(0) rotate(1440deg); opacity: 0; filter: brightness(3); }
          100% { transform: scale(0) rotate(1440deg); opacity: 0; }
      }
      @keyframes letterFlyLeft {
          0%   { transform: translate(-100px, 0) scale(0) rotate(-180deg); opacity: 0; }
          15%  { transform: translate(-100px, 0) scale(0) rotate(-180deg); opacity: 0; }
          30%  { transform: translate(-60px, 0) scale(1) rotate(0deg); opacity: 1; }
          70%  { transform: translate(-40px, 0) scale(1) rotate(360deg); opacity: 1; }
          85%  { transform: translate(0, 0) scale(0) rotate(720deg); opacity: 0; filter: brightness(3); }
          100% { transform: translate(0, 0) scale(0) rotate(720deg); opacity: 0; }
      }
      @keyframes letterFlyRight {
          0%   { transform: translate(100px, 0) scale(0) rotate(180deg); opacity: 0; }
          15%  { transform: translate(100px, 0) scale(0) rotate(180deg); opacity: 0; }
          30%  { transform: translate(60px, 0) scale(1) rotate(0deg); opacity: 1; }
          70%  { transform: translate(40px, 0) scale(1) rotate(-360deg); opacity: 1; }
          85%  { transform: translate(0, 0) scale(0) rotate(-720deg); opacity: 0; filter: brightness(3); }
          100% { transform: translate(0, 0) scale(0) rotate(-720deg); opacity: 0; }
      }
      @keyframes vaultPopOut {
          0%   { transform: scale(0) rotate(-180deg); opacity: 0; }
          80%  { transform: scale(0) rotate(-180deg); opacity: 0; filter: brightness(3); }
          90%  { transform: scale(1.4) rotate(10deg); opacity: 1; filter: brightness(2); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(1); }
      }
      @keyframes portalFadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
      }
    `;

    const content = (
        <div
            style={{
                position: inline ? 'absolute' : 'fixed',
                inset: 0,
                background: inline ? 'rgba(10,10,10,0.85)' : 'rgba(10,10,10,0.96)',
                borderRadius: inline ? '44px' : '0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: inline ? 50 : 9000,
                animation: 'portalFadeIn 0.3s ease forwards',
                pointerEvents: 'all',
                backdropFilter: 'blur(8px)',
                overflow: 'hidden',
            }}
        >
            {/* Particles layer */}
            <div
                ref={particlesRef}
                style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
            />

            {/* Glow bg */}
            <div style={{
                position: 'absolute',
                width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(212,245,0,0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                pointerEvents: 'none',
            }} />


            <>
                <style>{animationStyles}</style>

                {/* Token Transformation Animation sequence */}
                <div style={{ position: 'relative', width: '120px', height: '120px', zIndex: 10 }}>
                    {/* Base Token */}
                    <img
                        src={`/tokens/${baseAsset}.svg`}
                        alt={baseAsset}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', animation: 'tokenSpinIn 1.6s forwards cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                    {/* Letter Y */}
                    <img
                        src={`/yo/letter_Y.svg`}
                        alt="Y"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', animation: 'letterFlyLeft 1.6s forwards cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                    {/* Letter O */}
                    <img
                        src={`/yo/letter_O.svg`}
                        alt="O"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', animation: 'letterFlyRight 1.6s forwards cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                    {/* Vault Token */}
                    <img
                        src={`/yo/${vaultId}.svg`}
                        alt={vaultId}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', animation: 'vaultPopOut 1.6s forwards cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    />
                </div>

                {/* Text lines */}
                <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '16px',
                    color: '#888',
                    marginTop: '32px',
                    opacity: 0,
                    animation: 'fadeUp 0.5s 1.6s ease forwards',
                    letterSpacing: '0.02em',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    Your {asset} has been
                </div>

                <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '32px',
                    fontWeight: 800,
                    color: '#f5f4f0',
                    marginTop: '8px',
                    opacity: 0,
                    animation: 'fadeUp 0.5s 1.8s ease forwards',
                    letterSpacing: '-0.5px',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    YO&apos;d ✦
                </div>

                <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#d4f500',
                    marginTop: '12px',
                    opacity: 0,
                    animation: 'fadeUp 0.5s 2.0s ease forwards',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    +{amount}
                </div>

                {/* Bottom hint */}
                <div style={{
                    position: 'absolute',
                    bottom: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: 0,
                    animation: 'fadeUp 0.5s 2.2s ease forwards',
                }}>
                    <div style={{ width: '6px', height: '6px', background: '#00e87a', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: '12px', color: '#555', letterSpacing: '0.1em' }}>Confirmed onchain</span>
                </div>
            </>
        </div>
    );

    return inline ? content : createPortal(content, document.body);
}
