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
        title: 'GIẢI BA',
        prizeValue: '5,000,000',
        subtitle: 'CHÚC MỪNG BẠN ĐÃ TRÚNG THƯỞNG!',
        primaryColor: '#CD7F32',
        secondaryColor: '#8B4513',
        gradientColors: ['#CD7F32', '#DAA520', '#B8860B'],
        particleCount: 40,
        ribbonColor: '#4169E1',
    },
    2: {
        title: 'GIẢI NHÌ',
        prizeValue: '7,500,000',
        subtitle: 'TUYỆT VỜI! BẠN THẬT MAY MẮN!',
        primaryColor: '#C0C0C0',
        secondaryColor: '#A8A8A8',
        gradientColors: ['#E8E8E8', '#C0C0C0', '#A0A0A0'],
        particleCount: 50,
        ribbonColor: '#4169E1',
    },
    1: {
        title: 'GIẢI NHẤT',
        prizeValue: '10,000,000',
        subtitle: 'XIN CHÚC MỪNG NGƯỜI CHIẾN THẮNG!',
        primaryColor: '#FFD700',
        secondaryColor: '#FFA500',
        gradientColors: ['#FFD700', '#FFC200', '#FFB000', '#FF9500'],
        particleCount: 80,
        ribbonColor: '#DC143C',
    },
};

interface Particle {
    id: number;
    x: number;
    delay: number;
    duration: number;
    color: string;
    size: number;
    swayAmount: number;
}

