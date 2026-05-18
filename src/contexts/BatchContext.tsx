'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { BatchPlanItem, BatchConfig, Template } from '@/types';
import { saveGeneratedArticle } from '@/lib/storage';
import { useSite } from '@/contexts/SiteContext';

interface BatchContextType {
  planItems: BatchPlanItem[];
  setPlanItems: React.Dispatch<React.SetStateAction<BatchPlanItem[]>>;
  isGeneratingAll: boolean;
  isGeneratingItem: string | null;
  generationStatus: string;
  setGenerationStatus: React.Dispatch<React.SetStateAction<string>>;
  startBatch: (
    items: BatchPlanItem[],
    template: Template,
    config: BatchConfig,
    baseSourceText: string,
    batchCategory: string,
    internalLinks: { anchor: string; url: string }[]
  ) => void;
  cancelBatch: () => void;
  // Stats
  totalItems: number;
  completedItems: number;
  failedItems: number;
  inProgressItems: number;
  clearBatch: () => void;
}

const BatchContext = createContext<BatchContextType | undefined>(undefined);

export function BatchProvider({ children }: { children: ReactNode }) {
  const [planItems, setPlanItems] = useState<BatchPlanItem[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isGeneratingItem, setIsGeneratingItem] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const { currentSite } = useSite();

  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef(false);

  // Stats derived from planItems
  const totalItems = planItems.length;
  const completedItems = planItems.filter((i) => i.status === 'completed').length;
  const failedItems = planItems.filter((i) => i.status === 'failed').length;
  const inProgressItems = planItems.filter((i) => i.status === 'draft' || i.status === 'generating').length;

  // Sync state to localStorage for persistence across hard reloads
  useEffect(() => {
    // Re-hydrate on mount
    try {
      const stored = localStorage.getItem('lc_batch_progress');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.items && Array.isArray(parsed.items)) {
          // If we had generating items, reset them to draft so user can manually resume
          const cleanItems = parsed.items.map((i: BatchPlanItem) => 
            i.status === 'generating' ? { ...i, status: 'draft' } : i
          );
          setPlanItems(cleanItems);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    // Save to localStorage whenever it changes
    if (planItems.length > 0) {
      localStorage.setItem('lc_batch_progress', JSON.stringify({ items: planItems }));
    } else {
      localStorage.removeItem('lc_batch_progress');
    }
  }, [planItems]);

  const generateSingleItem = async (
    item: BatchPlanItem,
    template: Template,
    config: BatchConfig,
    baseSourceText: string,
    batchCategory: string,
    internalLinks: { anchor: string; url: string }[]
  ) => {
    if (isCancelledRef.current) return;
    
    setIsGeneratingItem(item.id);
    setPlanItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'generating' } : i));
    setGenerationStatus(`⚙️ Đang tiến hành tạo: ${item.title}...`);

    abortControllerRef.current = new AbortController();

    try {
      let finalSourceText = baseSourceText;
      
      if (item.referenceLink) {
        try {
          const extRes = await fetch('/api/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: [item.referenceLink] })
          });
          if (extRes.ok) {
            const extData = await extRes.json();
            finalSourceText = `--- TÀI LIỆU THAM KHẢO CHO TỪ KHÓA ---\n${extData.text}\n--- KẾT THÚC TÀI LIỆU ---\n\n` + finalSourceText;
          }
        } catch (e) {
          console.error('Failed to extract reference link', e);
        }
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          item,
          settings: {
            sourceText: finalSourceText,
            templateId: template.id,
            siteId: currentSite,
            articleCount: 1,
            tone: config.tone,
            language: config.language,
            minWords: config.minWords,
            maxWords: config.maxWords,
            customInstructions: config.customInstructions,
            category: item.category || batchCategory || undefined,
            tags: item.tags,
            internalLinks: internalLinks.length > 0 ? internalLinks : undefined,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Generation failed');

      // Save to API via storage
      await saveGeneratedArticle(data.article);

      setPlanItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'completed', articleId: data.article.id } : i));
      
      // Dispatch storage event manually so Sidebar and Review Queue sync instantly
      window.dispatchEvent(new Event('storage'));
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setPlanItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'draft' } : i));
      } else {
        const errMsg = error?.message || 'Unknown error';
        console.error('[BatchContext] Generation failed for:', item.title, errMsg);
        setGenerationStatus(`❌ Lỗi tạo "${item.title.substring(0, 40)}...": ${errMsg}`);
        setPlanItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'failed' } : i));
      }
    } finally {
      setIsGeneratingItem(null);
    }
  };

  const startBatch = async (
    newItems: BatchPlanItem[],
    template: Template,
    config: BatchConfig,
    baseSourceText: string,
    batchCategory: string,
    internalLinks: { anchor: string; url: string }[]
  ) => {
    isCancelledRef.current = false;
    setIsGeneratingAll(true);
    
    // Filter out items with empty titles — safety net for malformed plan items
    const validItems = newItems.filter(item => item.title && item.title.trim().length > 0);
    if (validItems.length === 0) {
      setGenerationStatus('❌ Không có bài viết hợp lệ nào để tạo. Vui lòng quay lại và thêm tiêu đề.');
      setIsGeneratingAll(false);
      return;
    }
    
    setPlanItems(validItems);

    for (const item of validItems) {
      if (isCancelledRef.current) break;
      if (item.status === 'draft' || item.status === 'failed') {
        await generateSingleItem(item, template, config, baseSourceText, batchCategory, internalLinks);
      }
    }

    if (!isCancelledRef.current) {
      setGenerationStatus('🎉 Hoàn thành toàn bộ tiến trình Batch!');
    } else {
      setGenerationStatus('🛑 Đã dừng tiến trình Batch.');
    }
    setIsGeneratingAll(false);
  };

  const cancelBatch = () => {
    isCancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGeneratingAll(false);
  };

  const clearBatch = () => {
    cancelBatch();
    setPlanItems([]);
  };

  return (
    <BatchContext.Provider
      value={{
        planItems,
        setPlanItems,
        isGeneratingAll,
        isGeneratingItem,
        generationStatus,
        setGenerationStatus,
        startBatch,
        cancelBatch,
        totalItems,
        completedItems,
        failedItems,
        inProgressItems,
        clearBatch,
      }}
    >
      {children}
    </BatchContext.Provider>
  );
}

export function useBatch() {
  const context = useContext(BatchContext);
  if (context === undefined) {
    throw new Error('useBatch must be used within a BatchProvider');
  }
  return context;
}
