'use client';

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Participant } from '@/lib/supabase';

interface LuckyWheelProps {
    participants: Participant[];
    isSpinning: boolean;
    onSpinComplete: (winner: Participant) => void;
    spinTrigger: number;
    targetRotation?: number; // If provided, use this exact rotation (for sync)
    expectedWinnerId?: string; // If provided, use this winner (for sync consistency)
}

// Cyberpunk color palette for wheel segments
const SEGMENT_COLORS = [
    { bg: '#1a0a2e', border: '#9d00ff' },  // Deep purple
    { bg: '#0a1a2e', border: '#00f5ff' },  // Deep cyan
    { bg: '#2e0a1a', border: '#ff0080' },  // Deep pink
    { bg: '#0a2e1a', border: '#00ff9d' },  // Deep green
    { bg: '#2e1a0a', border: '#f0ff00' },  // Deep yellow
    { bg: '#1a0a1e', border: '#ff00ff' },  // Deep magenta
    { bg: '#0a1a1e', border: '#00d4ff' },  // Deep blue
    { bg: '#1e0a0a', border: '#ff0040' },  // Deep red
];

// === POINTER AND SEGMENT CALCULATION ===
// Pointer is fixed at TOP of the wheel = -π/2 radians (or 270° in canvas coordinates)
// Canvas: 0 = right (3 o'clock), angles increase CLOCKWISE
//
// When drawing, segment i is drawn from:
//   startAngle = rotation + i * segmentAngle
//   endAngle = rotation + (i+1) * segmentAngle
//
// To find which segment is under the pointer at angle -π/2:
//   We need: startAngle <= -π/2 < endAngle  (modulo 2π)
//   Which means: rotation + i*segmentAngle <= -π/2 < rotation + (i+1)*segmentAngle

const POINTER_ANGLE = -Math.PI / 2; // Top of wheel = -90° = -π/2

// Find which segment index is under the pointer, given the current wheel rotation
function getSegmentAtPointer(rotation: number, segmentCount: number): number {
    if (segmentCount === 0) return 0;
    const segmentAngle = (2 * Math.PI) / segmentCount;

    // Segment i starts at: rotation + i * segmentAngle
    // We need: rotation + i * segmentAngle <= POINTER_ANGLE (mod 2π)
    // So: i * segmentAngle <= POINTER_ANGLE - rotation (mod 2π)
    // i = floor((POINTER_ANGLE - rotation) / segmentAngle) mod segmentCount

    let angle = POINTER_ANGLE - rotation;
    // Normalize to [0, 2π)
    angle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    return Math.floor(angle / segmentAngle) % segmentCount;
}

// Calculate the rotation needed so that segment at segmentIndex is under the pointer
// The segment CENTER should align with the pointer
function getRotationForSegment(segmentIndex: number, segmentCount: number, fullRotations: number): number {
    const segmentAngle = (2 * Math.PI) / segmentCount;

    // Segment center is at: rotation + segmentIndex * segmentAngle + segmentAngle/2
    // We want segment center = POINTER_ANGLE
    // rotation + (segmentIndex + 0.5) * segmentAngle = POINTER_ANGLE
    // rotation = POINTER_ANGLE - (segmentIndex + 0.5) * segmentAngle

    const segmentCenterOffset = (segmentIndex + 0.5) * segmentAngle;
    const neededRotation = POINTER_ANGLE - segmentCenterOffset;

    // Add full rotations to make the wheel spin multiple times
    // Normalize neededRotation to [0, 2π) first
    const normalizedRotation = ((neededRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    return fullRotations * 2 * Math.PI + normalizedRotation;
}

// Helper to extract first name (last part in Vietnamese naming)
function getFirstName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1] || fullName;
}

// Helper to get initials from family + middle names
function getInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return '';
    return parts.slice(0, -1).map(p => p.charAt(0).toUpperCase()).join('');
}

