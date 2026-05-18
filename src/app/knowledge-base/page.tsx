'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SourcesTab from '@/components/kb/SourcesTab';
import SearchTestTab from '@/components/kb/SearchTestTab';
import CitationLogTab from '@/components/kb/CitationLogTab';

function KnowledgeBaseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get('tab') || 'sources';

  const tabs = [
    { id: 'sources', label: 'Quản lý Tài liệu (Sources)' },
    { id: 'search', label: 'Tìm kiếm & Test RAG' },
    { id: 'citations', label: 'Audits Trích Dẫn' }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
       <Sidebar />
       <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header Area */}
          <div className="px-6 pt-6 pb-4 border-b border-[var(--border-default)]">
             <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mb-2 uppercase tracking-wider font-medium">
               <span>Workspace</span>
               <span>/</span>
               <span className="text-[var(--text-accent)]">Knowledge Base</span>
             </div>
             
             <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                    Knowledge Base & RAG Pipeline
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Quản lý thẻ nhớ tri thức Y Khoa nội bộ để cung cấp Context sạch cho AI.
                  </p>
                </div>
             </div>

             {/* Tab Navigation */}
             <div className="flex gap-6 mt-6 border-b border-[var(--border-default)]">
               {tabs.map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => router.push(`/knowledge-base?tab=${tab.id}`)}
                   className={`pb-3 text-sm font-medium transition-colors relative ${currentTab === tab.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                 >
                   {tab.label}
                   {currentTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--lc-primary)] rounded-t-full shadow-[0_0_10px_rgba(0,102,204,0.5)]" />
                   )}
                 </button>
               ))}
             </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden p-6">
             {currentTab === 'sources' && <SourcesTab />}
             {currentTab === 'search' && <SearchTestTab />}
             {currentTab === 'citations' && <CitationLogTab />}
          </div>
       </main>
    </div>
  );
}

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]"><span className="animate-pulse text-[var(--lc-primary)]">Loading Knowledge Base...</span></div>}>
      <KnowledgeBaseContent />
    </Suspense>
  );
}
