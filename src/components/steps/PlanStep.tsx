'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BatchPlanItem } from '@/types';
import Link from 'next/link';
import { exportBatchToZip } from '@/lib/export-docx';

interface PlanStepProps {
  items: BatchPlanItem[];
  onItemsChange: React.Dispatch<React.SetStateAction<BatchPlanItem[]>>;
  isGenerating: boolean;
  generationStatus: string;
  onGenerateAll: () => void;
  onCancelAll: () => void;
  onClearAll: () => void;
  templateId?: string; // needed for AI outline generation
}

export default function PlanStep({
  items,
  onItemsChange,
  isGenerating,
  generationStatus,
  onGenerateAll,
  onCancelAll,
  onClearAll,
  templateId,
}: PlanStepProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generatingOutlineIds, setGeneratingOutlineIds] = useState<Set<string>>(new Set());
  const [outlineErrors, setOutlineErrors] = useState<Record<string, string>>({});
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  // ─── Manual batch generate outlines ────────
  const handleGenerateOutlinesBatch = async () => {
    if (!templateId) return;
    
    // Determine which items need outlines at this exact moment
    const itemsNeedingOutline = items.filter(
      item => item.status === 'draft' && !item.outline && item.title && !generatingOutlineIds.has(item.id)
    );

    if (itemsNeedingOutline.length === 0) return;

    for (const item of itemsNeedingOutline) {
      setGeneratingOutlineIds(prev => new Set(prev).add(item.id));
      
      try {
        const res = await fetch('/api/generate-outline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: item.keyword || item.title,
            title: item.title,
            templateId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.outline) {
            // Function update guarantees we don't overwrite user edits!
            onItemsChange(prev => 
              prev.map(i => i.id === item.id ? { ...i, outline: data.outline } : i)
            );
          }
        } else {
          const err = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
          setOutlineErrors(prev => ({ ...prev, [item.id]: err.error || 'Lỗi tạo dàn ý' }));
        }
      } catch (e) {
        setOutlineErrors(prev => ({ ...prev, [item.id]: 'Lỗi kết nối' }));
      } finally {
        setGeneratingOutlineIds(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    }
  };

  // ─── Reload outline for a specific item ─────────────────────
  const handleReloadOutline = useCallback(async (itemId: string) => {
    if (!templateId) return;
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setGeneratingOutlineIds(prev => new Set(prev).add(itemId));
    setOutlineErrors(prev => { const next = {...prev}; delete next[itemId]; return next; });

    try {
      const res = await fetch('/api/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: item.keyword || item.title,
          title: item.title,
          templateId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.outline) {
          onItemsChange(prev => 
            prev.map(i => i.id === itemId ? { ...i, outline: data.outline } : i)
          );
        }
      } else {
        const err = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
        setOutlineErrors(prev => ({ ...prev, [itemId]: err.error || 'Lỗi tạo dàn ý' }));
      }
    } catch (e) {
      setOutlineErrors(prev => ({ ...prev, [itemId]: 'Lỗi kết nối' }));
    } finally {
      setGeneratingOutlineIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [items, templateId, onItemsChange]);

  const handleEditTitle = (id: string, newTitle: string) => {
    onItemsChange(prev => prev.map(item => item.id === id ? { ...item, title: newTitle } : item));
  };
  
  const handleEditOutline = (id: string, newOutline: string) => {
    onItemsChange(prev => prev.map(item => item.id === id ? { ...item, outline: newOutline } : item));
  };

  const handleRemove = (id: string) => {
    onItemsChange(prev => prev.filter(item => item.id !== id));
  };

  const getStatusBadge = (status: BatchPlanItem['status']) => {
    switch(status) {
      case 'draft': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400">Draft</span>;
      case 'generating': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 flex items-center gap-1">Generating <span className="animate-pulse">⏳</span></span>;
      case 'completed': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">Completed</span>;
      case 'failed': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">Failed</span>;
    }
  };

  const allCompleted = items.length > 0 && items.every(i => i.status === 'completed');

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "batch_articles.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportDocx = async () => {
    const completedItems = items.filter(i => i.status === 'completed' && i.articleId);
    if (completedItems.length === 0) return;

    setIsExportingDocx(true);
    try {
      // Fetch full article content from API
      const articleIds = completedItems.map(i => i.articleId!);
      const res = await fetch('/api/articles/export-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch articles for export');
      }

      const articles = await res.json();
      await exportBatchToZip(articles, `batch_${new Date().toISOString().slice(0, 10)}`);
    } catch (error) {
      console.error('DOCX export error:', error);
      alert('❌ Lỗi khi export DOCX. Vui lòng thử lại.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const pendingCount = items.filter(i => i.status === 'draft' || i.status === 'failed').length;
  const generatingCount = items.filter(i => i.status === 'generating').length;
  const totalETA = (pendingCount + generatingCount) * 30; // 30s per article

  const isOutlineGenerating = generatingOutlineIds.size > 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            Chạy Kế Hoạch Hàng Loạt
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Kiểm tra và theo dõi quá trình AI tự động sinh bài viết. Có thể chuyển trang khác, web vẫn sẽ chạy ngầm.
          </p>
          {generationStatus && (
            <p className={`text-[12px] mt-2 flex items-center gap-2 ${generationStatus.includes('❌') ? 'text-red-400' : 'text-[var(--text-accent)] font-medium'}`}>
              {isGenerating && <span className="animate-spin w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full block"></span>}
              {generationStatus}
            </p>
          )}
          {totalETA > 0 && isGenerating && (
            <p className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
              Thời gian dự kiến: ~{totalETA} giây ({pendingCount + generatingCount} bài)
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {items.some(i => i.status === 'completed') && (
            <>
              <button
                onClick={handleExportDocx}
                disabled={isExportingDocx}
                className="btn-secondary px-4 py-2 flex items-center gap-2 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs disabled:opacity-50 disabled:cursor-wait"
              >
                {isExportingDocx ? (
                  <>
                    <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    Đang export...
                  </>
                ) : (
                  <>
                    <span>📦</span> Export ZIP
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadJSON}
                className="btn-secondary px-4 py-2 flex items-center gap-2 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs"
              >
                <span>⬇️</span> Download JSON
              </button>
            </>
          )}
          
          <button
            onClick={onClearAll}
            className="btn-secondary px-4 py-2 flex items-center gap-2 text-xs"
          >
            Làm lại từ đầu
          </button>
          
          {!allCompleted && (
            <div className="flex gap-2">
              {isGenerating ? (
                <button
                  onClick={onCancelAll}
                  className="btn-secondary px-4 py-1.5 text-xs flex items-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <span>⏹️</span>
                  Dừng tạo bài
                </button>
              ) : (
                <>
                  <button
                    onClick={handleGenerateOutlinesBatch}
                    disabled={isOutlineGenerating || isGenerating}
                    className="btn-secondary bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 border-transparent px-4 py-1.5 text-xs whitespace-nowrap disabled:opacity-50"
                  >
                    1. Tạo dàn ý (Batch)
                  </button>
                  <button
                    onClick={onGenerateAll}
                    disabled={isOutlineGenerating}
                    className="btn-primary px-4 py-1.5 text-xs whitespace-nowrap disabled:opacity-50"
                  >
                    2. Tạo bài viết (Batch)
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Outline generation status banner */}
      {isOutlineGenerating && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 animate-fade-in">
          <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <p className="text-xs font-medium text-violet-400">
              🧠 AI đang lên dàn ý tự động cho {generatingOutlineIds.size} bài viết chưa có outline...
            </p>
            <p className="text-[10px] text-violet-300/70 mt-0.5">
              Bạn có thể chỉnh sửa dàn ý sau khi AI hoàn tất, hoặc nhấn 🔄 để tạo lại.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Article List */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div 
              key={item.id} 
              className={`glass-card p-4 rounded-xl border transition-colors cursor-pointer ${editingId === item.id ? 'border-[var(--lc-primary)]' : 'border-[var(--border-default)] hover:border-[var(--border-default)]'}`}
              onClick={() => setEditingId(item.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--bg-card-hover)] text-[10px] flex items-center justify-center font-mono">
                    {index + 1}
                  </span>
                  {getStatusBadge(item.status)}
                  {/* Outline status indicator */}
                  {generatingOutlineIds.has(item.id) ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-violet-500/15 text-violet-400 flex items-center gap-1">
                      <span className="w-2 h-2 border border-violet-400 border-t-transparent rounded-full animate-spin" />
                      Đang tạo dàn ý
                    </span>
                  ) : item.outline ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">📝 Có dàn ý</span>
                  ) : outlineErrors[item.id] ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400">❌ Lỗi</span>
                  ) : null}
                </div>
                
                <div className="flex items-center gap-1">
                  {item.status === 'completed' && item.articleId && (
                    <Link 
                      href={`/review?id=${item.articleId}`}
                      target="_blank"
                      className="px-2 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded text-[10px] font-bold transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Kiểm duyệt
                    </Link>
                  )}
                  {item.status === 'draft' && !isGenerating && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                      title="Remove"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2">
                {item.title}
              </h4>
              
              {/* Preview first 2 lines of outline */}
              {item.outline && (
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed font-mono">
                  {item.outline.split('\n').slice(0, 2).join(' → ')}...
                </p>
              )}
              
              {item.status === 'generating' && (
                <div className="mt-3">
                  <div className="flex justify-between text-[9px] text-[var(--text-muted)] mb-1">
                    <span>Generating Content...</span>
                    <span>~30s</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all ease-linear"
                      style={{ 
                        width: '100%',
                        animation: 'progress-bar 30s linear forwards'
                      }} 
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Injecting keyframes for progress bar animation */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes progress-bar {
              0% { width: 0%; }
              10% { width: 25%; }
              30% { width: 50%; }
              70% { width: 85%; }
              100% { width: 95%; } /* Will jump to 100% on complete */
            }
          `}} />
        </div>

        {/* Right: Plan Editor */}
        <div className="h-[500px] flex flex-col">
          {editingId ? (() => {
            const activeItem = items.find(i => i.id === editingId);
            if (!activeItem) return null;
            const isOutlineLoading = generatingOutlineIds.has(activeItem.id);
            
            return (
              <div className="glass-card gradient-border p-5 rounded-xl h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">✍️</span>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Edit Article Plan</h3>
                </div>
                
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      Tiêu đề bài viết
                    </label>
                    <input 
                      type="text"
                      className="input-field py-2"
                      value={activeItem.title}
                      onChange={(e) => handleEditTitle(activeItem.id, e.target.value)}
                      placeholder="Nhập tiêu đề..."
                      disabled={activeItem.status === 'generating'}
                    />
                  </div>
                  
                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Dàn ý chi tiết (H2, H3 theo template)
                      </label>
                      <div className="flex items-center gap-2">
                        {isOutlineLoading && (
                          <span className="text-[9px] text-violet-400 flex items-center gap-1">
                            <span className="w-2.5 h-2.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                            AI đang lên dàn ý...
                          </span>
                        )}
                        {activeItem.outline && !isOutlineLoading && (
                          <span className="text-[9px] text-emerald-400">✓ AI đã tạo</span>
                        )}
                        <button
                          onClick={() => handleReloadOutline(activeItem.id)}
                          disabled={isOutlineLoading || activeItem.status === 'generating' || !templateId}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold
                            bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 
                            disabled:opacity-30 disabled:cursor-not-allowed
                            transition-colors"
                          title="Tạo lại dàn ý bằng AI"
                        >
                          <svg 
                            width="12" height="12" viewBox="0 0 24 24" 
                            fill="none" stroke="currentColor" strokeWidth="2.5"
                            className={isOutlineLoading ? 'animate-spin' : ''}
                          >
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 16h5v5" />
                          </svg>
                          {isOutlineLoading ? 'Đang tạo...' : 'Tạo lại dàn ý'}
                        </button>
                      </div>
                    </div>

                    {/* Error message */}
                    {outlineErrors[activeItem.id] && (
                      <p className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded">
                        ❌ {outlineErrors[activeItem.id]}
                      </p>
                    )}

                    {isOutlineLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center rounded-xl bg-violet-500/5 border border-violet-500/10">
                        <div className="w-8 h-8 border-3 border-violet-400 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-xs text-violet-400 font-medium">🧠 AI đang phân tích & lên dàn ý...</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">Dựa trên keyword và template đã chọn</p>
                      </div>
                    ) : (
                      <textarea 
                        className="input-field flex-1 resize-none font-mono text-xs leading-relaxed"
                        value={activeItem.outline}
                        onChange={(e) => handleEditOutline(activeItem.id, e.target.value)}
                        placeholder="Nhập dàn ý chi tiết... (hoặc đợi AI tự tạo)"
                        disabled={activeItem.status === 'generating'}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-default)] rounded-xl text-center p-8">
              <span className="text-4xl opacity-50 mb-4">📝</span>
              <p className="text-sm text-[var(--text-secondary)]">
                Chọn một bài viết bên trái để chỉnh sửa <br/> Tiêu đề và Dàn ý chi tiết.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
