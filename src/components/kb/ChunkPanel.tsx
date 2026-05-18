'use client';

import React, { useState } from 'react';
import { KBChunk } from '@/lib/kb/mock-kb-data';
import { Search, Hash, FileText, CheckCircle2, Play, ChevronDown, ChevronUp } from 'lucide-react';

interface ChunkPanelProps {
  chunks: KBChunk[];
  onChunkClick: (chunk: KBChunk) => void;
}

export default function ChunkPanel({ chunks, onChunkClick }: ChunkPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [testQueryMap, setTestQueryMap] = useState<Record<string, { query: string; score: number | null; searching: boolean }>>({});
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});

  const filteredChunks = chunks.filter(c => 
    c.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.section_heading && c.section_heading.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleTestSimilarity = (chunkId: string) => {
    const state = testQueryMap[chunkId];
    if (!state || !state.query) return;

    setTestQueryMap(prev => ({
      ...prev,
      [chunkId]: { ...prev[chunkId], searching: true, score: null }
    }));

    // Giả lập điểm Similarity (RAG)
    setTimeout(() => {
      let score = Math.random() * 0.4 + 0.3; // 0.3 - 0.7
      if (state.query && chunks.find(c => c.id === chunkId)?.content.toLowerCase().includes(state.query.toLowerCase())) {
         score += 0.3; // Boost score if text matches exactly
      }
      
      setTestQueryMap(prev => ({
        ...prev,
        [chunkId]: { ...prev[chunkId], searching: false, score: Math.min(score, 0.99) }
      }));
    }, 600);
  };

  const toggleTestBox = (chunkId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent clicking chunk from triggering scroll
    setExpandedTests(prev => ({ ...prev, [chunkId]: !prev[chunkId] }));
    if (!testQueryMap[chunkId]) {
      setTestQueryMap(prev => ({ ...prev, [chunkId]: { query: '', score: null, searching: false } }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] overflow-hidden shadow-sm">
      <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] flex justify-between items-center">
        <h3 className="font-bold text-[var(--text-primary)] text-sm flex items-center gap-2">
          <Hash size={16} className="text-[var(--lc-primary)]" />
          Semantic Chunks ({chunks.length})
        </h3>
      </div>
      
      <div className="p-3 border-b border-[var(--border-default)]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Tìm trong nội dung chunk..."
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg py-2 pl-9 pr-3 text-xs focus:border-[var(--lc-primary)] outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {filteredChunks.length === 0 ? (
          <p className="text-center text-xs text-[var(--text-muted)] mt-5">Không có chunk nào khớp tìm kiếm.</p>
        ) : (
          filteredChunks.map((chunk) => (
            <div 
              key={chunk.id} 
              className="group bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl p-3 hover:border-[var(--lc-primary)] hover:shadow-[0_4px_20px_rgba(0,102,204,0.1)] transition-all cursor-pointer"
              onClick={() => onChunkClick(chunk)}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] p-1 bg-[var(--bg-card-hover)] rounded border border-[var(--border-default)] inline-flex w-max">
                    #{chunk.chunk_index}
                  </span>
                  {chunk.section_heading && (
                    <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                      {chunk.section_heading}
                    </span>
                  )}
                </div>
                
                {/* Meta details */}
                <div className="flex flex-col items-end gap-1">
                  {chunk.page_number && (
                    <span className="text-[10px] flex items-center gap-1 text-[var(--text-secondary)]">
                      <FileText size={10} /> Trang {chunk.page_number}
                    </span>
                  )}
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1" title="Embedded successfully">
                    <CheckCircle2 size={10} /> Indexed
                  </span>
                </div>
              </div>

              {/* Content Preview */}
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-3 group-hover:line-clamp-none transition-all">
                {chunk.content}
              </div>

              {/* Test Action */}
              <div className="border-t border-[var(--border-default)]/50 pt-2 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[var(--text-muted)]">{chunk.content_length} ký tự</span>
                  <button 
                    onClick={(e) => toggleTestBox(chunk.id, e)}
                    className="text-[var(--lc-primary)] font-medium hover:underline flex items-center gap-1"
                  >
                    Test Similarity {expandedTests[chunk.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
                
                {/* Expandable test block */}
                {expandedTests[chunk.id] && (
                  <div className="bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border-default)] mt-1 animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Nhập query (VD: Đau bụng)" 
                        className="flex-1 bg-transparent border border-[var(--border-default)] rounded py-1 px-2 text-[10px] focus:border-[var(--lc-primary)] focus:outline-none"
                        value={testQueryMap[chunk.id]?.query || ''}
                        onChange={e => setTestQueryMap(prev => ({...prev, [chunk.id]: { ...prev[chunk.id], query: e.target.value }}))}
                        onKeyDown={e => e.key === 'Enter' && handleTestSimilarity(chunk.id)}
                      />
                      <button 
                        onClick={() => handleTestSimilarity(chunk.id)}
                        disabled={testQueryMap[chunk.id]?.searching}
                        className="bg-[var(--bg-card-hover)] text-[var(--lc-primary)] border border-[var(--lc-primary)]/30 rounded px-2 hover:bg-[var(--lc-primary)] hover:text-white transition-colors disabled:opacity-50"
                      >
                        {testQueryMap[chunk.id]?.searching ? <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" /> : <Play size={12} />}
                      </button>
                    </div>
                    {testQueryMap[chunk.id]?.score !== null && testQueryMap[chunk.id]?.score !== undefined && (
                      <div className="mt-2 text-[10px] flex items-center justify-between bg-black/20 p-1.5 rounded">
                        <span className="text-[var(--text-secondary)]">Cosine Distance:</span>
                        <span className={`font-mono font-bold ${
                          testQueryMap[chunk.id]!.score! >= 0.72 ? 'text-emerald-400' :
                          testQueryMap[chunk.id]!.score! >= 0.5 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {testQueryMap[chunk.id]!.score!.toFixed(3)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
