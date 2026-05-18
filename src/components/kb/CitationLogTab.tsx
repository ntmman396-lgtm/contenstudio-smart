'use client';

import React, { useState, useEffect } from 'react';
import { KBCitationLog, getSavedCitationLogs } from '@/lib/kb/mock-kb-data';
import { FileText, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function CitationLogTab() {
  const [logs, setLogs] = useState<KBCitationLog[]>([]);

  useEffect(() => {
    setLogs(getSavedCitationLogs());
    const handleStorage = () => {
       setLogs(getSavedCitationLogs());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] p-6">
       
       <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Citation Audit Log</h2>
            <p className="text-sm text-[var(--text-secondary)]">Lịch sử trích dẫn nguồn của các bài viết do AI tạo ra.</p>
          </div>
       </div>

       <div className="glass-card rounded-xl flex-1 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_100px_100px_100px_250px] gap-4 px-5 py-3 border-b border-[var(--border-default)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider items-center bg-[var(--bg-secondary)]">
             <span>Bài Viết</span>
             <span className="text-center">Tổng Nguồn</span>
             <span className="text-center">Từ KB (Sạch)</span>
             <span className="text-center">Ngoài KB</span>
             <span className="text-center">Cảnh báo</span>
             <span>Ghi chú Thẩm Định</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-default)]">
             {logs.length === 0 ? (
               <div className="p-10 text-center flex flex-col items-center">
                 <span className="text-4xl opacity-50 mb-3">🧾</span>
                 <p className="text-[var(--text-muted)] text-sm">Chưa có bài viết nào được audit trích dẫn.</p>
               </div>
             ) : (
                logs.map((log) => (
                  <div key={log.id} className="grid grid-cols-[1fr_80px_100px_100px_100px_250px] gap-4 px-5 py-4 items-start hover:bg-[var(--bg-card-hover)] transition-colors">
                     
                     {/* Title */}
                     <div>
                        <Link href={`/review?id=${log.article_id}`} className="text-sm font-medium text-[var(--lc-primary)] hover:underline block mb-1">
                           {log.article_title}
                        </Link>
                        <span className="text-[10px] text-[var(--text-muted)]">{new Date(log.date).toLocaleString('vi-VN')}</span>
                     </div>

                     {/* Stats */}
                     <div className="text-center mt-1">
                        <span className="text-xs font-bold text-[var(--text-primary)]">{log.total_citations}</span>
                     </div>
                     <div className="text-center mt-1">
                        <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">{log.kb_citations}</span>
                     </div>
                     <div className="text-center mt-1">
                        <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">{log.external_citations}</span>
                     </div>
                     <div className="text-center mt-1 flex justify-center">
                        {log.unverified > 0 ? (
                           <span className="text-xs font-mono bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/30 flex justify-center items-center gap-1 font-bold animate-pulse">
                              <AlertTriangle size={12} />
                              {log.unverified}
                           </span>
                        ) : (
                           <span className="text-xs font-mono text-[var(--text-muted)] p-1">0</span>
                        )}
                     </div>

                     {/* Notes */}
                     <div className="text-[10px] space-y-1.5 flex flex-col justify-start">
                        {log.status === 'reviewed' && log.unverified === 0 && log.transparency_notes.length === 0 ? (
                           <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12}/> An toàn 100% nội bộ</span>
                        ) : (
                           log.transparency_notes.map((note, i) => (
                             <div key={i} className={`p-1.5 rounded border ${note.includes('CẢNH BÁO') ? 'bg-red-500/10 border-red-500/20 text-red-400 font-bold' : 'bg-[var(--bg-primary)] border-[var(--border-default)] text-[var(--text-secondary)]'} flex gap-1.5 items-start`}>
                               {note.includes('CẢNH BÁO') ? <AlertTriangle size={12} className="shrink-0 mt-0.5" /> : <ExternalLink size={12} className="shrink-0 mt-0.5" />}
                               <span className="line-clamp-2" title={note}>{note}</span>
                             </div>
                           ))
                        )}
                     </div>
                  </div>
                ))
             )}
          </div>
       </div>
    </div>
  );
}