export default function CelebrationOverlay({
    isOpen,
    onClose,
    winnerName,
    prizeRank,
}: CelebrationOverlayProps) {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [showElements, setShowElements] = useState({
        medal: false,
        title: false,
        prize: false,
        winner: false,
        button: false,
    });
    const config = PRIZE_CONFIG[prizeRank];

    // Sequential animation reveal
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);

            // Stagger the reveal of elements - faster for mobile
            setTimeout(() => setShowElements(prev => ({ ...prev, medal: true })), 150);
            setTimeout(() => setShowElements(prev => ({ ...prev, title: true })), 350);
            setTimeout(() => setShowElements(prev => ({ ...prev, prize: true })), 550);
            setTimeout(() => setShowElements(prev => ({ ...prev, winner: true })), 750);
            setTimeout(() => setShowElements(prev => ({ ...prev, button: true })), 950);

            // Generate confetti particles
            const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9', '#FF7675', '#74B9FF', '#A29BFE'];
            const newParticles: Particle[] = Array.from({ length: config.particleCount }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                delay: Math.random() * 3,
                duration: 3 + Math.random() * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 6 + Math.random() * 8,
                swayAmount: 15 + Math.random() * 30,
            }));
            setParticles(newParticles);
        } else {
            setIsVisible(false);
            setShowElements({
                medal: false,
                title: false,
                prize: false,
                winner: false,
                button: false,
            });
        }
    }, [isOpen, config.particleCount]);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => {
            setShowElements({
                medal: false,
                title: false,
                prize: false,
                winner: false,
                button: false,
            });
            onClose();
        }, 200);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto py-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
            onClick={handleClose}
        >
            {/* Spotlight effect */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse 100% 80% at 50% 20%, ${config.primaryColor}25 0%, transparent 60%)`,
                }}
            />

            {/* Animated light rays for first prize */}
            {prizeRank === 1 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-1/2 left-1/2 origin-bottom"
                            style={{
                                width: '2px',
                                height: '120vh',
                                background: `linear-gradient(to top, transparent, ${config.primaryColor}30, transparent)`,
                                transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                                animation: `rayPulse 3s ease-in-out ${i * 0.2}s infinite`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Confetti particles */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="absolute"
                        style={{
                            left: `${p.x}%`,
                            top: '-5%',
                            width: `${p.size}px`,
                            height: `${p.size * 0.6}px`,
                            backgroundColor: p.color,
                            borderRadius: '2px',
                            animation: `confettiFall ${p.duration}s linear ${p.delay}s infinite`,
                            '--sway': `${p.swayAmount}px`,
                        } as React.CSSProperties}
                    />
                ))}
            </div>

            {/* Main content - optimized for mobile */}
            <div
                className="relative z-10 flex flex-col items-center text-center px-3 sm:px-4 w-full max-w-md mx-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Medal Section - Responsive sizing */}
                <div
                    className={`relative mb-2 sm:mb-4 transition-all duration-500 ${showElements.medal ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-75'}`}
                >
                    {/* Glow behind medal */}
                    <div
                        className="absolute inset-0 blur-2xl sm:blur-3xl rounded-full"
                        style={{
                            background: config.primaryColor,
                            opacity: 0.3,
                            transform: 'scale(1.5)',
                            animation: 'glowPulse 2s ease-in-out infinite',
                        }}
                    />

                    {/* Medal SVG - Responsive */}
                    <div className="relative">
                        <svg
                            viewBox="0 0 120 180"
                            className="w-24 h-32 sm:w-32 sm:h-44 md:w-40 md:h-56"
                            style={{ filter: `drop-shadow(0 8px 25px ${config.primaryColor}70)` }}
                        >
                            {/* Left ribbon */}
                            <path
                                d="M25 0 L25 90 L45 75 L45 0 Z"
                                fill={config.ribbonColor}
                                style={{ filter: 'brightness(1.1)' }}
                            />
                            <path
                                d="M25 90 L10 130 L45 100 L45 75 Z"
                                fill={config.ribbonColor}
                                style={{ filter: 'brightness(0.8)' }}
                            />

                            {/* Right ribbon */}
                            <path
                                d="M95 0 L95 90 L75 75 L75 0 Z"
                                fill={config.ribbonColor}
                                style={{ filter: 'brightness(1.1)' }}
                            />
                            <path
                                d="M95 90 L110 130 L75 100 L75 75 Z"
                                fill={config.ribbonColor}
                                style={{ filter: 'brightness(0.8)' }}
                            />

                            {/* Medal gradient */}
                            <defs>
                                <linearGradient id={`medalGrad${prizeRank}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    {config.gradientColors.map((color, idx) => (
                                        <stop
                                            key={idx}
                                            offset={`${(idx / (config.gradientColors.length - 1)) * 100}%`}
                                            stopColor={color}
                                        />
                                    ))}
                                </linearGradient>
                                <filter id="medalShadow">
                                    <feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity="0.3" />
                                </filter>
                            </defs>

                            {/* Medal circle */}
                            <circle
                                cx="60"
                                cy="110"
                                r="52"
                                fill={`url(#medalGrad${prizeRank})`}
                                filter="url(#medalShadow)"
                                style={{ animation: 'medalPulse 3s ease-in-out infinite' }}
                            />

                            {/* Inner ring */}
                            <circle
                                cx="60"
                                cy="110"
                                r="42"
                                fill="none"
                                stroke={config.secondaryColor}
                                strokeWidth="2"
                                opacity="0.4"
                            />

                            {/* Prize number */}
                            <text
                                x="60"
                                y="125"
                                textAnchor="middle"
                                fill={prizeRank === 2 ? '#4a4a4a' : '#ffffff'}
                                fontSize="48"
                                fontWeight="900"
                                fontFamily="Arial, sans-serif"
                                style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }}
                            >
                                {prizeRank}
                            </text>
                        </svg>

                        {/* Sparkles - fewer on mobile */}
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute text-sm sm:text-xl hidden sm:block"
                                style={{
                                    top: '50%',
                                    left: '50%',
                                    transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-70px)`,
                                    animation: `sparkle 2s ease-in-out ${i * 0.2}s infinite`,
                                    color: config.primaryColor,
                                }}
                            >
                                ✦
                            </div>
                        ))}
                    </div>
                </div>

                {/* Title - Responsive text */}
                <h1
                    className={`text-3xl sm:text-4xl md:text-5xl font-black mb-2 sm:mb-3 tracking-wide sm:tracking-wider transition-all duration-500 ${showElements.title ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                    style={{
                        background: `linear-gradient(180deg, ${config.gradientColors[0]} 0%, ${config.gradientColors[config.gradientColors.length - 1]} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: `drop-shadow(0 3px 15px ${config.primaryColor}50)`,
                    }}
                >
                    {config.title}
                </h1>

                {/* Prize Value Card - Compact on mobile */}
                <div
                    className={`relative mb-3 sm:mb-4 w-full transition-all duration-500 ${showElements.prize ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-5 scale-95'}`}
                >
                    <div
                        className="relative px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl mx-auto inline-block overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(20,20,30,0.9) 100%)',
                            border: `2px solid ${config.primaryColor}`,
                            boxShadow: `0 0 25px ${config.primaryColor}40, inset 0 0 20px ${config.primaryColor}15`,
                        }}
                    >
                        {/* Shine effect */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                                animation: 'shineMove 3s ease-in-out infinite',
                            }}
                        />

                        <div className="relative flex items-center justify-center gap-2 sm:gap-3">
                            <span className="text-2xl sm:text-3xl">💰</span>
                            <span
                                className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wide"
                                style={{
                                    color: config.primaryColor,
                                    textShadow: `0 0 20px ${config.primaryColor}, 0 0 40px ${config.primaryColor}70`,
                                }}
                            >
                                {config.prizeValue}
                            </span>
                            <span
                                className="text-lg sm:text-xl md:text-2xl font-bold"
                                style={{ color: config.primaryColor }}
                            >
                                VNĐ
                            </span>
                        </div>
                    </div>
                </div>

                {/* Winner Section - Compact */}
                <div
                    className={`w-full mb-4 sm:mb-5 transition-all duration-500 ${showElements.winner ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                >
                    <div
                        className="relative px-4 sm:px-6 py-4 sm:py-5 rounded-xl sm:rounded-2xl overflow-hidden"
                        style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.12)',
                        }}
                    >
                        <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-widest sm:tracking-[0.3em] mb-2 font-medium flex items-center justify-center gap-1 sm:gap-2">
                            <span>🏆</span>
                            <span>NGƯỜI CHIẾN THẮNG</span>
                            <span>🏆</span>
                        </p>
                        <p
                            className="text-2xl sm:text-3xl md:text-4xl font-black break-words"
                            style={{
                                color: '#ffffff',
                                textShadow: `0 0 25px ${config.primaryColor}70`,
                                animation: 'nameGlow 2s ease-in-out infinite',
                            }}
                        >
                            {winnerName}
                        </p>
                    </div>

                    <p
                        className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg font-medium px-2"
                        style={{
                            color: 'rgba(255,255,255,0.75)',
                        }}
                    >
                        🎉 {config.subtitle} 🎉
                    </p>
                </div>

                {/* Continue Button - Touch friendly */}
                <button
                    onClick={handleClose}
                    className={`group relative px-8 sm:px-10 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold sm:font-black text-base sm:text-lg uppercase tracking-wider overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 ${showElements.button ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                    style={{
                        background: `linear-gradient(135deg, ${config.gradientColors[0]} 0%, ${config.gradientColors[config.gradientColors.length - 1]} 100%)`,
                        color: '#1a1a2e',
                        boxShadow: `0 0 25px ${config.primaryColor}50, 0 8px 30px ${config.primaryColor}30`,
                        minHeight: '48px', // Touch target
                    }}
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <span>🎮</span>
                        <span>TIẾP TỤC</span>
                        <span>🎮</span>
                    </span>

                    {/* Hover shine */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                            animation: 'buttonShine 1.5s ease-in-out infinite',
                        }}
                    />
                </button>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg) translateX(0);
                        opacity: 1;
                    }
                    25% {
                        transform: translateY(25vh) rotate(180deg) translateX(var(--sway));
                    }
                    50% {
                        transform: translateY(50vh) rotate(360deg) translateX(calc(var(--sway) * -1));
                    }
                    75% {
                        transform: translateY(75vh) rotate(540deg) translateX(var(--sway));
                    }
                    100% {
                        transform: translateY(105vh) rotate(720deg) translateX(0);
                        opacity: 0;
                    }
                }
                
                @keyframes glowPulse {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scale(1.5);
                    }
                    50% {
                        opacity: 0.5;
                        transform: scale(1.8);
                    }
                }
                
                @keyframes medalPulse {
                    0%, 100% {
                        filter: brightness(1) drop-shadow(0 3px 6px rgba(0,0,0,0.3));
                    }
                    50% {
                        filter: brightness(1.15) drop-shadow(0 4px 12px rgba(0,0,0,0.4));
                    }
                }
                
                @keyframes sparkle {
                    0%, 100% {
                        opacity: 0.4;
                        transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) translateY(-70px) scale(0.8);
                    }
                    50% {
                        opacity: 1;
                        transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) translateY(-80px) scale(1.1);
                    }
                }
                
                @keyframes rayPulse {
                    0%, 100% {
                        opacity: 0.15;
                    }
                    50% {
                        opacity: 0.4;
                    }
                }
                
                @keyframes shineMove {
                    0% {
                        transform: translateX(-100%);
                    }
                    50%, 100% {
                        transform: translateX(100%);
                    }
                }
                
                @keyframes nameGlow {
                    0%, 100% {
                        text-shadow: 0 0 15px ${config.primaryColor}50;
                    }
                    50% {
                        text-shadow: 0 0 30px ${config.primaryColor}80, 0 0 50px ${config.primaryColor}50;
                    }
                }
                
                @keyframes buttonShine {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
}
