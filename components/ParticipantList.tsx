'use client';

import { Participant, deleteParticipant } from '@/lib/supabase';
import { useState, useCallback } from 'react';

interface ParticipantListProps {
    participants: Participant[];
    isAdmin?: boolean;
    onParticipantDeleted?: () => void;
}

const DELETE_PASSWORD = '2025';

export default function ParticipantList({
    participants,
    isAdmin = false,
    onParticipantDeleted
}: ParticipantListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const activeCount = participants.filter(p => p.status === 'active').length;
    const winnerCount = participants.filter(p => p.status === 'winner').length;

    const openDeleteDialog = (participant: Participant) => {
        if (participant.status === 'winner') {
            return;
        }
        setSelectedParticipant(participant);
        setPassword('');
        setPasswordError('');
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setSelectedParticipant(null);
        setPassword('');
        setPasswordError('');
    };

    const handleDelete = useCallback(async () => {
        if (!selectedParticipant) return;

        if (password !== DELETE_PASSWORD) {
            setPasswordError('Sai mật khẩu!');
            return;
        }

        setIsDeleting(true);
        setDeletingId(selectedParticipant.id);

        try {
            const success = await deleteParticipant(selectedParticipant.id);
            if (success) {
                closeDeleteDialog();
                onParticipantDeleted?.();
            } else {
                setPasswordError('Không thể xóa. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Delete error:', error);
            setPasswordError('Có lỗi xảy ra!');
        } finally {
            setIsDeleting(false);
            setDeletingId(null);
        }
    }, [selectedParticipant, password, onParticipantDeleted]);

    return (
        <>
            {/* Delete Confirmation Dialog with Password */}
            {showDeleteDialog && selectedParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="cyber-card max-w-md w-full mx-4 p-6">
                        <h3 className="text-xl font-bold neon-text-cyan mb-4">
                            🗑️ Xác nhận xóa
                        </h3>

                        <p className="text-[var(--text-secondary)] mb-4">
                            Bạn có chắc muốn xóa <strong className="text-white">"{selectedParticipant.name}"</strong>?
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                Nhập mật khẩu để xác nhận:
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setPasswordError('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleDelete();
                                    }
                                }}
                                placeholder="Nhập mật khẩu..."
                                className="w-full px-4 py-3 bg-[var(--cyber-bg-tertiary)] border border-[var(--text-muted)] rounded-lg text-white focus:border-[var(--neon-cyan)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]"
                                autoFocus
                            />
                            {passwordError && (
                                <p className="mt-2 text-sm text-[var(--neon-red)]">
                                    ❌ {passwordError}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={closeDeleteDialog}
                                className="cyber-button"
                                disabled={isDeleting}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting || !password}
                                className="cyber-button bg-[var(--neon-red)] hover:bg-[var(--neon-red)]/80 disabled:opacity-50"
                            >
                                {isDeleting ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Participant List */}
            <div className="cyber-card">
                <h3 className="text-lg font-bold mb-4 neon-text-cyan flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-[var(--neon-cyan)] rounded-full animate-pulse-glow"></span>
                    Người tham gia
                    <span className="text-sm font-normal text-[var(--text-secondary)] ml-auto">
                        {activeCount} hoạt động / {participants.length} tổng
                    </span>
                </h3>

                <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
                    {participants.length === 0 ? (
                        <p className="text-[var(--text-muted)] text-sm italic py-4 text-center">
                            Chưa có người tham gia...
                        </p>
                    ) : (
                        participants.map((participant) => (
                            <div
                                key={participant.id}
                                className={`participant-item ${participant.status === 'winner' ? 'winner' : ''}`}
                            >
                                <span className="status-dot"></span>
                                <span className="flex-1">{participant.name}</span>
                                {participant.status === 'winner' && participant.prize_rank && (
                                    <span className="text-xs px-2 py-1 bg-[var(--neon-yellow)] text-black font-bold rounded">
                                        Giải {participant.prize_rank}
                                    </span>
                                )}
                                {isAdmin && participant.status !== 'winner' && (
                                    <button
                                        onClick={() => openDeleteDialog(participant)}
                                        disabled={deletingId === participant.id}
                                        className="ml-2 text-[var(--neon-red)] hover:bg-[var(--neon-red)] hover:text-white px-2 py-1 rounded text-xs transition-colors"
                                        title="Xóa người tham gia"
                                    >
                                        {deletingId === participant.id ? '...' : '✕'}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {winnerCount > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--text-muted)]">
                        <p className="text-sm text-[var(--text-secondary)]">
                            🏆 Đã có <span className="neon-text-cyan font-bold">{winnerCount}</span> người trúng giải
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
