'use client';

import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
            <p className="text-[var(--text-muted)] mt-1">Quản lý cấu hình hệ thống và API Keys.</p>
          </div>
          
          <div className="flex items-center justify-center p-20 glass-card rounded-2xl border-dashed">
            <div className="text-center">
              <span className="text-4xl">⚙️</span>
              <h2 className="text-xl font-bold text-[var(--text-secondary)] mt-4">Trang Cấu Hình Đang Phát Triển</h2>
              <p className="text-[var(--text-muted)] mt-2">Chức năng cài đặt API Keys và cấu hình chung sẽ sớm được cập nhật.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
