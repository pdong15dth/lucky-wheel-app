'use client';

import { useEffect, useRef } from 'react';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'alert' | 'confirm' | 'success' | 'error';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
}

export default function Dialog({
    isOpen,
    onClose,
    title,
    message,
    type = 'alert',
    confirmText = 'OK',
    cancelText = 'Hủy',
    onConfirm
}: DialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Focus trap
    useEffect(() => {
        if (isOpen && dialogRef.current) {
            dialogRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm?.();
        onClose();
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'confirm':
                return '❓';
            default:
                return '💬';
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success':
                return 'border-[var(--neon-green)]';
            case 'error':
                return 'border-[var(--neon-red)]';
            case 'confirm':
                return 'border-[var(--neon-yellow)]';
            default:
                return 'border-[var(--neon-cyan)]';
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Dialog */}
            <div
                ref={dialogRef}
                tabIndex={-1}
                className={`relative cyber-card max-w-md w-full ${getBorderColor()} border-2 animate-in fade-in zoom-in duration-200`}
                onClick={(e) => e.stopPropagation()}
                style={{
                    boxShadow: type === 'success'
                        ? '0 0 30px rgba(0, 255, 157, 0.3)'
                        : type === 'error'
                            ? '0 0 30px rgba(255, 0, 64, 0.3)'
                            : '0 0 30px rgba(0, 245, 255, 0.3)'
                }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{getIcon()}</span>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                </div>

                {/* Message */}
                <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                    {message}
                </p>

                {/* Buttons */}
                <div className="flex gap-3 justify-end">
                    {type === 'confirm' && (
                        <button
                            onClick={onClose}
                            className="cyber-button"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={type === 'confirm' ? handleConfirm : onClose}
                        className={`cyber-button ${type === 'error' ? 'danger' : 'primary'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook for easy dialog management
import { useState, useCallback } from 'react';

interface DialogState {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'success' | 'error';
    onConfirm?: () => void;
}

export function useDialog() {
    const [dialogState, setDialogState] = useState<DialogState>({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert'
    });

    const showAlert = useCallback((title: string, message: string) => {
        setDialogState({
            isOpen: true,
            title,
            message,
            type: 'alert'
        });
    }, []);

    const showSuccess = useCallback((title: string, message: string) => {
        setDialogState({
            isOpen: true,
            title,
            message,
            type: 'success'
        });
    }, []);

    const showError = useCallback((title: string, message: string) => {
        setDialogState({
            isOpen: true,
            title,
            message,
            type: 'error'
        });
    }, []);

    const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
        setDialogState({
            isOpen: true,
            title,
            message,
            type: 'confirm',
            onConfirm
        });
    }, []);

    const closeDialog = useCallback(() => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return {
        dialogState,
        showAlert,
        showSuccess,
        showError,
        showConfirm,
        closeDialog
    };
}
