'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TEMPLATES, getOutline, getTemplatesForSite } from '@/lib/templates';
import { BatchConfig, BatchPlanItem } from '@/types';
import { saveGeneratedArticle } from '@/lib/storage';
import { useSite } from '@/contexts/SiteContext';

export default function SingleGenerator() {
  const router = useRouter();
  const { currentSite } = useSite();

  const filteredTemplates = getTemplatesForSite(currentSite);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [outline, setOutline] = useState('');
  const [sourceText, setSourceText] = useState('');
  
  // New: category & tags
  const [selectedCategory, setSelectedCategory] = useState('');
  const [articleTags, setArticleTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Data from API (formerly localStorage)
  const [categories, setCategories] = useState<string[]>([]);
  const [savedTags, setSavedTags] = useState<string[]>([]);
  const [internalLinks, setInternalLinks] = useState<{anchor: string, url: string}[]>([]);
  
  const [config, setConfig] = useState<BatchConfig>({
    articleCount: 1,
    tone: 'professional',
    language: 'vi',
    minWords: 800,
    maxWords: 2000,
    customInstructions: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);
  const [history, setHistory] = useState<{id: string, title: string, templateId: string, date: string}[]>([]);

  // Load draft & history & data management
  useEffect(() => {
    const draftStr = localStorage.getItem('single_draft');
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        setSelectedTemplateId(draft.templateId || '');
        setTitle(draft.title || '');
        setOutline(draft.outline || '');
        setSourceText(draft.sourceText || '');
        if (draft.config) setConfig(draft.config);
        setDraftSavedTime(draft.savedAt);
        if (draft.category) setSelectedCategory(draft.category);
        if (draft.tags) setArticleTags(draft.tags);
      } catch (e) {}
    }
    
    const histStr = localStorage.getItem('single_history');
    if (histStr) {
      try {
        setHistory(JSON.parse(histStr));
      } catch (e) {}
    }

    // Load categories, tags, internal links from DB APIs (scoped to current site)
    const fetchData = async () => {
      try {
        const [catsRes, tagsRes, linksRes] = await Promise.all([
          fetch(`/api/data/categories?siteId=${currentSite}`),
          fetch(`/api/data/tags?siteId=${currentSite}`),
          fetch(`/api/data/links?siteId=${currentSite}`)
        ]);
        if (catsRes.ok) setCategories(await catsRes.json());
        if (tagsRes.ok) setSavedTags(await tagsRes.json());
        if (linksRes.ok) setInternalLinks((await linksRes.json()).map((l:any)=>({anchor:l.anchor, url:l.url})));
      } catch (e) {
        console.error('Lỗi load DB data', e);
      }
    };
    fetchData();
  }, [currentSite]);

  const handleSaveDraft = () => {
    const draft = {
      templateId: selectedTemplateId,
      title,
      outline,
      sourceText,
      config,
      category: selectedCategory,
      tags: articleTags,
      savedAt: new Date().toLocaleTimeString(),
    };
    localStorage.setItem('single_draft', JSON.stringify(draft));
    setDraftSavedTime(draft.savedAt);
  };

  const getCustomPromptPlaceholder = (tid: string) => {
    switch (tid) {
      case 'benh-ly': return 'Ví dụ: Nhấn mạnh phần điều trị tại nhà và khi nào cần gặp bác sĩ...';
      case 'thuoc':
      case 'hoat-chat': return 'Ví dụ: Đi sâu vào cơ chế tác dụng dược lý và liều dùng...';
      case 'blog-gsk': return 'Ví dụ: Giọng văn nhẹ nhàng, đồng cảm, chú ý đối tượng trẻ em...';
      default: return 'VD: Không dùng từ ngữ quá chuyên sâu, giải thích thuật ngữ khó...';
    }
  };

  // Tag management
  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    if (value.trim()) {
      const filtered = savedTags.filter(t => 
        t.toLowerCase().includes(value.toLowerCase()) && !articleTags.includes(t)
      ).slice(0, 8);
      setTagSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setTagSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !articleTags.includes(tag.trim())) {
      setArticleTags([...articleTags, tag.trim()]);
    }
    setTagInput('');
    setTagSuggestions([]);
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    setArticleTags(articleTags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    }
  };

  // Load internal links
  const getInternalLinks = () => {
    return internalLinks.length > 0 ? internalLinks : [];
  };

  const handleGenerate = async () => {
    if (!selectedTemplateId || !title.trim() || !outline.trim()) return;

    setIsGenerating(true);
    setGenerationStatus('🚀 Đang khởi tạo luồng AI Generate...');

    try {
      // Mock a BatchPlanItem to pass into the /api/generate endpoint
      const mockItem: BatchPlanItem = {
        id: `single-${Date.now()}`,
        title: title.trim(),
        outline: outline.trim(),
        status: 'draft',
        category: selectedCategory || undefined,
        tags: articleTags.length > 0 ? articleTags : undefined,
      };

      const internalLinks = getInternalLinks();

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: mockItem,
          settings: {
            sourceText: sourceText.trim() || 'Không có tài liệu nguồn cụ thể, hãy dựa vào kiến thức y khoa chuẩn xác của AI.',
            templateId: selectedTemplateId,
            siteId: currentSite,
            articleCount: 1,
            tone: config.tone,
            language: config.language,
            minWords: config.minWords,
            maxWords: config.maxWords,
            customInstructions: config.customInstructions,
            category: selectedCategory || undefined,
            tags: articleTags.length > 0 ? articleTags : undefined,
            internalLinks: internalLinks.length > 0 ? internalLinks : undefined,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setGenerationStatus(`✅ Đã tạo xong bài viết: ${data.article.title}. Đang chuyển hướng...`);
      
      const savedArticle = await saveGeneratedArticle(data.article);
      if (!savedArticle) {
        throw new Error('Đã tạo bài viết bằng AI thành công nhưng gặp lỗi khi lưu vào Cơ sở dữ liệu (Database). Vui lòng kiểm tra kết nối database hoặc log server Vercel!');
      }

      const newHistory = [{
        id: data.article.id,
        title: data.article.title,
        templateId: selectedTemplateId,
        date: new Date().toLocaleDateString()
      }, ...history].slice(0, 5); // Keep last 5
      setHistory(newHistory);
      localStorage.setItem('single_history', JSON.stringify(newHistory));
      localStorage.removeItem('single_draft');
      setDraftSavedTime(null);

      // Redirect to the review page
      setTimeout(() => {
        router.push(`/review?id=${data.article.id}`);
      }, 1000);

    } catch (error) {
      console.error('Single generation error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setGenerationStatus(`❌ Lỗi: ${message}`);
      setIsGenerating(false); // only reset on error, keep loading state if redirecting
    }
  };

  const isReady = selectedTemplateId && title.trim().length > 0 && outline.trim().length > 0;

  const missingFields = [];
  if (!selectedTemplateId) missingFields.push('Template');
  if (!title.trim()) missingFields.push('Tiêu đề');
  if (!outline.trim()) missingFields.push('Dàn ý');

  const selectedOutline = selectedTemplateId ? getOutline(selectedTemplateId) : [];

  return (
    <main className="flex-1 h-screen overflow-y-auto bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-6 py-6 pb-20">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mb-2 uppercase tracking-wider font-medium">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-[var(--text-accent)]">Single Generator</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
            Tạo Bài Viết Riêng Lẻ
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Tạo trực tiếp một bài viết với Template cụ thể mà không cần qua bước Batch Planning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Template Selection */}
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[var(--lc-primary)]/20 text-[var(--lc-primary)] flex items-center justify-center text-xs">1</span> 
                Chọn Template (Bắt buộc)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`
                      text-left p-3 rounded-xl border transition-all duration-200
                      ${selectedTemplateId === tmpl.id 
                        ? 'bg-[var(--lc-primary)]/10 border-[var(--lc-primary)] shadow-[0_0_15px_rgba(0,102,204,0.15)]' 
                        : 'bg-[var(--bg-card-hover)] border-[var(--border-default)] hover:bg-[var(--bg-card-hover)]'}
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{tmpl.name}</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedOutline.length > 0 && (
                <div className="mt-4 p-4 rounded-xl relative border border-[var(--border-default)] bg-[var(--bg-card-hover)]">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                    Outline Cấu Trúc Khuyến Nghị
                  </p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                    {selectedOutline.map((section, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="font-semibold text-[var(--lc-primary)]">{section.label}</span>
                        {section.children && section.children.length > 0 && (
                          <ul className="mt-1 ml-4 space-y-1 text-[var(--text-secondary)] border-l border-[var(--lc-primary)]/20 pl-3">
                            {section.children.map((child, cIdx) => (
                              <li key={cIdx}>• {child.label}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Title & Outline */}
            <div className="glass-card p-6 rounded-xl space-y-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[var(--lc-primary)]/20 text-[var(--lc-primary)] flex items-center justify-center text-xs">2</span> 
                Nội dung định hướng (Bắt buộc)
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Tiêu đề bài viết
                </label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="VD: Tổng quan về Bệnh tiểu đường type 2..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Dàn ý chi tiết (Gửi cho AI)
                </label>
                <textarea 
                  className="input-field min-h-[160px] resize-y font-mono text-xs leading-relaxed"
                  placeholder="H2: Tìm hiểu chung&#10;- H3: Định nghĩa&#10;- H3: Dịch tễ học&#10;&#10;H2: Triệu chứng&#10;- H3: Các dấu hiệu nhận biết..."
                  value={outline}
                  onChange={(e) => setOutline(e.target.value)}
                  disabled={isGenerating}
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Đảm bảo format dàn ý theo cấp độ thẻ H2, H3 để AI bám sát cấu trúc nhé.
                </p>
              </div>
            </div>

            {/* Category & Tags */}
            <div className="glass-card p-6 rounded-xl space-y-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[var(--lc-primary)]/20 text-[var(--lc-primary)] flex items-center justify-center text-xs">3</span>
                Danh mục & Tags
              </h3>

              {/* Category dropdown */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Danh mục bài viết
                </label>
                <select
                  className="input-field appearance-none cursor-pointer"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={isGenerating}
                >
                  <option value="">— Để AI tự chọn —</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-[10px] text-amber-500/80">
                    Chưa có danh mục nào. Hãy thêm tại <Link href="/data" className="underline">Quản lý Dữ liệu</Link>.
                  </p>
                )}
              </div>

              {/* Tags input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Tags (Nhập tag, nhấn Enter để thêm)
                </label>
                <div className="relative">
                  <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-default)] min-h-[42px] focus-within:border-[var(--lc-primary)]/50 transition-colors">
                    {articleTags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--lc-primary)]/10 text-[var(--lc-primary)] text-xs font-medium rounded-lg">
                        🏷️ {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-400 font-bold leading-none ml-0.5" disabled={isGenerating}>×</button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => handleTagInputChange(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onFocus={() => { if (tagSuggestions.length > 0) setShowSuggestions(true); }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder={articleTags.length === 0 ? "Gõ tag rồi Enter, hoặc chọn từ danh sách gợi ý..." : "Thêm tag..."}
                      className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                      disabled={isGenerating}
                    />
                  </div>
                  {/* Autocomplete */}
                  {showSuggestions && tagSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
                      {tagSuggestions.map(s => (
                        <button
                          key={s}
                          onMouseDown={() => addTag(s)}
                          className="block w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--lc-primary)] transition-colors"
                        >
                          🏷️ {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {savedTags.length > 0 && articleTags.length === 0 && (
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Có {savedTags.length} tag đã lưu trong hệ thống — gõ để tìm kiếm gợi ý.
                  </p>
                )}
              </div>
            </div>

            {/* Source Text */}
            <div className="glass-card p-6 rounded-xl space-y-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[var(--lc-primary)]/20 text-[var(--lc-primary)] flex items-center justify-center text-xs">4</span> 
                Tài liệu nguồn (Tuỳ chọn)
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                Paste nội dung văn bản gốc vắt từ PDF, Web hoặc tài liệu y khoa để AI dựa vào đó viết bài. Điểm Medical Accuracy sẽ cao hơn nếu có tài liệu nguồn.
              </p>
              <textarea 
                className="input-field min-h-[160px] resize-y text-xs leading-relaxed"
                placeholder="Paste nội dung tài liệu nguồn vào đây..."
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                disabled={isGenerating}
              />
            </div>

          </div>

          {/* Right sidebar: Settings & Action */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-xl sticky top-6">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">
                Cấu hình & Tạo bài
              </h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Giọng điệu (Tone)</label>
                  <select 
                    className="input-field" 
                    value={config.tone} 
                    onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                    disabled={isGenerating}
                  >
                    <option value="professional">🎯 Chuyên nghiệp / Y khoa</option>
                    <option value="friendly">👋 Thân thiện / Dễ hiểu</option>
                    <option value="academic">📚 Học thuật / Có dẫn chứng</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Min Words</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={config.minWords} 
                      onChange={(e) => setConfig({ ...config, minWords: parseInt(e.target.value) || 0 })}
                      disabled={isGenerating}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Max Words</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={config.maxWords} 
                      onChange={(e) => setConfig({ ...config, maxWords: parseInt(e.target.value) || 0 })}
                      disabled={isGenerating}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Custom Instructions</label>
                  <textarea 
                    className="input-field min-h-[80px] text-xs resize-none" 
                    placeholder={getCustomPromptPlaceholder(selectedTemplateId)}
                    value={config.customInstructions}
                    onChange={(e) => setConfig({ ...config, customInstructions: e.target.value })}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              {generationStatus && (
                <div className={`p-3 rounded-lg text-xs mb-4 flex items-start gap-2 ${
                  generationStatus.includes('❌') ? 'bg-red-500/10 text-red-400' :
                  generationStatus.includes('✅') ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-blue-500/10 text-blue-400 animate-pulse'
                }`}>
                  {isGenerating && generationStatus.includes('🚀') && (
                    <span className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0 mt-0.5" />
                  )}
                  <span>{generationStatus}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={!isReady || isGenerating}
                  className={`
                    flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300
                    ${isReady && !isGenerating 
                      ? 'btn-primary shadow-[0_0_20px_rgba(0,102,204,0.4)]' 
                      : 'bg-[var(--bg-card-hover)] text-[var(--text-muted)] cursor-not-allowed'}
                  `}
                >
                  {isGenerating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[var(--border-default)]0 border-t-white rounded-full animate-spin"></span>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <span>✨</span> Generate
                    </>
                  )}
                </button>

                <button
                  onClick={handleSaveDraft}
                  disabled={isGenerating || (!selectedTemplateId && !title && !outline)}
                  className="px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 btn-secondary border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30"
                  title="Save Form Draft"
                >
                  💾 Save
                </button>
              </div>
              
              {draftSavedTime && (
                <p className="text-[10px] text-emerald-400/80 text-center mt-2 font-medium">
                  Draft saved at {draftSavedTime}
                </p>
              )}

              {!isReady && (
                <p className="text-[10px] text-amber-500/80 text-center mt-3 font-medium">
                  Vui lòng điền đủ: <span className="text-amber-400 font-bold">{missingFields.join(', ')}</span> để bắt đầu.
                </p>
              )}
            </div>
            
            {/* History Section */}
            {history.length > 0 && (
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">
                  Recent Single Jobs
                </h3>
                <div className="space-y-3">
                  {history.map((h, i) => (
                    <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-default)] hover:border-[var(--border-default)] transition-colors">
                      <Link href={`/review?id=${h.id}`} className="text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--lc-primary)] line-clamp-1">
                        {h.title}
                      </Link>
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                        <span className="bg-[var(--lc-primary)]/10 text-[var(--lc-primary)] px-1.5 py-0.5 rounded">{h.templateId}</span>
                        <span>{h.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
