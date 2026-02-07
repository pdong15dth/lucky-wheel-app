'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addParticipant, subscribeToGameEvents, getParticipants, updateParticipantName } from '@/lib/supabase';

const CHECKIN_STORAGE_KEY = 'lucky_wheel_checkin';

interface CheckinData {
    participantId: string;
    name: string;
    checkinTime: string;
}

export default function CheckinPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'loading' | 'idle' | 'registered' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [existingCheckin, setExistingCheckin] = useState<CheckinData | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Check if user already checked in
    useEffect(() => {
        const checkExistingCheckin = async () => {
            try {
                const stored = localStorage.getItem(CHECKIN_STORAGE_KEY);
                if (stored) {
                    const checkinData: CheckinData = JSON.parse(stored);

                    // Verify participant still exists in database
                    const participants = await getParticipants();
                    const stillExists = participants.find(p => p.id === checkinData.participantId);

                    if (stillExists) {
                        setExistingCheckin({
                            ...checkinData,
                            name: stillExists.name // Use latest name from DB
                        });
                        setName(stillExists.name);
                        setStatus('registered');
                        return;
                    } else {
                        // Participant was deleted, clear storage
                        localStorage.removeItem(CHECKIN_STORAGE_KEY);
                    }
                }
                setStatus('idle');
            } catch (error) {
                console.error('Error checking existing checkin:', error);
                setStatus('idle');
            }
        };

        checkExistingCheckin();
    }, []);

    // Listen for lock events and redirect to guest page
    useEffect(() => {
        const unsubscribe = subscribeToGameEvents((event) => {
            if (event.type === 'checkin_locked') {
                console.log('🔒 Check-in locked, redirecting to guest page...');
                router.push('/guest');
            }
        });

        return () => {
            unsubscribe();
        };
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedName = name.trim();

        // Validation
        if (!trimmedName) {
            setErrorMessage('Vui lòng nhập tên của bạn');
            setStatus('error');
            return;
        }

        if (trimmedName.length < 2) {
            setErrorMessage('Tên phải có ít nhất 2 ký tự');
            setStatus('error');
            return;
        }

        if (trimmedName.length > 50) {
            setErrorMessage('Tên không được quá 50 ký tự');
            setStatus('error');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const result = await addParticipant(trimmedName);

            if (result.success) {
                // Save to localStorage
                const checkinData: CheckinData = {
                    participantId: result.data.id,
                    name: result.data.name,
                    checkinTime: new Date().toISOString()
                };
                localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(checkinData));

                setExistingCheckin(checkinData);
                setStatus('registered');
            } else if (result.error === 'duplicate') {
                setStatus('error');
                setErrorMessage(`Tên "${trimmedName}" đã được sử dụng. Vui lòng nhập tên khác!`);
            } else {
                setStatus('error');
                setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Submit error:', error);
            setStatus('error');
            setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!existingCheckin) return;

        const trimmedName = name.trim();

        if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
            setErrorMessage('Tên phải từ 2-50 ký tự');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const success = await updateParticipantName(existingCheckin.participantId, trimmedName);

            if (success) {
                const newCheckinData = { ...existingCheckin, name: trimmedName };
                localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(newCheckinData));
                setExistingCheckin(newCheckinData);
                setIsEditing(false);
            } else {
                setErrorMessage('Không thể cập nhật tên. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Update error:', error);
            setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại!');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-[var(--neon-cyan)] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="neon-text-cyan text-lg">Đang kiểm tra...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
                    style={{ background: 'radial-gradient(circle, var(--neon-cyan) 0%, transparent 70%)' }}
                />
                <div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
                    style={{ background: 'radial-gradient(circle, var(--neon-magenta) 0%, transparent 70%)' }}
                />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Card */}
                <div className="cyber-card">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-block text-6xl mb-4 animate-pulse-glow">🎡</div>
                        <h1
                            className="text-2xl md:text-3xl font-bold neon-text-cyan glitch"
                            data-text="ĐIỂM DANH"
                        >
                            ĐIỂM DANH
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-2">
                            {status === 'registered' ? 'Bạn đã điểm danh thành công!' : 'Tham gia vòng quay may mắn ngay!'}
                        </p>
                    </div>

                    {/* Already Registered State */}
                    {status === 'registered' && existingCheckin && !isEditing ? (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">✅</div>
                            <h2 className="text-xl font-bold neon-text-green mb-2">
                                Đã điểm danh!
                            </h2>
                            <div className="mb-4 p-4 rounded-lg bg-[var(--cyber-bg-tertiary)] border border-[var(--neon-green)]">
                                <p className="text-sm text-[var(--text-muted)] mb-1">Tên của bạn:</p>
                                <p className="text-xl font-bold text-[var(--neon-cyan)]">{existingCheckin.name}</p>
                            </div>
                            <p className="text-[var(--text-secondary)] mb-6 text-sm">
                                Bạn đã đăng ký tham gia vòng quay. Chờ kết quả nhé!
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="cyber-button"
                                >
                                    ✏️ Sửa tên
                                </button>
                                <button
                                    onClick={() => router.push('/guest')}
                                    className="cyber-button primary"
                                >
                                    👀 Xem vòng quay
                                </button>
                            </div>
                        </div>
                    ) : status === 'registered' && isEditing ? (
                        /* Edit Name Form */
                        <form onSubmit={handleUpdateName} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                                >
                                    Sửa tên của bạn
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nhập tên mới..."
                                    className="cyber-input"
                                    disabled={isSubmitting}
                                    autoComplete="off"
                                    autoFocus
                                />
                                {errorMessage && (
                                    <p className="mt-2 text-sm text-[var(--neon-red)]">
                                        ⚠️ {errorMessage}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setName(existingCheckin?.name || '');
                                        setErrorMessage('');
                                    }}
                                    className="cyber-button flex-1"
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="cyber-button primary flex-1"
                                >
                                    {isSubmitting ? 'Đang lưu...' : '💾 Lưu'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* New Registration Form */
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                                >
                                    Tên của bạn
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nhập tên của bạn..."
                                    className="cyber-input"
                                    disabled={isSubmitting}
                                    autoComplete="off"
                                    autoFocus
                                />
                                {status === 'error' && errorMessage && (
                                    <p className="mt-2 text-sm text-[var(--neon-red)]">
                                        ⚠️ {errorMessage}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="cyber-button primary w-full text-lg py-4"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        Đang xử lý...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <span>🚀</span>
                                        THAM GIA NGAY
                                    </span>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-[var(--text-muted)] border-opacity-30 text-center">
                        <p className="text-sm text-[var(--text-muted)]">
                            Vòng quay may mắn • 3 giải thưởng hấp dẫn
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
