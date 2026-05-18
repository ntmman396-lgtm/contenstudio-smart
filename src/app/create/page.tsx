import React from 'react';
import Sidebar from '@/components/Sidebar';
import SingleGenerator from '@/components/SingleGenerator';

export default function CreatePage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />
      <SingleGenerator />
    </div>
  );
}
