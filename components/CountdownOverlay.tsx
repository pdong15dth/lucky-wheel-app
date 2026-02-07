'use client';

import { useState, useEffect, useCallback } from 'react';

interface CountdownOverlayProps {
    isOpen: boolean;
    seconds: number;
    onComplete: () => void;
}

export default function CountdownOverlay({
    isOpen,
    seconds,
    onComplete
}: CountdownOverlayProps) {
    const [count, setCount] = useState(seconds);

    useEffect(() => {
        if (isOpen) {
            setCount(seconds);

            const interval = setInterval(() => {
                setCount(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [isOpen, seconds]);

    // Call onComplete when countdown reaches 0
    useEffect(() => {
        if (isOpen && count === 0) {
            const timer = setTimeout(() => {
                onComplete();
            }, 500); // Small delay after showing 0
            return () => clearTimeout(timer);
        }
    }, [count, isOpen, onComplete]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            {/* Animated rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                    className="absolute w-64 h-64 border-4 border-[var(--neon-cyan)] rounded-full animate-ping opacity-20"
                    style={{ animationDuration: '1s' }}
                />
                <div
                    className="absolute w-48 h-48 border-4 border-[var(--neon-magenta)] rounded-full animate-ping opacity-30"
                    style={{ animationDuration: '1.5s' }}
                />
                <div
                    className="absolute w-32 h-32 border-4 border-[var(--neon-yellow)] rounded-full animate-ping opacity-40"
                    style={{ animationDuration: '2s' }}
                />
            </div>

            {/* Main countdown display */}
            <div className="relative z-10 text-center">
                {count > 0 ? (
                    <>
                        <div
                            key={count}
                            className="countdown-number"
                            style={{
                                fontSize: 'clamp(8rem, 25vw, 12rem)',
                                fontWeight: 900,
                                color: 'var(--neon-cyan)',
                                textShadow: `
                                    0 0 20px var(--neon-cyan),
                                    0 0 40px var(--neon-cyan),
                                    0 0 80px var(--neon-cyan),
                                    0 0 120px var(--neon-magenta)
                                `,
                                animation: 'countdown-pulse 1s ease-out',
                            }}
                        >
                            {count}
                        </div>
                        <p className="mt-4 text-[var(--text-secondary)] text-2xl tracking-wider uppercase">
                            Sẵn sàng...
                        </p>
                    </>
                ) : (
                    <div
                        className="go-text"
                        style={{
                            fontSize: 'clamp(4rem, 15vw, 8rem)',
                            fontWeight: 900,
                            color: 'var(--neon-green)',
                            textShadow: `
                                0 0 20px var(--neon-green),
                                0 0 40px var(--neon-green),
                                0 0 80px var(--neon-green)
                            `,
                            animation: 'go-appear 0.5s ease-out',
                        }}
                    >
                        QUAY!
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes countdown-pulse {
                    0% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(0.8);
                        opacity: 0.5;
                    }
                }

                @keyframes go-appear {
                    0% {
                        transform: scale(3);
                        opacity: 0;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                .countdown-number {
                    line-height: 1;
                }

                .go-text {
                    line-height: 1;
                }
            `}</style>
        </div>
    );
}
