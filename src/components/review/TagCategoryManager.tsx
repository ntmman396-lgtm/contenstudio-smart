'use client';

import React, { useState, useEffect, useRef } from 'react';

// ─── Default Categories ─────────────────────────────────────

const DEFAULT_CATEGORIES = [
  'Phòng bệnh & Sống khỏe',
  'Tin tức sức khỏe',
  'Khỏe đẹp',
  'Bệnh lý',
  'Dược liệu',
  'Thuốc',
  'TPCN',
  'Vắc xin',
  'Dược chất',
  'Sức khỏe tổng hợp',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Phòng bệnh & Sống khỏe': '#5B5BD6',
  'Tin tức sức khỏe': '#0D9488',
  'Khỏe đẹp': '#E879A8',
  'Bệnh lý': '#D97706',
  'Dược liệu': '#059669',
  'Thuốc': '#2563EB',
  'TPCN': '#7C3AED',
  'Vắc xin': '#DC2626',
  'Dược chất': '#0891B2',
  'Sức khỏe tổng hợp': '#6366F1',
};

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || '#6366F1';
}

// ─── Api Helpers ───────────────────────────────────────────

export async function saveApiCategories(name: string) {
  try {
    await fetch('/api/data/categories', { method: 'POST', body: JSON.stringify({ name }) });
  } catch(e) {}
}

export async function deleteApiCategory(name: string) {
  try {
    await fetch(`/api/data/categories?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
  } catch(e) {}
}

export async function saveApiTags(name: string) {
  try {
    await fetch('/api/data/tags', { method: 'POST', body: JSON.stringify({ name }) });
  } catch(e) {}
}

// ─── Auto-define logic ──────────────────────────────────────

export function autoSuggestTags(title: string, content: string, availableTags: string[]): string[] {
  const text = `${title} ${content}`.toLowerCase()
    .replace(/<[^>]+>/g, ' ')  // strip HTML
    .replace(/[.,/#!$%^&*;:{}=\-_`~()""'']/g, ' ');

  const suggestions: { tag: string; score: number }[] = [];

  for (const tag of availableTags) {
    if (!tag.trim()) continue;
    
    // Strict match strategy: regex lookup of the exact tag (case-insensitive) in the text 
    // boundary (\b) doesn't perfectly work with utf8 vietnamese, so we just do a global lookup
    // Escaping tag regex chars:
    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escapedTag}($|\\s)`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      suggestions.push({ tag, score: matches.length });
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(s => s.tag);
}

export function autoSuggestCategories(title: string, content: string, availableCats: string[]): string[] {
  const text = `${title} ${content}`.toLowerCase()
    .replace(/<[^>]+>/g, ' ');

  const suggestions: { cat: string; score: number }[] = [];

  for (const cat of availableCats) {
    if (!cat.trim()) continue;
    
    // We check if the exact category phrase appears in the text
    const escapedCat = cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escapedCat}($|\\s)`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      suggestions.push({ cat, score: matches.length });
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.cat);
}

// ═══════════════════════════════════════════════════════════
// Category Manager Component
// ═══════════════════════════════════════════════════════════

interface CategoryManagerProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  title?: string;
  contentForAutoDefine?: string;
}