// Generate smart display names for wheel - using alias if available
function generateDisplayNames(participants: Participant[]): Map<string, string> {
    const displayNames = new Map<string, string>();

    participants.forEach(p => {
        // Use alias if available, otherwise just the first name
        if (p.alias) {
            displayNames.set(p.id, p.alias);
        } else {
            displayNames.set(p.id, getFirstName(p.name));
        }
    });

    return displayNames;
}

export default function LuckyWheel({
    participants,
    isSpinning,
    onSpinComplete,
    spinTrigger,
    targetRotation,
    expectedWinnerId
}: LuckyWheelProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentRotation, setCurrentRotation] = useState(0);
    const animationRef = useRef<number | null>(null);
    const lastSpinTrigger = useRef(0);

    // All participants (for display on wheel) - SORTED BY ID for consistent order across all clients
    const allParticipants = participants
        .filter(p => p.status === 'active' || p.status === 'winner')
        .sort((a, b) => a.id.localeCompare(b.id));
    // Only active participants (for spinning logic) - also sorted
    const activeParticipants = participants
        .filter(p => p.status === 'active')
        .sort((a, b) => a.id.localeCompare(b.id));

    // Segment angle based on ALL participants (to keep wheel stable)
    const segmentAngle = allParticipants.length > 0 ? (2 * Math.PI) / allParticipants.length : 0;

    // Generate smart display names for the wheel
    const displayNames = useMemo(() => generateDisplayNames(allParticipants), [allParticipants]);

    // Draw the wheel
    const drawWheel = useCallback((rotation: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw outer glow
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 15, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.3)';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Draw outer ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (allParticipants.length === 0) {
            // Draw empty state
            ctx.fillStyle = '#12121a';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = '#606070';
            ctx.font = '18px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Đang chờ người tham gia...', centerX, centerY);
            return;
        }

        // Draw segments - show ALL participants (active + winners)
        allParticipants.forEach((participant, index) => {
            const startAngle = rotation + index * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const colorSet = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
            const isWinner = participant.status === 'winner';

            // Draw segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            // Gradient fill - dimmed for winners
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, radius
            );
            if (isWinner) {
                // Winner segments are darker/grayed out
                gradient.addColorStop(0, '#1a1a1a');
                gradient.addColorStop(1, '#2a2a2a');
            } else {
                gradient.addColorStop(0, colorSet.bg);
                gradient.addColorStop(1, colorSet.border + '40');
            }
            ctx.fillStyle = gradient;
            ctx.fill();

            // Segment border - dimmed for winners
            ctx.strokeStyle = isWinner ? '#444444' : colorSet.border;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle / 2);

            // Text styling - dimmed for winners
            ctx.fillStyle = isWinner ? '#666666' : '#ffffff';
            ctx.font = 'bold 12px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Use smart display name (alias or first name)
            let displayName = displayNames.get(participant.id) || participant.name;
            if (displayName.length > 12) {
                displayName = displayName.substring(0, 10) + '..';
            }

            // Add trophy emoji for winners
            if (isWinner && participant.prize_rank) {
                const trophy = participant.prize_rank === 1 ? '🥇' : participant.prize_rank === 2 ? '🥈' : '🥉';
                displayName = `${trophy} ${displayName}`;
            }

            // Position text
            const textDistance = radius * 0.65;
            ctx.fillText(displayName, textDistance, 0);

            ctx.restore();
        });

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
        const centerGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 35
        );
        centerGradient.addColorStop(0, '#1a1a2e');
        centerGradient.addColorStop(1, '#0a0a1e');
        ctx.fillStyle = centerGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw SPIN text in center
        ctx.fillStyle = '#00f5ff';
        ctx.font = 'bold 16px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SPIN', centerX, centerY);

    }, [allParticipants, segmentAngle, displayNames]);

    // Spin animation with easing - uses targetRotation if provided (for sync)
    // IMPORTANT: We spin to land on an ACTIVE participant, but the wheel shows ALL participants
    const spin = useCallback((providedTargetRotation?: number) => {
        if (activeParticipants.length < 2) return;

        // Use provided target or generate random one
        let deltaRotation: number; // How much to rotate FROM current position
        let winnerParticipant: Participant;

        if (providedTargetRotation !== undefined) {
            // If expectedWinnerId is provided, RECALCULATE rotation based on current wheel state
            // This is critical because participant count may have changed since rotation was calculated
            if (expectedWinnerId) {
                const expectedWinner = allParticipants.find(p => p.id === expectedWinnerId);
                if (expectedWinner) {
                    // NOTE: Due to a race condition, the Guest may receive the winner status update
                    // (via real-time subscription) BEFORE the spin animation starts.
                    // Since the Admin already validated this winner is active before broadcasting,
                    // we trust the expectedWinnerId and proceed with the animation.
                    if (expectedWinner.status !== 'active') {
                        console.warn('⚠️ Expected winner status changed (race condition - proceeding anyway):', {
                            expectedWinnerId,
                            status: expectedWinner.status,
                            note: 'This is expected when admin updates DB before guest spin completes'
                        });
                        // Continue anyway - admin already validated this winner
                    }
                    winnerParticipant = expectedWinner;

                    // RECALCULATE rotation for current wheel configuration
                    // Find winner's current index in allParticipants
                    const winnerIndex = allParticipants.findIndex(p => p.id === expectedWinnerId);

                    // Recalculate rotation to land on this segment with current segment count
                    // Use same number of full rotations as originally intended
                    const originalFullRotations = Math.floor(providedTargetRotation / (2 * Math.PI));
                    const fullRotations = Math.max(5, originalFullRotations); // At least 5 full rotations
                    deltaRotation = getRotationForSegment(winnerIndex, allParticipants.length, fullRotations);

                    console.log('🎯 Spin with expected winner (RECALCULATED):', {
                        expectedWinnerId,
                        winner: winnerParticipant?.alias || winnerParticipant?.name,
                        status: winnerParticipant?.status,
                        winnerIndex,
                        currentParticipantCount: allParticipants.length,
                        originalRotation: providedTargetRotation * 180 / Math.PI,
                        recalculatedRotation: deltaRotation * 180 / Math.PI
                    });
                } else {
                    // Fallback: use provided rotation if winner not found
                    deltaRotation = providedTargetRotation;
                    const finalRotation = deltaRotation;
                    const targetSegmentIndex = getSegmentAtPointer(finalRotation, allParticipants.length);
                    winnerParticipant = allParticipants[targetSegmentIndex];
                    console.log('🎯 Spin fallback (expected winner not found):', { expectedWinnerId });
                }
            } else {
                // No expectedWinnerId, use provided rotation
                deltaRotation = providedTargetRotation;
                const finalRotation = deltaRotation;
                const targetSegmentIndex = getSegmentAtPointer(finalRotation, allParticipants.length);
                winnerParticipant = allParticipants[targetSegmentIndex];
                console.log('🎯 Spin with provided rotation (no expected winner):', {
                    deltaRotation: deltaRotation * 180 / Math.PI,
                    finalRotation: finalRotation * 180 / Math.PI,
                    targetSegmentIndex,
                    winner: winnerParticipant?.alias || winnerParticipant?.name
                });
            }
        } else {
            // Pick a random ACTIVE participant
            const activeWinnerIndex = Math.floor(Math.random() * activeParticipants.length);
            winnerParticipant = activeParticipants[activeWinnerIndex];
            // Find their position in allParticipants array
            const allParticipantsIndex = allParticipants.findIndex(p => p.id === winnerParticipant.id);
            // Calculate rotation to land on that segment
            const fullRotations = 5 + Math.random() * 5;
            // getRotationForSegment returns the ABSOLUTE rotation needed
            // We need DELTA from current position
            const targetAbsoluteRotation = getRotationForSegment(allParticipantsIndex, allParticipants.length, fullRotations);
            deltaRotation = targetAbsoluteRotation - currentRotation;
            // Make sure deltaRotation is positive (spin forward)
            if (deltaRotation < 0) {
                deltaRotation += 2 * Math.PI * Math.ceil(-deltaRotation / (2 * Math.PI));
            }
            console.log('🎯 Random spin:', {
                currentRotation: currentRotation * 180 / Math.PI,
                targetAbsoluteRotation: targetAbsoluteRotation * 180 / Math.PI,
                deltaRotation: deltaRotation * 180 / Math.PI,
                allParticipantsIndex,
                winner: winnerParticipant?.alias || winnerParticipant?.name
            });
        }

        // IMPORTANT: Always start from rotation 0 for perfect sync across all clients
        // This ensures admin and guest wheels are always in sync
        const startRotation = 0;
        setCurrentRotation(0);  // Reset to 0 immediately

        const totalRotation = deltaRotation;
        const duration = 5000; // 5 seconds
        const startTime = performance.now();

        // Easing function (ease-out cubic)
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);

            const newRotation = startRotation + totalRotation * easedProgress;
            setCurrentRotation(newRotation);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Animation complete - return the winner
                if (winnerParticipant) {
                    onSpinComplete(winnerParticipant);
                }
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        // Return the delta rotation for broadcasting
        return deltaRotation;
    }, [activeParticipants, allParticipants, currentRotation, segmentAngle, onSpinComplete, expectedWinnerId]);

    // Trigger spin when spinTrigger changes
    useEffect(() => {
        // When targetRotation is provided, we MUST have expectedWinnerId for consistency
        // Only spin when both are available (for synced spins) or neither (for local spins)
        const hasSyncData = targetRotation !== undefined;
        const hasExpectedWinner = expectedWinnerId !== undefined;

        if (spinTrigger > 0 && spinTrigger !== lastSpinTrigger.current && isSpinning) {
            // For synced spins (from admin/guest), require both targetRotation and expectedWinnerId
            if (hasSyncData && !hasExpectedWinner) {
                console.log('⏳ Waiting for expectedWinnerId before spinning...');
                return; // Wait for expectedWinnerId to be set
            }

            lastSpinTrigger.current = spinTrigger;
            console.log('🎰 Triggering spin with:', { targetRotation, expectedWinnerId });
            spin(targetRotation);
        }
    }, [spinTrigger, isSpinning, spin, targetRotation, expectedWinnerId]);

    // Draw wheel on rotation change
    useEffect(() => {
        drawWheel(currentRotation);
    }, [currentRotation, drawWheel]);

    // Initial draw and redraw on participants change
    useEffect(() => {
        drawWheel(currentRotation);
    }, [participants, drawWheel, currentRotation]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div className="wheel-container">
            {/* Pointer */}
            <div className="wheel-pointer" />

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                width={500}
                height={500}
                className="max-w-full"
                style={{
                    filter: isSpinning ? 'drop-shadow(0 0 30px rgba(0, 245, 255, 0.5))' : 'none',
                    transition: 'filter 0.3s ease'
                }}
            />
        </div>
    );
}

