'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import BatchGenerator from '@/components/BatchGenerator';

export default function BatchPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />
      <BatchGenerator />
    </div>
  );
}
