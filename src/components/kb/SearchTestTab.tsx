'use client';

import React, { useState } from 'react';
import { MOCK_CHUNKS, MOCK_KB_SOURCES, KBChunk } from '@/lib/kb/mock-kb-data';
import { Search, Loader2, Link, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SearchResult extends KBChunk {
  similarity_score: number;
  source_title: string;
  source_type: string;
}

export default function SearchTestTab() {
  const [query, setQuery] = useState('');
  const [template, setTemplate] = useState('BENH_LY');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isKbSufficient, setIsKbSufficient] = useState<boolean>(true);

  const handleSearch = () => {
    if (!query) return;
    setIsSearching(true);
    setResults(null);

    // Giả lập delay mạng & vector search (RAG)
    setTimeout(() => {
      // Vì là mock data, chúng ta lấy ngẫu nhiên chunks từ các nguồn đang active và giả lập điểm score
      const allChunks: SearchResult[] = [];
      const sourcesMap = new Map(MOCK_KB_SOURCES.map(s => [s.id, s]));

      Object.values(MOCK_CHUNKS).forEach(chunksList => {
         chunksList.forEach(c => {
            const src = sourcesMap.get(c.source_id);
            if (src && src.is_active && src.status === 'ready') {
              // Phân bổ điểm ngẫu nhiên để demo (đẩy điểm cao nếu query có keyword trùng với text)
              let score = Math.random() * 0.3 + 0.4; // Base 0.4 - 0.7
              if (query.toLowerCase().includes('đường') && c.content.toLowerCase().includes('đái tháo đường')) {
                  score += 0.3; // Boost score
              }
              if (query.toLowerCase().trim() === 'test') {
                  score = 0.5; // low score
              }

               allChunks.push({
                 ...c,
                 similarity_score: score,
                 source_title: src.title,
                 source_type: src.source_type
               });
            }
         });
      });

      // Sort by score
      allChunks.sort((a, b) => b.similarity_score - a.similarity_score);
      
      const topResults = allChunks.slice(0, 8);
      setResults(topResults);

      // Sufficiency Logic: If top core < 0.72 or length < 3
      const topScore = topResults.length > 0 ? topResults[0].similarity_score : 0;
      if (topScore < 0.72 || topResults.length < 3) {
         setIsKbSufficient(false);
      } else {
         setIsKbSufficient(true);
      }

      setIsSearching(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] overflow-y-auto custom-scrollbar">
       <div className="max-w-4xl mx-auto w-full px-4 py-8">
          
          <div className="mb-8">
             <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">RAG Search Sandbox</h2>
             <p className="text-sm text-[var(--text-secondary)]">Nhập chủ đề bài viết để kiểm tra nội dung được vector-search từ thẻ nhớ Knowledge Base trước khi cấp cho tác giả tự động.</p>
          </div>

          {/* Search Box */}
          <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row gap-3 mb-8 border border-[var(--lc-primary)]/20 shadow-[0_0_30px_rgba(0,102,204,0.05)]">
             <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input 
                  type="text"
                  placeholder="Ví dụ: Triệu chứng bệnh đái tháo đường ở người trẻ..."
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl py-3 pl-11 pr-4 text-sm focus:border-[var(--lc-primary)] focus:outline-none transition-colors"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
             </div>
             <select 
               className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm min-w-40 focus:border-[var(--lc-primary)] focus:outline-none cursor-pointer"
               value={template}
               onChange={e => setTemplate(e.target.value)}
             >
                <option value="BENH_LY">Bài Bệnh Lý</option>
                <option value="THUOC">Bài Dược Chất</option>
                <option value="GSK_BLOG">Blog Sức Khoẻ</option>
             </select>
             <button 
               onClick={handleSearch}
               disabled={!query || isSearching}
               className="btn-primary py-3 px-8 rounded-xl shadow-lg disabled:opacity-50 whitespace-nowrap min-w-32 flex justify-center"
             >
               {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Tìm Nguồn'}
             </button>
          </div>

          {/* Results Area */}
          {results && (
            <div className="animate-fade-in space-y-6">
              
              {/* Indicator Banner */}
               {isKbSufficient ? (
                 <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                       <CheckCircle2 size={20} />
                    </div>
                    <div>
                       <h3 className="font-bold text-emerald-400 text-sm mb-1">Knowledge Base đủ nội dung! (Top Score: {(results[0]?.similarity_score * 100).toFixed(1)}%)</h3>
                       <p className="text-xs text-[var(--text-secondary)] opacity-90">Có đủ tài liệu tham khảo chất lượng cao. Bài viết tạo ra sẽ được khoá prompt "chỉ sử dụng nguồn nội bộ", ngăn chặn tuyệt đối tình trạng AI tự bịa thông tin.</p>
                    </div>
                 </div>
               ) : (
                 <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                       <AlertTriangle size={20} />
                    </div>
                    <div>
                       <h3 className="font-bold text-amber-500 text-sm mb-1">Dữ liệu nguồn mỏng (Top Score: {(results[0]?.similarity_score * 100).toFixed(1)}%)</h3>
                       <p className="text-xs text-[var(--text-secondary)] opacity-90">Thẻ nhớ không đủ nội dung sát chủ đề. AI sẽ tự động kích hoạt tính năng <strong className="text-[var(--text-primary)]">Open-Domain Fetching</strong> để tìm thêm trên Internet (Dựa trên whitelist: WHO, CDC, PubMed). Những trích dẫn tìm thấy sẽ bị dán nhãn Thẩm Định Nguồn.</p>
                    </div>
                 </div>
               )}

              {/* Chunks List */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4">Top k Chunks Trả Về (Tối đa 8)</h4>
                
                {results.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] italic">Không tìm thấy bất kỳ text chunk nào.</p>
                ) : (
                  results.map((chunk, i) => (
                    <div key={chunk.id} className="bg-[var(--bg-secondary)] border border-[var(--border-default)] p-5 rounded-xl hover:border-blue-500/30 transition-colors">
                       <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border-default)]/50">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-muted)]">
                                {chunk.source_type === 'pdf' ? <FileText size={12} /> : <Link size={12} />}
                             </div>
                             <span className="text-xs font-bold text-[var(--text-primary)]">{chunk.source_title}</span>
                             {chunk.section_heading && <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-full">Section: {chunk.section_heading}</span>}
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] text-[var(--text-muted)]">Score:</span>
                             <span className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
                                chunk.similarity_score >= 0.72 ? 'bg-emerald-500/20 text-emerald-400' :
                                chunk.similarity_score >= 0.5 ? 'bg-amber-500/20 text-amber-400' :
                                'bg-red-500/20 text-red-400'
                             }`}>
                               {chunk.similarity_score.toFixed(3)}
                             </span>
                          </div>
                       </div>
                       
                       <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-4">
                          {chunk.content}
                       </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

       </div>
    </div>
  );
}