// Helper function to generate target rotation (to be called by admin)
// This returns the TOTAL rotation - how much the wheel should spin FROM 0
// The wheel always resets to 0 before spinning for perfect sync
// activeParticipants: list of active participants (for random selection)
// allParticipants: list of all participants on wheel (for angle calculation)
export function generateTargetRotation(
    activeParticipants: Participant[],
    allParticipants: Participant[],
    logInfo?: { testCycle: number; prizeRound: number }
): { targetRotation: number; winnerIndex: number; winnerId: string } {
    // CRITICAL: Ensure we have active participants to choose from
    if (activeParticipants.length === 0) {
        throw new Error('No active participants available for selection');
    }

    const fullRotations = 5 + Math.random() * 5; // 5-10 full rotations

    // Random pick from ACTIVE participants ONLY
    const activeWinnerIndex = Math.floor(Math.random() * activeParticipants.length);
    const winner = activeParticipants[activeWinnerIndex];

    // CRITICAL: Validate the winner is truly active (double-check)
    if (winner.status !== 'active') {
        console.error('❌ generateTargetRotation: Selected non-active participant!', winner);
        throw new Error('Selected participant is not active');
    }

    // Find winner's position in allParticipants array
    const allParticipantsIndex = allParticipants.findIndex(p => p.id === winner.id);

    // Calculate the rotation needed to land on this segment
    // getRotationForSegment calculates: POINTER_ANGLE - (segmentIndex + 0.5) * segmentAngle + fullRotations * 2π
    // This is the ABSOLUTE rotation from 0 that lands the segment center under the pointer
    const targetRotation = getRotationForSegment(allParticipantsIndex, allParticipants.length, fullRotations);

    console.log('🎲 generateTargetRotation:', {
        winner: winner.alias || winner.name,
        winnerStatus: winner.status,
        allParticipantsIndex,
        totalParticipants: allParticipants.length,
        activeCount: activeParticipants.length,
        targetRotationDegrees: targetRotation * 180 / Math.PI
    });

    // === SPIN STATISTICS LOGGING ===
    // Save spin result to file via API for fairness analysis
    if (typeof window !== 'undefined') {
        fetch('/api/spin-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                testCycle: logInfo?.testCycle ?? 0,
                prizeRound: logInfo?.prizeRound ?? 0,
                winnerId: winner.id,
                winnerName: winner.name,
                winnerAlias: winner.alias,
                winnerIndex: allParticipantsIndex,
                activeCount: activeParticipants.length,
                totalCount: allParticipants.length,
                allActiveNames: activeParticipants.map(p => p.alias || p.name)
            })
        })
            .then(res => res.json())
            .then(data => console.log('📊 Spin logged to file:', data))
            .catch(err => console.error('Failed to log spin:', err));
    }

    return {
        targetRotation,
        winnerIndex: allParticipantsIndex,
        winnerId: winner.id
    };
}