export function CategoryManager({
  selectedCategories,
  onChange,
  title = '',
  contentForAutoDefine = '',
}: CategoryManagerProps) {
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showManage, setShowManage] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/data/categories')
      .then(res => res.json())
      .then(data => {
        setAvailableCategories(data && data.length > 0 ? data : DEFAULT_CATEGORIES);
      })
      .catch(() => setAvailableCategories(DEFAULT_CATEGORIES));
  }, []);

  // Auto-suggest categories based on content
  useEffect(() => {
    if (title || contentForAutoDefine) {
      const suggestions = autoSuggestCategories(title, contentForAutoDefine, availableCategories);
      setSuggestedCategories(suggestions.filter(s => !selectedCategories.includes(s)));
    }
  }, [title, contentForAutoDefine, selectedCategories, availableCategories]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addCategory = (cat: string) => {
    if (!selectedCategories.includes(cat)) {
      onChange([...selectedCategories, cat]);
    }
    setDropdownOpen(false);
  };

  const removeCategory = (cat: string) => {
    onChange(selectedCategories.filter(c => c !== cat));
  };

  const addNewCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (trimmed && !availableCategories.includes(trimmed)) {
      const updated = [...availableCategories, trimmed];
      setAvailableCategories(updated);
      saveApiCategories(trimmed);
      setNewCategoryInput('');
    }
  };

  const deleteAvailableCategory = (cat: string) => {
    const updated = availableCategories.filter(c => c !== cat);
    setAvailableCategories(updated);
    deleteApiCategory(cat);
    // Also remove from selected if present
    if (selectedCategories.includes(cat)) {
      onChange(selectedCategories.filter(c => c !== cat));
    }
  };

  const unselectedCategories = availableCategories.filter(c => !selectedCategories.includes(c));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--text-primary)]">
          Danh Mục Bài Viết<span className="text-red-400 ml-0.5">*</span>
        </label>
        <button
          onClick={() => setShowManage(!showManage)}
          className="text-[10px] text-[var(--text-accent)] hover:underline font-medium"
        >
          {showManage ? 'Đóng' : '⚙️ Quản lý'}
        </button>
      </div>

      {/* Selected categories as chips */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
        {selectedCategories.map((cat, idx) => (
          <span
            key={cat}
            className="category-chip inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold text-white transition-all duration-200"
            style={{
              backgroundColor: getCategoryColor(cat),
              opacity: idx === 0 ? 1 : 0.85,
              border: idx === 0 ? '2px solid rgba(255,255,255,0.3)' : 'none',
            }}
          >
            {idx === 0 && <span className="text-[9px] opacity-80">●</span>}
            {cat}
            <button
              onClick={() => removeCategory(cat)}
              className="ml-0.5 text-white/70 hover:text-white font-bold text-sm leading-none"
            >
              ×
            </button>
          </span>
        ))}

        {/* Add dropdown trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors border border-dashed border-[var(--border-default)]"
          >
            + Thêm danh mục
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 z-20 w-56 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl shadow-lg overflow-hidden animate-fade-in">
              <div className="max-h-[200px] overflow-y-auto">
                {unselectedCategories.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-[var(--text-muted)]">Đã chọn hết danh mục</p>
                ) : (
                  unselectedCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => addCategory(cat)}
                      className="w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getCategoryColor(cat) }}
                      />
                      {cat}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-[var(--text-muted)]">
        Bài viết tối đa 1 danh mục chính {selectedCategories.length > 0 && (
          <span>(Danh mục chính: <strong className="text-[var(--text-accent)]">{selectedCategories[0]}</strong>)</span>
        )}
      </p>

      {/* Auto-suggest */}
      {suggestedCategories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-[var(--text-muted)] font-medium">💡 Gợi ý:</span>
          {suggestedCategories.map(cat => (
            <button
              key={cat}
              onClick={() => addCategory(cat)}
              className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-[var(--text-accent)]/40 text-[var(--text-accent)] hover:bg-[var(--text-accent)]/10 transition-colors"
            >
              + {cat}
            </button>
          ))}
        </div>
      )}

      {/* Manage categories panel */}
      {showManage && (
        <div className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card-hover)] space-y-3 animate-fade-in">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Quản lý danh sách danh mục</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addNewCategory(); }}
              placeholder="Tên danh mục mới..."
              className="input-field text-xs flex-1"
            />
            <button onClick={addNewCategory} className="btn-primary text-xs px-3 py-1.5">
              Thêm
            </button>
          </div>
          <div className="space-y-1 max-h-[160px] overflow-y-auto">
            {availableCategories.map(cat => (
              <div key={cat} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors group">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(cat) }} />
                  <span className="text-xs text-[var(--text-secondary)]">{cat}</span>
                </div>
                {!DEFAULT_CATEGORIES.includes(cat) && (
                  <button
                    onClick={() => deleteAvailableCategory(cat)}
                    className="text-[var(--text-muted)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// Tag Manager Component
// ═══════════════════════════════════════════════════════════

interface TagManagerProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  title?: string;
  contentForAutoDefine?: string;
}

export function TagManager({
  tags,
  onChange,
  title = '',
  contentForAutoDefine = '',
}: TagManagerProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [savedTags, setSavedTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/data/tags')
      .then(res => res.json())
      .then(data => setSavedTags(data || []))
      .catch(() => setSavedTags([]));
  }, []);

  // Auto-suggest tags based on content
  useEffect(() => {
    if (title || contentForAutoDefine) {
      const suggestions = autoSuggestTags(title, contentForAutoDefine, savedTags);
      setSuggestedTags(suggestions.filter(s => !tags.includes(s)));
    }
  }, [title, contentForAutoDefine, tags, savedTags]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      // Also save to library
      if (!savedTags.includes(trimmed)) {
        const updated = [...savedTags, trimmed];
        setSavedTags(updated);
        saveApiTags(trimmed);
      }
    }
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  // Filter saved tags by input
  const filteredSavedTags = savedTags.filter(
    t => !tags.includes(t) && t.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
        Tags <span className="text-[10px] font-normal text-[var(--text-muted)]">({tags.length})</span>
      </label>

      {/* Add tag input with dropdown */}
      <div className="relative">
        <div className="relative">
          <select className="input-field text-xs appearance-none cursor-pointer pr-8 text-[var(--text-muted)]"
            value=""
            onChange={(e) => { if (e.target.value) addTag(e.target.value); }}
          >
            <option value="">Add relation</option>
            {filteredSavedTags.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>

      {/* Tag list */}
      <div className="space-y-1.5">
        {tags.map((tag) => (
          <div
            key={tag}
            className="tag-item flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] transition-colors group"
          >
            <span className="text-[var(--text-muted)] cursor-grab text-xs select-none">⋮⋮</span>
            <span className="flex-1 text-sm text-[var(--text-secondary)]">{tag}</span>
            <button
              onClick={() => removeTag(tag)}
              className="text-[var(--text-muted)] hover:text-red-400 font-bold text-sm transition-colors opacity-60 group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Quick add input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tag mới rồi Enter..."
          className="input-field text-xs flex-1"
        />
      </div>

      {/* Auto-suggest */}
      {suggestedTags.length > 0 && (
        <div className="flex items-start gap-2 flex-wrap pt-1">
          <span className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">💡 Gợi ý:</span>
          {suggestedTags.map(tag => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
