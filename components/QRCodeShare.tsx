'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeShareProps {
    checkinUrl: string;
}

export default function QRCodeShare({ checkinUrl }: QRCodeShareProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(checkinUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="cyber-card text-center">
            <h3 className="text-lg font-bold mb-4 neon-text-purple flex items-center justify-center gap-2">
                <span className="text-2xl">📱</span>
                Chia sẻ để điểm danh
            </h3>

            <div className="qr-container mx-auto mb-4">
                <QRCodeSVG
                    value={checkinUrl}
                    size={180}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#0a0a0f"
                    style={{ display: 'block' }}
                />
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
                Quét mã QR hoặc copy link bên dưới
            </p>

            <div className="flex flex-col gap-2">
                <div className="bg-[var(--cyber-bg)] p-3 rounded text-xs text-[var(--text-muted)] break-all border border-[var(--neon-purple)] border-opacity-30">
                    {checkinUrl}
                </div>

                <button
                    onClick={copyToClipboard}
                    className="cyber-button w-full flex items-center justify-center gap-2"
                >
                    {copied ? (
                        <>
                            <span className="text-[var(--neon-green)]">✓</span>
                            Đã copy!
                        </>
                    ) : (
                        <>
                            <span>📋</span>
                            Copy Link
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