// === STATISTICS HELPER FUNCTIONS ===
// Call these from browser console: getSpinStats(), clearSpinStats()

// Get spin statistics summary
export function getSpinStats(): void {
    if (typeof window === 'undefined') return;

    const spinLog = JSON.parse(localStorage.getItem('spin_statistics') || '[]');

    if (spinLog.length === 0) {
        console.log('📊 No spin data recorded yet.');
        return;
    }

    // Count wins per participant
    const winCounts: Record<string, { name: string; count: number }> = {};

    spinLog.forEach((spin: { winnerName: string; winnerAlias: string }) => {
        const key = spin.winnerAlias || spin.winnerName;
        if (!winCounts[key]) {
            winCounts[key] = { name: key, count: 0 };
        }
        winCounts[key].count++;
    });

    // Sort by count descending
    const sorted = Object.values(winCounts).sort((a, b) => b.count - a.count);

    console.log('\n📊 ===== SPIN STATISTICS =====');
    console.log(`Total spins: ${spinLog.length}`);
    console.log('\nWin distribution:');
    console.table(sorted.map(w => ({
        'Người chơi': w.name,
        'Số lần thắng': w.count,
        'Tỉ lệ %': ((w.count / spinLog.length) * 100).toFixed(1) + '%'
    })));

    // Chi-square test hint
    const expectedPerPerson = spinLog.length / sorted.length;
    console.log(`\nExpected wins per person (if fair): ${expectedPerPerson.toFixed(2)}`);
    console.log('Raw data:', spinLog);
}

// Clear spin statistics
export function clearSpinStats(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('spin_statistics');
    console.log('🗑️ Spin statistics cleared.');
}

// Make functions available globally in browser
if (typeof window !== 'undefined') {
    (window as unknown as { getSpinStats: typeof getSpinStats; clearSpinStats: typeof clearSpinStats }).getSpinStats = getSpinStats;
    (window as unknown as { getSpinStats: typeof getSpinStats; clearSpinStats: typeof clearSpinStats }).clearSpinStats = clearSpinStats;
}
