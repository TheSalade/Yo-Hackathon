'use client';

import { useEffect, useRef } from 'react';

/**
 * Global custom cursor — identical to the one in SaveDashboard.
 * dot: 12×12px yellow #d4f500, mixBlendMode difference
 * ring: 36×36px rgba(212,245,0,0.4) border, cubic-bezier lag
 */
export function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let mx = 0, my = 0, rx = 0, ry = 0, af = 0;

        const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
        document.addEventListener('mousemove', onMove);

        // Hide OS cursor globally
        document.documentElement.style.setProperty('--cursor-hidden', 'none');
        const style = document.createElement('style');
        style.id = '__zyo-cursor-style';
        style.textContent = '*, *::before, *::after { cursor: none !important; }';
        document.head.appendChild(style);

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

        return () => {
            document.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(af);
            document.getElementById('__zyo-cursor-style')?.remove();
        };
    }, []);

    return (
        <>
            {/* Dot */}
            <div
                ref={dotRef}
                style={{
                    position: 'fixed',
                    width: 12, height: 12,
                    background: '#d4f500',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 99999,
                    mixBlendMode: 'difference',
                }}
            />
            {/* Lagging ring */}
            <div
                ref={ringRef}
                style={{
                    position: 'fixed',
                    width: 36, height: 36,
                    border: '1px solid rgba(212,245,0,0.4)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 99998,
                    transition: 'left 0.4s cubic-bezier(0.23,1,0.32,1), top 0.4s cubic-bezier(0.23,1,0.32,1)',
                }}
            />
        </>
    );
}
