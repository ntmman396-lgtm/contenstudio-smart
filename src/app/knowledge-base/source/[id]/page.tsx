'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSavedSources, KBSource, MOCK_CHUNKS, KBChunk } from '@/lib/kb/mock-kb-data';
import ChunkPanel from '@/components/kb/ChunkPanel';
import { ArrowLeft, ExternalLink, Calendar, BookOpen, Quote, FileText, Tag } from 'lucide-react';

export default function SourceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [source, setSource] = useState<KBSource | null>(null);
  const [chunks, setChunks] = useState<KBChunk[]>([]);
  const [activePdfPage, setActivePdfPage] = useState<number | null>(null);

  useEffect(() => {
    // Thả wrap NextRouter / React useEffect resolve param
    const srcId = params.id;
    const allSources = getSavedSources();
    const found = allSources.find(s => s.id === srcId);
    
    if (found) {
      setSource(found);
      if (MOCK_CHUNKS[found.id]) {
        setChunks(MOCK_CHUNKS[found.id]);
      }
    }
  }, [params.id]);

  const handleChunkClick = (chunk: KBChunk) => {
    if (source?.source_type === 'pdf' && chunk.page_number) {
       setActivePdfPage(chunk.page_number);
    } else {
       // Thả toast hoặc highlight text nếu đang dùng plain text / external web URL
       // For mock purpose, we just scroll if there's a text match
    }
  };

  if (!source) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <span className="animate-pulse text-[var(--lc-primary)]">Đang tải chi tiết nguồn...</span>
      </div>
    );
  }

  // Parse Markdown-like text for Extracted Text display
  // Mocks simple H1/H2 and paragraphs for easy reading
  const renderCleanText = (text: string) => {
     return text.split('\n').map((line, idx) => {
        if (line.startsWith('## ')) return <h2 key={idx} className="text-lg font-bold text-[var(--lc-primary)] mt-6 mb-2 border-b border-[var(--border-default)] pb-1">{line.replace('## ', '')}</h2>;
        if (line.startsWith('# ')) return <h1 key={idx} className="text-2xl font-black text-[var(--text-primary)] mb-4">{line.replace('# ', '')}</h1>;
        if (line.trim() === '') return <br key={idx} />;
        return <p key={idx} className="mb-2 text-sm text-[var(--text-secondary)] leading-relaxed">{line}</p>;
     });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-primary)]">
      
      {/* Top Navigation */}
      <div className="px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="w-8 h-8 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-[var(--lc-primary)]/20 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Knowledge Base / {source.source_type}
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${source.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
                {source.status}
              </span>
            </div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] leading-tight max-w-2xl truncate" title={source.title}>
              {source.title}
            </h1>
          </div>
        </div>
        
        {source.origin_url && (
          <a href={source.origin_url} target="_blank" rel="noopener noreferrer" className="btn-secondary px-4 py-2 text-xs flex items-center gap-2">
            Mở trang gốc <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Main Dual-pane */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANE (60%) */}
        <div className="w-[60%] flex flex-col border-r border-[var(--border-default)] bg-black/20">
          {source.source_type === 'pdf' ? (
             <div className="flex-1 w-full h-full p-2 relative">
               <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur flex items-center gap-2 z-10 border border-white/10 shadow-xl">
                 <FileText size={14} /> PDF Viewer (Mock Rendering)
               </div>
               
               {/* Embed using standard iframe. Appending #page ensures jump */}
               <iframe 
                 src={source.file_path ? `${source.file_path}#page=${activePdfPage || 1}` : ''}
                 className="w-full h-full rounded-xl border border-[var(--border-default)] bg-white"
                 title="PDF Viewer"
               />
             </div>
          ) : (
             <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
               <div className="max-w-3xl mx-auto bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-8 shadow-sm">
                 <div className="flex items-center gap-2 mb-6">
                   <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                     <FileText size={16} />
                   </div>
                   <span className="text-sm font-bold text-[var(--text-muted)]">Extracted Content Preview</span>
                 </div>
                 
                 <div className="prose prose-invert max-w-none">
                    {source.extracted_text ? renderCleanText(source.extracted_text) : (
                      <p className="text-sm text-[var(--text-muted)] italic">Nội dung text extraction không khả dụng.</p>
                    )}
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* RIGHT PANE (40%) */}
        <div className="w-[40%] flex flex-col bg-[var(--bg-primary)] p-4 overflow-hidden gap-4">
           
           {/* Metadata Card */}
           <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl p-4 shrink-0">
             <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Thông tin Nguồn (Metadata)</h3>
             
             <div className="space-y-3">
               <div className="flex justify-between items-center text-xs">
                 <span className="text-[var(--text-muted)] flex items-center gap-2"><BookOpen size={14} /> Publisher</span>
                 <span className="font-bold text-[var(--text-primary)]">{source.publisher}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                 <span className="text-[var(--text-muted)] flex items-center gap-2"><Calendar size={14} /> Năm Xuất Bản</span>
                 <span className="font-mono text-[var(--text-primary)]">{source.publish_year}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                 <span className="text-[var(--text-muted)] flex items-center gap-2"><Quote size={14} /> Độ Dài</span>
                 <span className="text-[var(--text-secondary)]">{source.file_size_kb ? `${source.file_size_kb} KB` : 'N/A'} {source.page_count ? `(${source.page_count} trang)` : ''}</span>
               </div>
               
               <div className="pt-2 border-t border-[var(--border-default)]">
                 <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mb-2"><Tag size={12}/> Topic Tags</span>
                 <div className="flex flex-wrap gap-1.5">
                   {source.topic_tags.map(tag => (
                     <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--lc-primary)]/10 text-[var(--lc-primary)] font-medium">#{tag}</span>
                   ))}
                 </div>
               </div>

               <div className="bg-[var(--bg-card-hover)] rounded-lg p-3 mt-2 border border-[var(--border-default)]/50">
                  <p className="text-[11px] font-bold flex items-center gap-1 text-[var(--text-primary)]">
                    📊 Chỉ số sử dụng AI
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                    Nguồn này đã được RAG sử dụng trong <strong className="text-emerald-400">14 bài viết</strong>.
                  </p>
               </div>
             </div>
           </div>

           {/* Chunks Interactive List */}
           <div className="flex-1 overflow-hidden min-h-0">
             <ChunkPanel chunks={chunks} onChunkClick={handleChunkClick} />
           </div>

        </div>

      </div>
    </div>
  );
}
