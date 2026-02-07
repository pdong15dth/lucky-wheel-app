'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LuckyWheel, { generateTargetRotation } from '@/components/LuckyWheel';
import ParticipantList from '@/components/ParticipantList';
import PrizeDisplay from '@/components/PrizeDisplay';
import QRCodeShare from '@/components/QRCodeShare';
import Dialog, { useDialog } from '@/components/Dialog';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import CountdownOverlay from '@/components/CountdownOverlay';
import {
    Participant,
    getParticipants,
    setWinner,
    resetGame,
    clearAllParticipants,
    subscribeToParticipantsRealtime,
    broadcastGameEvent
} from '@/lib/supabase';

export default function AdminPage() {
    const router = useRouter();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinTrigger, setSpinTrigger] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const [gameComplete, setGameComplete] = useState(false);
    const [checkinUrl, setCheckinUrl] = useState('');
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationData, setCelebrationData] = useState<{ name: string; prizeRank: 1 | 2 | 3 } | null>(null);
    const [isCheckinLocked, setIsCheckinLocked] = useState(false);
    const [currentTargetRotation, setCurrentTargetRotation] = useState<number | undefined>(undefined);
    const [showCountdown, setShowCountdown] = useState(false);
    const [pendingSpinData, setPendingSpinData] = useState<{ spinTrigger: number; targetRotation: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Custom dialog hook
    const { dialogState, showAlert, showConfirm, closeDialog } = useDialog();

    // Check authentication on mount
    useEffect(() => {
        const authStatus = sessionStorage.getItem('admin_authenticated');
        if (authStatus !== 'true') {
            router.replace('/');
            return;
        }
        setIsAuthenticated(true);
    }, [router]);

    const winners = {
        prize1: participants.find(p => p.prize_rank === 1) || null,
        prize2: participants.find(p => p.prize_rank === 2) || null,
        prize3: participants.find(p => p.prize_rank === 3) || null,
    };

    const activeParticipants = participants.filter(p => p.status === 'active');

    // Load participants on mount
    useEffect(() => {
        if (!isAuthenticated) return;

        const loadParticipants = async () => {
            setIsLoading(true);
            const data = await getParticipants();
            setParticipants(data);

            // Check if game is already in progress
            const winnerCount = data.filter(p => p.status === 'winner').length;
            if (winnerCount > 0) {
                setCurrentRound(winnerCount + 1);
                if (winnerCount >= 3) {
                    setGameComplete(true);
                }
            }

            setIsLoading(false);
        };

        loadParticipants();

        // Set checkin URL
        if (typeof window !== 'undefined') {
            setCheckinUrl(`${window.location.origin}/checkin`);
        }
    }, [isAuthenticated]);

    // Subscribe to real-time updates with direct payload handling
    useEffect(() => {
        if (!isAuthenticated) return;

        const unsubscribe = subscribeToParticipantsRealtime({
            onInsert: (newParticipant) => {
                console.log('📥 Adding new participant to state:', newParticipant.name);
                setParticipants(prev => {
                    // Check if already exists
                    if (prev.some(p => p.id === newParticipant.id)) {
                        return prev;
                    }
                    return [...prev, newParticipant];
                });
            },
            onUpdate: (updatedParticipant) => {
                console.log('📝 Updating participant in state:', updatedParticipant.name);
                setParticipants(prev =>
                    prev.map(p => p.id === updatedParticipant.id ? updatedParticipant : p)
                );
            },
            onDelete: (deletedParticipant) => {
                console.log('🗑️ Removing participant from state:', deletedParticipant.name);
                setParticipants(prev =>
                    prev.filter(p => p.id !== deletedParticipant.id)
                );
            }
        });

        return () => {
            unsubscribe();
        };
    }, [isAuthenticated]);


    // Handle spin - now shows countdown first
    const handleSpin = () => {
        if (!isCheckinLocked) {
            showAlert('Chưa khóa Check-in', 'Vui lòng khóa Check-in trước khi quay để đảm bảo công bằng!');
            return;
        }

        if (activeParticipants.length < 2) {
            showAlert('Chưa đủ người', 'Cần ít nhất 2 người tham gia để quay!');
            return;
        }

        if (gameComplete) {
            showAlert('Trò chơi kết thúc', 'Trò chơi đã kết thúc! Nhấn "Reset Game" để chơi lại.');
            return;
        }

        // Close any open celebration
        setShowCelebration(false);

        // Generate target rotation for sync
        const newSpinTrigger = spinTrigger + 1;
        const { targetRotation } = generateTargetRotation(activeParticipants.length);

        // Store pending spin data
        setPendingSpinData({ spinTrigger: newSpinTrigger, targetRotation });

        // Broadcast countdown event to guest pages
        broadcastGameEvent({
            type: 'countdown_start',
            data: { countdownSeconds: 5, spinTrigger: newSpinTrigger, targetRotation }
        });

        // Show countdown
        setShowCountdown(true);
    };

    // Handle countdown complete - start actual spin
    const handleCountdownComplete = () => {
        setShowCountdown(false);

        if (pendingSpinData) {
            setIsSpinning(true);
            setCurrentTargetRotation(pendingSpinData.targetRotation);
            setSpinTrigger(pendingSpinData.spinTrigger);

            // Broadcast spin event with exact rotation to guest pages
            broadcastGameEvent({
                type: 'wheel_spinning',
                data: pendingSpinData
            });

            setPendingSpinData(null);
        }
    };

    // Handle spin complete - Prize order: Round 1 = Prize 3, Round 2 = Prize 2, Round 3 = Prize 1
    const handleSpinComplete = useCallback(async (winner: Participant) => {
        setIsSpinning(false);

        // Calculate prize rank: Round 1 -> Prize 3, Round 2 -> Prize 2, Round 3 -> Prize 1
        const prizeRank = (4 - currentRound) as 1 | 2 | 3;

        // Update winner in database with correct prize rank
        const success = await setWinner(winner.id, prizeRank);

        if (success) {
            // Refresh participants
            const updatedParticipants = await getParticipants();
            setParticipants(updatedParticipants);

            // Show celebration with winner name
            setCelebrationData({ name: winner.name, prizeRank });
            setShowCelebration(true);

            if (currentRound >= 3) {
                setGameComplete(true);
            } else {
                setCurrentRound(prev => prev + 1);
            }
        }
    }, [currentRound]);

    // Handle reset game
    const handleResetGame = () => {
        showConfirm(
            'Reset Game',
            'Bạn có chắc muốn reset trò chơi? Tất cả người thắng sẽ được đặt lại.',
            async () => {
                const success = await resetGame();
                if (success) {
                    const updatedParticipants = await getParticipants();
                    setParticipants(updatedParticipants);
                    setCurrentRound(1);
                    setGameComplete(false);
                }
            }
        );
    };

    // Handle clear all
    const handleClearAll = () => {
        showConfirm(
            'Xóa tất cả',
            'Bạn có chắc muốn xóa tất cả người tham gia? Hành động này không thể hoàn tác.',
            async () => {
                const success = await clearAllParticipants();
                if (success) {
                    setParticipants([]);
                    setCurrentRound(1);
                    setGameComplete(false);
                }
            }
        );
    };

    // Handle lock/unlock checkin
    const handleToggleLock = async () => {
        const newLockState = !isCheckinLocked;
        setIsCheckinLocked(newLockState);

        await broadcastGameEvent({
            type: newLockState ? 'checkin_locked' : 'checkin_unlocked'
        });

        showAlert(
            newLockState ? '🔒 Đã khóa Check-in' : '🔓 Đã mở Check-in',
            newLockState
                ? 'Người dùng đang ở trang điểm danh sẽ được chuyển sang trang xem.'
                : 'Người dùng có thể điểm danh trở lại.'
        );
    };

    if (!isAuthenticated || isLoading) {
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
            {/* Custom Dialog */}
            <Dialog
                isOpen={dialogState.isOpen}
                onClose={closeDialog}
                title={dialogState.title}
                message={dialogState.message}
                type={dialogState.type}
                onConfirm={dialogState.onConfirm}
            />

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
                    Admin Dashboard • Round {currentRound}/3 • Giải {4 - currentRound}
                    {gameComplete && <span className="ml-2 text-[var(--neon-green)]">✓ Hoàn thành</span>}
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
                            targetRotation={currentTargetRotation}
                        />
                    </div>

                    {/* Control Buttons */}
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button
                            onClick={handleSpin}
                            disabled={isSpinning || activeParticipants.length < 2 || gameComplete || !isCheckinLocked}
                            className="cyber-button primary text-lg px-8 py-4"
                        >
                            {isSpinning ? (
                                <span className="flex items-center gap-2">
                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Đang quay...
                                </span>
                            ) : gameComplete ? (
                                'Đã hoàn thành!'
                            ) : !isCheckinLocked ? (
                                '🔒 Khóa Check-in để quay'
                            ) : (
                                `🎯 QUAY GIẢI ${4 - currentRound}`
                            )}
                        </button>

                        <button
                            onClick={handleResetGame}
                            disabled={isSpinning}
                            className="cyber-button"
                        >
                            🔄 Reset Game
                        </button>

                        <button
                            onClick={handleClearAll}
                            disabled={isSpinning}
                            className="cyber-button danger"
                        >
                            🗑️ Xóa tất cả
                        </button>

                        <button
                            onClick={handleToggleLock}
                            disabled={isSpinning}
                            className={`cyber-button ${isCheckinLocked ? 'primary' : ''}`}
                        >
                            {isCheckinLocked ? '🔓 Mở Check-in' : '🔒 Khóa Check-in'}
                        </button>
                    </div>

                    {!isCheckinLocked && !gameComplete && (
                        <p className="mt-4 text-[var(--neon-yellow)] text-sm">
                            🔓 Hãy khóa Check-in trước khi quay để đảm bảo công bằng
                        </p>
                    )}
                    {isCheckinLocked && activeParticipants.length < 2 && !gameComplete && (
                        <p className="mt-4 text-[var(--neon-yellow)] text-sm">
                            ⚠️ Cần thêm người tham gia để bắt đầu quay
                        </p>
                    )}
                </div>

                {/* Right Panel */}
                <div className="space-y-6">
                    {/* Prize Display */}
                    <PrizeDisplay winners={winners} />

                    {/* Participant List */}
                    <ParticipantList
                        participants={participants}
                        isAdmin={true}
                        onParticipantDeleted={async () => {
                            const updated = await getParticipants();
                            setParticipants(updated);
                        }}
                    />

                    {/* QR Code Share */}
                    {checkinUrl && <QRCodeShare checkinUrl={checkinUrl} />}
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 text-center text-[var(--text-muted)] text-sm">
                <p>© 2026 Tora Tech. All rights reserved.</p>
            </footer>
        </div>
    );
}
