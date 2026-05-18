'use client';

import React, { useState, useEffect } from 'react';
import { Template, UploadedSource, BatchConfig, GeneratedArticle } from '@/types';
import { mockSources } from '@/lib/mock-data';
import UploadStep from '@/components/steps/UploadStep';
import KeywordInputStep, { KeywordInputRow } from '@/components/steps/KeywordInputStep';
import TemplateStep from '@/components/steps/TemplateStep';
import ConfigStep from '@/components/steps/ConfigStep';
import PlanStep from '@/components/steps/PlanStep';
import { useBatch } from '@/contexts/BatchContext';
import { useSite } from '@/contexts/SiteContext';

const steps = [
  { id: 1, label: 'Upload Sources', icon: '📤' },
  { id: 2, label: 'Select Template', icon: '📋' },
  { id: 3, label: 'Configure & Plan', icon: '⚙️' },
  { id: 4, label: 'Review & Generate', icon: '✨' },
];

export default function BatchGenerator() {
  const [currentStep, setCurrentStep] = useState(1);
  const { currentSite } = useSite();
  const [inputType, setInputType] = useState<'topic' | 'keyword'>('topic');
  const [sources, setSources] = useState<UploadedSource[]>(mockSources);
  const [keywordRows, setKeywordRows] = useState<KeywordInputRow[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lc_batch_template');
        return saved ? JSON.parse(saved) : null;
      } catch { return null; }
    }
    return null;
  });
  const [config, setConfig] = useState<BatchConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lc_batch_config');
        return saved ? JSON.parse(saved) : { articleCount: 1, tone: 'professional', language: 'vi', minWords: 800, maxWords: 2000, customInstructions: '' };
      } catch { /* fall through */ }
    }
    return { articleCount: 1, tone: 'professional', language: 'vi', minWords: 800, maxWords: 2000, customInstructions: '' };
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatusLocal, setGenerationStatusLocal] = useState('');
  const [extractedText, setExtractedText] = useState('');
  
  // Connect to Global Batch Context
  const { 
    planItems, setPlanItems, 
    isGeneratingAll, isGeneratingItem, 
    generationStatus, setGenerationStatus,
    startBatch, cancelBatch, clearBatch,
    totalItems
  } = useBatch();

  // If there's an active or loaded batch, jump to step 4 on mount
  useEffect(() => {
    if (totalItems > 0 && currentStep !== 4) {
      setCurrentStep(4);
    }
  }, [totalItems]);

  // Persist selectedTemplate & config to localStorage
  useEffect(() => {
    if (selectedTemplate) {
      localStorage.setItem('lc_batch_template', JSON.stringify(selectedTemplate));
    }
  }, [selectedTemplate]);

  useEffect(() => {
    localStorage.setItem('lc_batch_config', JSON.stringify(config));
  }, [config]);
  
  // Category & data management
  const [batchCategory, setBatchCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [internalLinks, setInternalLinks] = useState<{anchor: string; url: string}[]>([]);

  // Load categories & internal links from API (scoped to current site)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, linksRes] = await Promise.all([
          fetch(`/api/data/categories?siteId=${currentSite}`),
          fetch(`/api/data/links?siteId=${currentSite}`)
        ]);
        if (catsRes.ok) {
          const catsData = await catsRes.json();
          setCategories(catsData);
        }
        if (linksRes.ok) {
          const linksData = await linksRes.json();
          setInternalLinks(linksData.map((l: any) => ({ anchor: l.anchor, url: l.url })));
        }
      } catch (e) {
        console.error('Lỗi khi load categories và links:', e);
      }
    };
    fetchData();
  }, [currentSite]);

  const canProceed = () => {
    if (currentStep === 1) {
      if (inputType === 'topic') return sources.length > 0;
      // Keyword mode: need at least 1 row with a non-empty keyword
      return keywordRows.some(r => r.keyword.trim().length > 0);
    }
    if (currentStep === 2) return selectedTemplate !== null;
    // Step 3: DON'T allow Next — user must click "Generate Plan" button instead
    if (currentStep === 3) return false;
    return true;
  };

  // Extract text from sources when moving from step 1 to step 2
  const handleStepChange = async (nextStep: number) => {
    if (currentStep === 1 && nextStep === 2 && inputType === 'topic' && sources.length > 0 && !extractedText) {
      // Check if we have anything to extract
      const urlSources = sources.filter((s) => s.type === 'url' && s.url);
      const fileSources = sources.filter((s) => s.type === 'pdf' && s.file);

      if (urlSources.length > 0 || fileSources.length > 0) {
        setIsGenerating(true);
        try {
          setGenerationStatusLocal('Đang trích xuất nội dung từ các nguồn đã chọn...');
          
          const formData = new FormData();
          urlSources.forEach(s => formData.append('urls', s.url!));
          fileSources.forEach(s => formData.append('files', s.file!));

          const response = await fetch('/api/extract', {
            method: 'POST',
            body: formData, // fetch will set multipart header automatically
          });
          
          if (response.ok) {
            const data = await response.json();
            setExtractedText(data.text);
          } else {
            console.error('Failed to extract text', await response.text());
          }
        } catch (error) {
          console.error('Extraction error:', error);
        } finally {
          setIsGenerating(false);
          setGenerationStatusLocal('');
        }
      }
    }
    setCurrentStep(nextStep);
  };

  const handleGeneratePlan = async () => {
    if (!selectedTemplate || isGenerating) return;

    setIsGenerating(true);

    if (inputType === 'keyword') {
      setGenerationStatusLocal('🚀 Đang chuyển đổi danh sách Keyword thành Kế hoạch...');
      try {
        // Filter out rows with empty keywords
        const validRows = keywordRows.filter(row => row.keyword.trim().length > 0);
        if (validRows.length === 0) {
          setGenerationStatusLocal('❌ Không có keyword nào hợp lệ. Vui lòng nhập ít nhất 1 keyword.');
          setIsGenerating(false);
          return;
        }
        const items = validRows.map((row) => ({
          id: row.id,
          title: row.keyword.trim(),
          outline: row.outline,
          keyword: row.keyword.trim(),
          referenceLink: row.referenceLink,
          category: batchCategory || undefined,
          tags: row.tags && row.tags.length > 0 ? row.tags : undefined,
          status: 'draft' as const,
        }));
        setPlanItems(items);
        setGenerationStatusLocal(`✅ Đã lập kế hoạch cho ${items.length} bài viết. Chuyển sang bước duyệt dàn ý.`);
        setCurrentStep(4);
      } catch (err) {
        setGenerationStatusLocal('❌ Lỗi xử lý keyword');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    setGenerationStatusLocal('🚀 Đang yêu cầu AI phân tích và lập dàn ý...');

    try {
      const sourceText =
        extractedText ||
        sources
          .map((s) => `Nguồn: ${s.name}${s.url ? ` (${s.url})` : ''}`)
          .join('\n');

      const response = await fetch('/api/batch-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText,
          templateId: selectedTemplate.id,
          articleCount: config.articleCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan');
      }

      setPlanItems(data.items);
      setGenerationStatusLocal(`✅ Đã lập kế hoạch cho ${data.items.length} bài viết. Chuyển sang bước duyệt dàn ý.`);
      setCurrentStep(4);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setGenerationStatusLocal(`❌ Lỗi: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartBatchContext = () => {
    if (!selectedTemplate) {
      // Try to recover from localStorage
      try {
        const saved = localStorage.getItem('lc_batch_template');
        if (saved) {
          const recovered = JSON.parse(saved) as Template;
          setSelectedTemplate(recovered);
          const finalSourceText = extractedText || sources.map(s => s.name).join('\n');
          startBatch(planItems, recovered, config, finalSourceText, batchCategory, internalLinks);
          return;
        }
      } catch {}
      alert('⚠️ Vui lòng quay lại Bước 2 để chọn Template trước khi tạo bài.');
      return;
    }
    const finalSourceText = extractedText || sources.map(s => s.name).join('\n');
    startBatch(planItems, selectedTemplate, config, finalSourceText, batchCategory, internalLinks);
  };

  return (
    <main className="flex-1 h-screen overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mb-2 uppercase tracking-wider font-medium">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-[var(--text-accent)]">Batch Generator</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
            Batch Content Generator
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Tạo hàng loạt bài viết y khoa từ nguồn PDF/URL với AI
          </p>
        </div>

        {/* Step indicator */}
        <div className="glass-card p-4 rounded-xl mb-6">
          <div className="flex items-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => {
                    if (step.id < currentStep || (step.id === currentStep)) {
                      setCurrentStep(step.id);
                    }
                  }}
                  className={`
                    flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-300 group
                    ${currentStep === step.id
                      ? 'bg-[var(--lc-primary)]/10'
                      : step.id < currentStep
                      ? 'opacity-60 hover:opacity-80 cursor-pointer'
                      : 'opacity-30'
                    }
                  `}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                      transition-all duration-300
                      ${currentStep === step.id
                        ? 'bg-[var(--lc-primary)] text-[var(--text-primary)] shadow-[0_0_12px_rgba(0,102,204,0.4)]'
                        : step.id < currentStep
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-[var(--bg-card-hover)] text-[var(--text-muted)]'
                      }
                    `}
                  >
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  <div className="text-left">
                    <p className={`text-xs font-semibold ${
                      currentStep === step.id ? 'text-[var(--text-accent)]' : 'text-[var(--text-secondary)]'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2">
                    <div className="h-px bg-[var(--bg-card-hover)] relative">
                      <div
                        className="h-px bg-[var(--lc-primary)] transition-all duration-500"
                        style={{ width: step.id < currentStep ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Generation status banner */}
        {generationStatus && (
          <div className={`glass-card p-4 rounded-xl mb-6 animate-fade-in flex items-center gap-3 ${
            generationStatus.startsWith('❌') ? 'border border-red-500/30' :
            generationStatus.startsWith('✅') ? 'border border-emerald-500/30' :
            'border border-blue-500/30'
          }`}>
            {isGenerating && (
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            )}
            <p className="text-sm text-[var(--text-primary)]">{generationStatus}</p>
          </div>
        )}

        {/* Step content */}
        <div className="glass-card p-6 rounded-xl mb-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex bg-[var(--bg-card-hover)] p-1 rounded-xl w-fit">
                <button
                  onClick={() => setInputType('topic')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    inputType === 'topic' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.1)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  📄 Tạo từ Chủ Đề (PDF/URL)
                </button>
                <button
                  onClick={() => setInputType('keyword')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    inputType === 'keyword' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.1)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  🎯 Tạo theo Từ Khóa (CSV)
                </button>
              </div>

              {inputType === 'topic' ? (
                <UploadStep sources={sources} onSourcesChange={setSources} />
              ) : (
                <>
                  <KeywordInputStep rows={keywordRows} onRowsChange={setKeywordRows} />
                  
                  {/* Batch category selector */}
                  <div className="mt-6 p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-default)] space-y-2">
                    <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">📂 Danh mục chung cho Batch</label>
                    <select
                      className="input-field appearance-none cursor-pointer text-sm"
                      value={batchCategory}
                      onChange={(e) => setBatchCategory(e.target.value)}
                    >
                      <option value="">— Để AI tự chọn —</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Danh mục này sẽ áp dụng cho tất cả bài viết trong batch. Quản lý tại <a href="/data" className="text-[var(--lc-primary)] underline">Quản lý Dữ liệu</a>.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          {currentStep === 2 && (
            <TemplateStep
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
              siteId={currentSite}
            />
          )}
          {currentStep === 3 && (
            <ConfigStep
              config={config}
              onConfigChange={setConfig}
              selectedTemplate={selectedTemplate}
              sourceCount={sources.length}
              onGenerate={handleGeneratePlan}
              extractedText={extractedText}
            />
          )}
          {currentStep === 4 && (
            <PlanStep
              items={planItems}
              onItemsChange={setPlanItems}
              isGenerating={isGeneratingAll}
              generationStatus={generationStatus || generationStatusLocal}
              onGenerateAll={handleStartBatchContext}
              onCancelAll={cancelBatch}
              onClearAll={() => {
                clearBatch();
                setSelectedTemplate(null);
                localStorage.removeItem('lc_batch_template');
                localStorage.removeItem('lc_batch_config');
                setCurrentStep(1);
              }}
              templateId={selectedTemplate?.id}
            />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1 || isGenerating}
            className="btn-secondary flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {currentStep < 3 && (
            <button
              onClick={() => handleStepChange(currentStep + 1)}
              disabled={!canProceed()}
              className="btn-primary flex items-center gap-2"
            >
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
