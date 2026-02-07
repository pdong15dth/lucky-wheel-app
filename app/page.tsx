'use client';

import { useState } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';

const ADMIN_PASSWORD = '2025';

export default function Home() {
  const router = useRouter();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPasswordDialog(true);
    setPassword('');
    setPasswordError('');
  };

  const handlePasswordSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      // Save password to sessionStorage
      sessionStorage.setItem('admin_authenticated', 'true');
      router.push('/admin');
    } else {
      setPasswordError('Sai mật khẩu! Vui lòng thử lại.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePasswordSubmit();
    } else if (e.key === 'Escape') {
      setShowPasswordDialog(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="cyber-card max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold neon-text-cyan mb-4 flex items-center gap-2">
              🔐 Xác thực Admin
            </h3>

            <p className="text-[var(--text-secondary)] mb-4">
              Vui lòng nhập mật khẩu để truy cập trang quản trị.
            </p>

            <div className="mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                onKeyDown={handleKeyDown}
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
                onClick={() => setShowPasswordDialog(false)}
                className="cyber-button"
              >
                Hủy
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={!password}
                className="cyber-button primary disabled:opacity-50"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, var(--neon-purple) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 text-center max-w-2xl">
        {/* Tora Tech Logo */}
        <div className="mb-8">
          <Image
            src="/tora-tech-logo.svg"
            alt="Tora Tech Logo"
            width={280}
            height={100}
            className="mx-auto mb-4"
            priority
          />
        </div>

        {/* Title */}
        <h1
          className="text-4xl md:text-6xl font-bold mb-4 neon-text-cyan glitch"
          data-text="LUCKY WHEEL"
        >
          LUCKY WHEEL
        </h1>

        <h2 className="text-xl md:text-2xl font-medium mb-8 neon-text-magenta">
          VÒNG QUAY MAY MẮN
        </h2>

        <p className="text-lg text-[var(--text-secondary)] mb-12 max-w-md mx-auto">
          Ứng dụng vòng quay may mắn thời gian thực với 3 giải thưởng hấp dẫn.
          Điểm danh ngay để tham gia!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleAdminClick}
            className="cyber-button primary text-lg px-8 py-4"
          >
            <span className="flex items-center justify-center gap-2">
              <span>🎮</span>
              Trang Quản Trị
            </span>
          </button>

          <a href="/checkin" className="cyber-button text-lg px-8 py-4">
            <span className="flex items-center justify-center gap-2">
              <span>✋</span>
              Điểm Danh
            </span>
          </a>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="cyber-card">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-[var(--neon-cyan)] mb-2">Real-time</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Đồng bộ hóa tức thì khi có người tham gia mới
            </p>
          </div>

          <div className="cyber-card">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-bold text-[var(--neon-magenta)] mb-2">3 Giải Thưởng</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Quay 3 vòng để chọn 3 người may mắn
            </p>
          </div>

          <div className="cyber-card">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-bold text-[var(--neon-purple)] mb-2">Chia Sẻ Dễ Dàng</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Quét mã QR để điểm danh nhanh chóng
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-sm text-[var(--text-muted)]">
          <p>© 2026 Tora Tech. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
