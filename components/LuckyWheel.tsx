'use client';

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Participant } from '@/lib/supabase';

interface LuckyWheelProps {
    participants: Participant[];
    isSpinning: boolean;
    onSpinComplete: (winner: Participant) => void;
    spinTrigger: number;
    targetRotation?: number; // If provided, use this exact rotation (for sync)
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
    targetRotation
}: LuckyWheelProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentRotation, setCurrentRotation] = useState(0);
    const animationRef = useRef<number | null>(null);
    const lastSpinTrigger = useRef(0);

    const activeParticipants = participants.filter(p => p.status === 'active');
    const segmentAngle = activeParticipants.length > 0 ? (2 * Math.PI) / activeParticipants.length : 0;

    // Generate smart display names for the wheel
    const displayNames = useMemo(() => generateDisplayNames(activeParticipants), [activeParticipants]);

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

        if (activeParticipants.length === 0) {
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

        // Draw segments
        activeParticipants.forEach((participant, index) => {
            const startAngle = rotation + index * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const colorSet = SEGMENT_COLORS[index % SEGMENT_COLORS.length];

            // Draw segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            // Gradient fill
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, radius
            );
            gradient.addColorStop(0, colorSet.bg);
            gradient.addColorStop(1, colorSet.border + '40');
            ctx.fillStyle = gradient;
            ctx.fill();

            // Segment border
            ctx.strokeStyle = colorSet.border;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle / 2);

            // Text styling
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Use smart display name (alias or first name)
            let displayName = displayNames.get(participant.id) || participant.name;
            if (displayName.length > 12) {
                displayName = displayName.substring(0, 10) + '..';
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

    }, [activeParticipants, segmentAngle, displayNames]);

    // Spin animation with easing - uses targetRotation if provided (for sync)
    const spin = useCallback((providedTargetRotation?: number) => {
        if (activeParticipants.length < 2) return;

        // Use provided target or generate random one
        let finalTargetAngle: number;
        let targetSegmentIndex: number;

        if (providedTargetRotation !== undefined) {
            // Use exact rotation for sync
            finalTargetAngle = providedTargetRotation;
            // Calculate which segment this lands on
            const fullRotations = Math.floor(providedTargetRotation / (2 * Math.PI));
            const remainder = providedTargetRotation - (fullRotations * 2 * Math.PI);
            targetSegmentIndex = Math.floor(remainder / segmentAngle) % activeParticipants.length;
        } else {
            // Random number of full rotations (5-10) plus random final position
            const fullRotations = 5 + Math.random() * 5;
            targetSegmentIndex = Math.floor(Math.random() * activeParticipants.length);
            finalTargetAngle = fullRotations * 2 * Math.PI + targetSegmentIndex * segmentAngle;
        }

        const startRotation = currentRotation;
        const totalRotation = finalTargetAngle;
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
                // Animation complete - determine winner
                const winner = activeParticipants[targetSegmentIndex];
                if (winner) {
                    onSpinComplete(winner);
                }
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        // Return the target angle for broadcasting
        return finalTargetAngle;
    }, [activeParticipants, currentRotation, segmentAngle, onSpinComplete]);

    // Trigger spin when spinTrigger changes
    useEffect(() => {
        if (spinTrigger > 0 && spinTrigger !== lastSpinTrigger.current && isSpinning) {
            lastSpinTrigger.current = spinTrigger;
            spin(targetRotation);
        }
    }, [spinTrigger, isSpinning, spin, targetRotation]);

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
export function generateTargetRotation(participantsCount: number): { targetRotation: number; winnerIndex: number } {
    const segmentAngle = (2 * Math.PI) / participantsCount;
    const fullRotations = 5 + Math.random() * 5;
    const winnerIndex = Math.floor(Math.random() * participantsCount);
    const targetRotation = fullRotations * 2 * Math.PI + winnerIndex * segmentAngle;
    return { targetRotation, winnerIndex };
}
