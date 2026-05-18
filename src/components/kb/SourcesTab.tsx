'use client';

import React, { useState, useEffect } from 'react';
import { KBSource, getSavedSources, saveSources } from '@/lib/kb/mock-kb-data';
import UploadSourceModal from './UploadSourceModal';
import { FileText, Link as LinkIcon, Search, Plus, RefreshCw, Eye, Trash2, PowerOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SourcesTab() {
  const router = useRouter();
  const [sources, setSources] = useState<KBSource[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    setSources(getSavedSources());
    const handleStorage = () => {
       setSources(getSavedSources());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleUploadComplete = (newSource: KBSource | KBSource[]) => {
    const updated = Array.isArray(newSource) 
      ? [...newSource, ...sources] 
      : [newSource, ...sources];
      
    setSources(updated);
    saveSources(updated);
    window.dispatchEvent(new Event('storage')); // UI sync
    setIsModalOpen(false);
  };

  const handleDeactivate = (id: string, currentActive: boolean) => {
    const updated = sources.map(s => s.id === id ? { ...s, is_active: !currentActive } : s);
    setSources(updated);
    saveSources(updated);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá hoàn toàn dữ liệu Nguồn này khỏi Index?")) return;
    const updated = sources.filter(s => s.id !== id);
    setSources(updated);
    saveSources(updated);
  };

  const handleReindex = (id: string) => {
    alert("Re-index tính năng cần Backend để extract lại embeddings. Sẽ sớm được bổ sung!");
  };

  const filteredSources = sources.filter(s => {
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase()) && !s.publisher.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType && s.source_type !== filterType) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
       {/* Actions Bar */}
       <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                <input 
                  type="text" 
                  placeholder="Tìm tên, publisher, topic..." 
                  className="input-field py-2 pl-9 text-xs w-64 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             
             <select 
               className="input-field py-2 text-xs w-36 shadow-sm cursor-pointer"
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
             >
                <option value="">Tất cả Loại</option>
                <option value="pdf">PDF File</option>
                <option value="url">URL Nguồn</option>
             </select>

             <select 
               className="input-field py-2 text-xs w-36 shadow-sm cursor-pointer"
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
             >
                <option value="">Status (Tất cả)</option>
                <option value="ready">Ready (Indexed)</option>
                <option value="processing">Processing</option>
                <option value="error">Error</option>
             </select>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary py-2 px-5 text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,102,204,0.3)]"
          >
            <Plus size={14} /> Thêm tài liệu mới
          </button>
       </div>

       {/* Data Table */}
       <div className="glass-card rounded-xl flex-1 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-[1fr_100px_120px_80px_100px_120px_180px] gap-4 px-5 py-3 border-b border-[var(--border-default)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider items-center bg-[var(--bg-secondary)]">
             <span>Title & Topics</span>
             <span>Type</span>
             <span>Publisher</span>
             <span className="text-center">Year</span>
             <span className="text-center">Chunks</span>
             <span className="text-center">Status</span>
             <span className="text-center">Actions</span>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-default)]">
             {filteredSources.length === 0 ? (
               <div className="p-10 text-center flex flex-col items-center">
                 <span className="text-4xl opacity-50 mb-3">📭</span>
                 <p className="text-[var(--text-muted)] text-sm">Không tìm thấy tài liệu nào trong thư viện.</p>
               </div>
             ) : (
                filteredSources.map((source) => (
                  <div key={source.id} className={`grid grid-cols-[1fr_100px_120px_80px_100px_120px_180px] gap-4 px-5 py-4 items-center transition-colors group hover:bg-[var(--bg-card-hover)] ${!source.is_active ? 'opacity-60 saturate-50' : ''}`}>
                     
                     {/* Title */}
                     <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="font-medium text-sm text-[var(--text-primary)] truncate" title={source.title}>{source.title}</span>
                           {!source.is_active && <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 font-bold uppercase">Deactivated</span>}
                        </div>
                        <div className="flex gap-1 overflow-hidden">
                           {(source.topic_tags || []).slice(0, 3).map(t => (
                             <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--lc-primary)]/10 text-[var(--text-secondary)] whitespace-nowrap">#{t}</span>
                           ))}
                           {(source.topic_tags || []).length > 3 && (
                             <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--bg-card-hover)] text-[var(--text-muted)]">+{source.topic_tags.length - 3}</span>
                           )}
                        </div>
                     </div>

                     {/* Type */}
                     <div className="flex flex-col gap-1.5 justify-center">
                        <div className="flex items-center gap-2">
                           {source.source_type === 'pdf' ? <FileText size={14} className="text-red-400" /> : <LinkIcon size={14} className="text-blue-400" />}
                           <span className="text-xs text-[var(--text-secondary)] uppercase">{source.source_type}</span>
                        </div>
                        <span className={`text-[9px] w-fit px-1.5 py-0.5 font-bold rounded-sm ${source.scope === 'general' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' : 'bg-sky-500/15 text-sky-400 border border-sky-500/20'}`}>
                           {source.scope === 'general' ? 'Toàn tập' : 'Chuyên đề'}
                        </span>
                     </div>

                     {/* Publisher */}
                     <div>
                        <span className="text-xs text-[var(--text-primary)] truncate block" title={source.publisher}>{source.publisher}</span>
                     </div>

                     {/* Year */}
                     <div className="text-center">
                        <span className="text-xs font-mono text-[var(--text-secondary)]">{source.publish_year || '--'}</span>
                     </div>

                     {/* Chunks */}
                     <div className="text-center">
                        <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">{source.chunk_count}</span>
                     </div>

                     {/* Status */}
                     <div className="flex flex-col items-center justify-center gap-1">
                        <span className={`status-badge text-[10px] ${
                          source.status === 'ready' ? 'bg-emerald-500/15 text-emerald-400' :
                          source.status === 'processing' ? 'bg-blue-500/15 text-blue-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            source.status === 'ready' ? 'bg-emerald-400' :
                            source.status === 'processing' ? 'bg-blue-400 animate-ping' :
                            'bg-red-400'
                          }`} />
                          {source.status}
                        </span>
                        {source.error_msg && <span className="text-[9px] text-red-400 truncate w-full px-2" title={source.error_msg}>{source.error_msg}</span>}
                     </div>

                     {/* Actions */}
                     <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => router.push(`/knowledge-base/source/${source.id}`)} className="p-1.5 rounded bg-[var(--bg-secondary)] hover:bg-[var(--lc-primary)]/20 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" title="Xem danh sách chunks">
                           <Eye size={14} />
                        </button>
                        <button onClick={() => handleReindex(source.id)} className="p-1.5 rounded bg-[var(--bg-secondary)] hover:bg-blue-500/20 text-[var(--text-muted)] hover:text-blue-400 transition-colors" title="Re-index lại">
                           <RefreshCw size={14} />
                        </button>
                        <button onClick={() => handleDeactivate(source.id, source.is_active)} className={`p-1.5 rounded transition-colors ${source.is_active ? 'bg-[var(--bg-secondary)] hover:bg-amber-500/20 text-[var(--text-muted)] hover:text-amber-400' : 'bg-amber-500/20 text-amber-500'}`} title={source.is_active ? "Tắt/Deactivate khởi RAG" : "Bật lại khởi RAG"}>
                           <PowerOff size={14} />
                        </button>
                        <button onClick={() => handleDelete(source.id)} className="p-1.5 rounded bg-[var(--bg-secondary)] hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors" title="Xoá vĩnh viễn">
                           <Trash2 size={14} />
                        </button>
                     </div>
                  </div>
                ))
             )}
          </div>
       </div>

       {isModalOpen && <UploadSourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onComplete={handleUploadComplete} />}
    </div>
  );
}
