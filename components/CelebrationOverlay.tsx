'use client';

import { useEffect, useState, useCallback } from 'react';

interface CelebrationOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    winnerName: string;
    prizeRank: 1 | 2 | 3;
}

const PRIZE_CONFIG = {
    3: {
        emoji: '🥉',
        title: 'GIẢI BA',
        subtitle: 'Chúc mừng!',
        bgGradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
        glowColor: 'rgba(205, 127, 50, 0.6)',
        particleCount: 25,
        duration: 4000,
    },
    2: {
        emoji: '🥈',
        title: 'GIẢI NHÌ',
        subtitle: 'Tuyệt vời!',
        bgGradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
        glowColor: 'rgba(192, 192, 192, 0.7)',
        particleCount: 40,
        duration: 5000,
    },
    1: {
        emoji: '🥇',
        title: 'GIẢI NHẤT',
        subtitle: '🎉 CHÚC MỪNG NGƯỜI CHIẾN THẮNG! 🎉',
        bgGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        glowColor: 'rgba(255, 215, 0, 0.8)',
        particleCount: 60,
        duration: 6000,
    },
};

export default function CelebrationOverlay({
    isOpen,
    onClose,
    winnerName,
    prizeRank,
}: CelebrationOverlayProps) {
    const [particles, setParticles] = useState<Array<{ id: number; left: string; delay: string; color: string }>>([]);
    const config = PRIZE_CONFIG[prizeRank];

    // Generate particles when opened
    useEffect(() => {
        if (isOpen) {
            const colors = ['#FFD700', '#00f5ff', '#ff00ff', '#f0ff00', '#ff0080', '#00ff9d', '#ffffff'];
            const newParticles = Array.from({ length: config.particleCount }, (_, i) => ({
                id: i,
                left: `${Math.random() * 100}%`,
                delay: `${Math.random() * 3}s`,
                color: colors[Math.floor(Math.random() * colors.length)],
            }));
            setParticles(newParticles);
            // No auto-close - user must manually dismiss
        }
    }, [isOpen, config.particleCount]);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
        >
            {/* Confetti particles */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="absolute w-3 h-3 rounded-sm"
                        style={{
                            left: p.left,
                            top: '-20px',
                            backgroundColor: p.color,
                            animation: `confettiFall 4s linear ${p.delay} infinite`,
                        }}
                    />
                ))}
            </div>

            {/* Main content card */}
            <div
                className="relative z-10 text-center p-8 md:p-12 rounded-2xl max-w-lg mx-4"
                style={{
                    background: 'linear-gradient(135deg, rgba(18, 18, 26, 0.98) 0%, rgba(30, 30, 45, 0.98) 100%)',
                    border: `3px solid`,
                    borderImage: config.bgGradient,
                    borderImageSlice: 1,
                    boxShadow: `0 0 80px ${config.glowColor}, 0 0 40px ${config.glowColor}`,
                    animation: prizeRank === 1 ? 'goldPulse 1s ease-in-out infinite alternate' : 'popIn 0.5s ease-out',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Trophy */}
                <div
                    className="text-8xl md:text-9xl mb-4"
                    style={{
                        animation: 'trophyBounce 1s ease-in-out infinite',
                        filter: `drop-shadow(0 0 30px ${config.glowColor})`,
                    }}
                >
                    {config.emoji}
                </div>

                {/* Title */}
                <h2
                    className="text-3xl md:text-5xl font-black mb-4 tracking-wider"
                    style={{
                        background: config.bgGradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: `drop-shadow(0 0 20px ${config.glowColor})`,
                    }}
                >
                    {config.title}
                </h2>

                {/* Winner name box */}
                <div
                    className="mb-6 p-4 rounded-xl"
                    style={{
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: `2px solid ${config.glowColor}`,
                    }}
                >
                    <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">
                        Người chiến thắng
                    </p>
                    <p
                        className="text-2xl md:text-4xl font-bold"
                        style={{
                            color: prizeRank === 1 ? '#FFD700' : prizeRank === 2 ? '#C0C0C0' : '#CD7F32',
                            textShadow: `0 0 20px ${config.glowColor}`,
                        }}
                    >
                        {winnerName}
                    </p>
                </div>

                {/* Subtitle */}
                <p className="text-lg text-gray-300 mb-8">
                    {config.subtitle}
                </p>

                {/* Continue button */}
                <button
                    onClick={handleClose}
                    className="px-8 py-3 text-lg font-bold uppercase tracking-wider rounded-lg transition-all hover:scale-105"
                    style={{
                        background: config.bgGradient,
                        color: '#000',
                        boxShadow: `0 0 30px ${config.glowColor}`,
                    }}
                >
                    Tiếp tục
                </button>
            </div>

            {/* Click anywhere to close */}
            <div
                className="absolute inset-0 cursor-pointer"
                onClick={handleClose}
            />

            {/* Inline styles for animations */}
            <style jsx>{`
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                @keyframes trophyBounce {
                    0%, 100% {
                        transform: translateY(0) scale(1);
                    }
                    50% {
                        transform: translateY(-15px) scale(1.05);
                    }
                }
                @keyframes popIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.5);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes goldPulse {
                    0% {
                        box-shadow: 0 0 60px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4);
                    }
                    100% {
                        box-shadow: 0 0 100px rgba(255, 215, 0, 0.9), 0 0 50px rgba(255, 215, 0, 0.6);
                    }
                }
            `}</style>
        </div>
    );
}
