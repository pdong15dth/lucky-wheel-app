'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import LuckyWheel from '@/components/LuckyWheel';
import PrizeDisplay from '@/components/PrizeDisplay';
import ParticipantList from '@/components/ParticipantList';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import CountdownOverlay from '@/components/CountdownOverlay';
import {
    Participant,
    getParticipants,
    subscribeToParticipantsRealtime,
    subscribeToGameEvents
} from '@/lib/supabase';

export default function GuestPage() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinTrigger, setSpinTrigger] = useState(0);
    const [targetRotation, setTargetRotation] = useState<number | undefined>(undefined);
    const [expectedWinnerId, setExpectedWinnerId] = useState<string | undefined>(undefined);
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationData, setCelebrationData] = useState<{ name: string; prizeRank: 1 | 2 | 3 } | null>(null);
    const [showCountdown, setShowCountdown] = useState(false);
    const [pendingSpinData, setPendingSpinData] = useState<{ spinTrigger: number; targetRotation: number; winnerId?: string } | null>(null);

    const winners = {
        prize1: participants.find(p => p.prize_rank === 1) || null,
        prize2: participants.find(p => p.prize_rank === 2) || null,
        prize3: participants.find(p => p.prize_rank === 3) || null,
    };

    // Load participants on mount
    useEffect(() => {
        const loadParticipants = async () => {
            setIsLoading(true);
            const data = await getParticipants();
            setParticipants(data);
            setIsLoading(false);
        };

        loadParticipants();
    }, []);

    // Subscribe to real-time updates
    useEffect(() => {
        const unsubscribe = subscribeToParticipantsRealtime({
            onInsert: (newParticipant) => {
                setParticipants(prev => {
                    if (prev.some(p => p.id === newParticipant.id)) {
                        return prev;
                    }
                    return [newParticipant, ...prev]; // Add to beginning for newest first
                });
            },
            onUpdate: (updatedParticipant) => {
                setParticipants(prev =>
                    prev.map(p => p.id === updatedParticipant.id ? updatedParticipant : p)
                );

                // Show celebration when a winner is set
                if (updatedParticipant.status === 'winner' && updatedParticipant.prize_rank) {
                    setCelebrationData({
                        name: updatedParticipant.name,
                        prizeRank: updatedParticipant.prize_rank as 1 | 2 | 3
                    });
                    setShowCelebration(true);
                }
            },
            onDelete: (deletedParticipant) => {
                setParticipants(prev =>
                    prev.filter(p => p.id !== deletedParticipant.id)
                );
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Subscribe to game events (for wheel sync, countdown, lock/unlock, reset)
    useEffect(() => {
        const unsubscribe = subscribeToGameEvents((event) => {
            console.log('🎮 Guest received event:', event);

            if (event.type === 'countdown_start' && event.data?.spinTrigger && event.data?.targetRotation !== undefined) {
                // Auto-close celebration overlay if open
                setShowCelebration(false);

                // Store pending spin data including winnerId for sync consistency
                setPendingSpinData({
                    spinTrigger: event.data.spinTrigger,
                    targetRotation: event.data.targetRotation,
                    winnerId: event.data.winnerId
                });

                // Show countdown
                setShowCountdown(true);
            }

            if (event.type === 'wheel_spinning' && event.data?.spinTrigger) {
                // Sync wheel spin with admin using exact rotation
                setIsSpinning(true);
                setSpinTrigger(event.data.spinTrigger);
                if (event.data.targetRotation !== undefined) {
                    setTargetRotation(event.data.targetRotation);
                }
            }

            if (event.type === 'game_reset') {
                // Reload participants when game is reset
                getParticipants().then(setParticipants);
                setIsSpinning(false);
                setSpinTrigger(0);
                setTargetRotation(undefined);
                setShowCountdown(false);
                setPendingSpinData(null);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Handle countdown complete on guest side
    const handleCountdownComplete = useCallback(() => {
        setShowCountdown(false);

        if (pendingSpinData) {
            setIsSpinning(true);
            setSpinTrigger(pendingSpinData.spinTrigger);
            setTargetRotation(pendingSpinData.targetRotation);
            setExpectedWinnerId(pendingSpinData.winnerId);  // Set expected winner for sync
            setPendingSpinData(null);
        }
    }, [pendingSpinData]);

    // Handle spin complete on guest side
    const handleSpinComplete = () => {
        setIsSpinning(false);
    };

    const activeParticipants = participants.filter(p => p.status === 'active');
    const gameComplete = winners.prize1 && winners.prize2 && winners.prize3;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-[var(--neon-cyan)] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="neon-text-cyan text-lg">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            {/* Celebration Overlay */}
            {celebrationData && (
                <CelebrationOverlay
                    isOpen={showCelebration}
                    onClose={() => setShowCelebration(false)}
                    winnerName={celebrationData.name}
                    prizeRank={celebrationData.prizeRank}
                />
            )}

            {/* Countdown Overlay */}
            <CountdownOverlay
                isOpen={showCountdown}
                seconds={5}
                onComplete={handleCountdownComplete}
            />

            {/* Header */}
            <header className="text-center mb-8">
                <Image
                    src="/tora-tech-logo.svg"
                    alt="Tora Tech Logo"
                    width={200}
                    height={70}
                    className="mx-auto mb-4"
                    priority
                />
                <h1
                    className="text-3xl md:text-5xl font-bold mb-2 neon-text-cyan glitch"
                    data-text="VÒNG QUAY MAY MẮN"
                >
                    VÒNG QUAY MAY MẮN
                </h1>
                <p className="text-[var(--text-secondary)] text-lg">
                    📺 Chế độ xem • {activeParticipants.length} người đang tham gia
                    {gameComplete && <span className="ml-2 text-[var(--neon-green)]">✓ Hoàn thành</span>}
                    {isSpinning && <span className="ml-2 text-[var(--neon-yellow)] animate-pulse">🎡 Đang quay...</span>}
                </p>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Panel - Wheel */}
                <div className="lg:col-span-2 flex flex-col items-center">
                    <div className="mb-6">
                        <LuckyWheel
                            participants={participants}
                            isSpinning={isSpinning}
                            onSpinComplete={handleSpinComplete}
                            spinTrigger={spinTrigger}
                            targetRotation={targetRotation}
                            expectedWinnerId={expectedWinnerId}
                        />
                    </div>

                    {/* Status message */}
                    <div className="text-center p-4 cyber-card">
                        <p className="text-[var(--neon-cyan)] text-lg">
                            {isSpinning ? '🎡 Vòng quay đang quay...' : '👀 Bạn đang xem trực tiếp vòng quay'}
                        </p>
                        <p className="text-[var(--text-secondary)] text-sm mt-2">
                            {isSpinning ? 'Chờ kết quả...' : 'Kết quả sẽ hiển thị ngay khi có người trúng giải!'}
                        </p>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="space-y-6">
                    {/* Prize Display */}
                    <PrizeDisplay winners={winners} />

                    {/* Participant List */}
                    <ParticipantList participants={participants} />
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 text-center text-[var(--text-muted)] text-sm">
                <p>© 2026 Tora Tech. All rights reserved.</p>
            </footer>
        </div>
    );
}
