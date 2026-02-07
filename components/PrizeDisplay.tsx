'use client';

import { Participant } from '@/lib/supabase';

interface PrizeDisplayProps {
    winners: {
        prize1: Participant | null;
        prize2: Participant | null;
        prize3: Participant | null;
    };
}

export default function PrizeDisplay({ winners }: PrizeDisplayProps) {
    const prizes = [
        { rank: 1, label: 'Giải Nhất', icon: '🥇', winner: winners.prize1 },
        { rank: 2, label: 'Giải Nhì', icon: '🥈', winner: winners.prize2 },
        { rank: 3, label: 'Giải Ba', icon: '🥉', winner: winners.prize3 },
    ];

    return (
        <div className="cyber-card">
            <h3 className="text-lg font-bold mb-4 neon-text-magenta flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                Bảng Giải Thưởng
            </h3>

            <div className="space-y-2">
                {prizes.map(({ rank, label, icon, winner }) => (
                    <div
                        key={rank}
                        className={`prize-slot ${winner ? 'winner winner-celebration' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{icon}</span>
                            <div className="flex-1">
                                <p className="prize-label">{label}</p>
                                <p className={`prize-winner ${!winner ? 'text-[var(--text-muted)]' : ''}`}>
                                    {winner ? winner.name : '---'}
                                </p>
                            </div>
                            {winner && (
                                <div className="flex items-center gap-1">
                                    <span className="inline-block w-3 h-3 bg-[var(--neon-green)] rounded-full animate-pulse"></span>
                                    <span className="text-xs text-[var(--neon-green)]">WINNER</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
