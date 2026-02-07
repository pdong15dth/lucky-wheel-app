import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'spin_statistics.json');

interface PrizeEntry {
    timestamp: string;
    winnerId: string;
    winnerName: string;
    winnerAlias: string | null;
    winnerIndex: number;
    activeCount: number;
    totalCount: number;
    allActiveNames: string[];
}

interface CycleData {
    prize_1?: PrizeEntry;
    prize_2?: PrizeEntry;
    prize_3?: PrizeEntry;
}

interface SpinStatistics {
    [cycleKey: string]: CycleData;
}

// POST - Add new spin log
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { testCycle, prizeRound, ...prizeData } = body;

        // Read existing log
        let spinStats: SpinStatistics = {};
        try {
            const existingData = await fs.readFile(LOG_FILE_PATH, 'utf-8');
            spinStats = JSON.parse(existingData);
        } catch {
            // File doesn't exist, start fresh
            spinStats = {};
        }

        // Create cycle key
        const cycleKey = `cycle_${testCycle}`;
        const prizeKey = `prize_${prizeRound}` as 'prize_1' | 'prize_2' | 'prize_3';

        // Initialize cycle if not exists
        if (!spinStats[cycleKey]) {
            spinStats[cycleKey] = {};
        }

        // Add prize entry
        spinStats[cycleKey][prizeKey] = {
            timestamp: prizeData.timestamp,
            winnerId: prizeData.winnerId,
            winnerName: prizeData.winnerName,
            winnerAlias: prizeData.winnerAlias,
            winnerIndex: prizeData.winnerIndex,
            activeCount: prizeData.activeCount,
            totalCount: prizeData.totalCount,
            allActiveNames: prizeData.allActiveNames
        };

        // Write back to file
        await fs.writeFile(LOG_FILE_PATH, JSON.stringify(spinStats, null, 2), 'utf-8');

        const totalCycles = Object.keys(spinStats).length;
        const totalSpins = Object.values(spinStats).reduce((sum, cycle) =>
            sum + Object.keys(cycle).length, 0
        );

        return NextResponse.json({
            success: true,
            cycle: testCycle,
            prize: prizeRound,
            totalCycles,
            totalSpins,
            message: `Logged cycle ${testCycle}, prize ${prizeRound}`
        });
    } catch (error) {
        console.error('Error logging spin:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

// GET - Get statistics
export async function GET() {
    try {
        let spinStats: SpinStatistics = {};
        try {
            const existingData = await fs.readFile(LOG_FILE_PATH, 'utf-8');
            spinStats = JSON.parse(existingData);
        } catch {
            return NextResponse.json({
                success: true,
                totalCycles: 0,
                totalSpins: 0,
                message: 'No spin data recorded yet.',
                winnerStats: [],
                rawData: {}
            });
        }

        // Calculate winner statistics
        const winCounts: Record<string, { name: string; count: number; prizes: string[] }> = {};

        Object.entries(spinStats).forEach(([cycleKey, cycle]) => {
            Object.entries(cycle).forEach(([prizeKey, prize]) => {
                if (prize) {
                    const name = prize.winnerAlias || prize.winnerName;
                    if (!winCounts[name]) {
                        winCounts[name] = { name, count: 0, prizes: [] };
                    }
                    winCounts[name].count++;
                    winCounts[name].prizes.push(`${cycleKey}/${prizeKey}`);
                }
            });
        });

        const totalCycles = Object.keys(spinStats).length;
        const totalSpins = Object.values(spinStats).reduce((sum, cycle) =>
            sum + Object.keys(cycle).length, 0
        );

        const winnerStats = Object.values(winCounts)
            .sort((a, b) => b.count - a.count)
            .map(w => ({
                name: w.name,
                wins: w.count,
                percentage: ((w.count / totalSpins) * 100).toFixed(1) + '%',
                wonAt: w.prizes
            }));

        return NextResponse.json({
            success: true,
            totalCycles,
            totalSpins,
            uniqueWinners: winnerStats.length,
            expectedWinsPerPerson: totalSpins > 0 ? (totalSpins / winnerStats.length).toFixed(2) : '0',
            winnerStats,
            rawData: spinStats
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

// DELETE - Clear statistics
export async function DELETE() {
    try {
        await fs.writeFile(LOG_FILE_PATH, '{}', 'utf-8');
        return NextResponse.json({ success: true, message: 'Statistics cleared.' });
    } catch (error) {
        console.error('Error clearing stats:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
