'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Papa from 'papaparse';

export interface KeywordInputRow {
  id: string;
  keyword: string;
  outline: string;
  referenceLink: string;
  tags: string[];
}

interface KeywordInputStepProps {
  rows: KeywordInputRow[];
  onRowsChange: (rows: KeywordInputRow[]) => void;
}

export default function KeywordInputStep({ rows, onRowsChange }: KeywordInputStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedTags, setSavedTags] = useState<string[]>([]);
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [tagSuggestions, setTagSuggestions] = useState<Record<string, string[]>>({});
  const [focusedTagRow, setFocusedTagRow] = useState<string | null>(null);

  // Load saved tags from API
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/data/tags');
        if (res.ok) {
          const tags = await res.json();
          setSavedTags(tags);
        }
      } catch (e) {
        console.error('Lỗi load tags', e);
      }
    };
    fetchTags();
  }, []);

  const addRow = () => {
    const newRow: KeywordInputRow = {
      id: `kw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      keyword: '',
      outline: '',
      referenceLink: '',
      tags: [],
    };
    onRowsChange([...rows, newRow]);
  };

  const updateRow = (id: string, field: keyof KeywordInputRow, value: string | string[]) => {
    onRowsChange(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const removeRow = (id: string) => {
    onRowsChange(rows.filter(row => row.id !== id));
  };

  // Tag management per row
  const handleTagInputChange = (rowId: string, value: string) => {
    setTagInputs(prev => ({ ...prev, [rowId]: value }));
    
    // Filter suggestions
    if (value.trim()) {
      const filtered = savedTags.filter(t => 
        t.toLowerCase().includes(value.toLowerCase()) &&
        !rows.find(r => r.id === rowId)?.tags.includes(t)
      ).slice(0, 8);
      setTagSuggestions(prev => ({ ...prev, [rowId]: filtered }));
    } else {
      setTagSuggestions(prev => ({ ...prev, [rowId]: [] }));
    }
  };

  const addTagToRow = (rowId: string, tag: string) => {
    const row = rows.find(r => r.id === rowId);
    if (row && !row.tags.includes(tag.trim()) && tag.trim()) {
      updateRow(rowId, 'tags', [...row.tags, tag.trim()]);
    }
    setTagInputs(prev => ({ ...prev, [rowId]: '' }));
    setTagSuggestions(prev => ({ ...prev, [rowId]: [] }));
  };

  const removeTagFromRow = (rowId: string, tag: string) => {
    const row = rows.find(r => r.id === rowId);
    if (row) {
      updateRow(rowId, 'tags', row.tags.filter(t => t !== tag));
    }
  };

  const handleTagKeyDown = (rowId: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = tagInputs[rowId]?.trim();
      if (value) {
        addTagToRow(rowId, value);
      }
    }
  };

  // CSV Parsing
  const processCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows: KeywordInputRow[] = [];
        
        results.data.forEach((dataRow: any) => {
          // Normalize header names for matching
          const getField = (possibleNames: string[]) => {
            const matchedKey = Object.keys(dataRow).find(key => 
              possibleNames.some(name => key.toLowerCase() === name.toLowerCase())
            );
            return matchedKey ? dataRow[matchedKey] : '';
          };

          const keyword = getField(['Keyword', 'Từ khóa', 'Tu khoa', 'Title']);
          const outline = getField(['Outline', 'Dàn ý', 'Dan y']);
          const referenceLink = getField(['Link', 'URL', 'Tham khảo', 'ReferenceLink']);
          const tagsRaw = getField(['Tags', 'Tag', 'tags', 'tag']);

          // Parse tags: comma or pipe separated
          const parsedTags = tagsRaw 
            ? tagsRaw.split(/[,|]/).map((t: string) => t.trim()).filter(Boolean) 
            : [];

          if (keyword) {
            parsedRows.push({
              id: `kw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              keyword,
              outline,
              referenceLink,
              tags: parsedTags,
            });
          }
        });

        if (parsedRows.length > 0) {
          onRowsChange([...rows, ...parsedRows]);
        } else {
          alert("Không tìm thấy dữ liệu Keyword hợp lệ trong file CSV. Xin đảm bảo file CSV có chứa cột 'Keyword'.");
        }
      },
      error: (error) => {
        alert("Lỗi khi đọc file CSV: " + error.message);
      }
    });
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        processCSV(file);
      } else {
        alert("Vui lòng tải lên file định dạng .csv");
      }
    }
  }, [rows, onRowsChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.csv')) {
        processCSV(file);
      } else {
        alert("Vui lòng tải lên file định dạng .csv");
      }
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            Nhập danh sách Keyword
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Tạo bài viết hàng loạt dựa theo từng Keyword cụ thể (hỗ trợ nhập tay hoặc tải lên CSV).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-xs flex items-center gap-2"
          >
            📥 Import CSV
          </button>
          <button 
            onClick={addRow}
            className="btn-primary flex items-center gap-2"
          >
            + Thêm dòng
          </button>
        </div>
      </div>

      {/* Drop Zone - Visible empty state or drag active */}
      {(rows.length === 0 || dragActive) && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-10 text-center
            transition-all duration-300 cursor-pointer group mb-6
            ${dragActive
              ? 'border-[var(--lc-primary)] bg-[var(--lc-primary)]/5 scale-[1.01]'
              : 'border-[var(--border-default)] hover:border-[var(--lc-primary)]/50 hover:bg-[var(--bg-card-hover)]'
            }
          `}
        >
          <div className="space-y-3 pointer-events-none">
            <div className={`
              w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl
              transition-all duration-300
              ${dragActive ? 'scale-110 animate-float' : 'group-hover:scale-105'}
            `}
              style={{ background: 'linear-gradient(135deg, rgba(0,102,204,0.15), rgba(0,204,136,0.15))' }}
            >
              📊
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Kéo thả file .CSV vào đây để tải lên
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[400px] mx-auto leading-relaxed">
                Yêu cầu file CSV có hàng đầu tiên chứa đúng tên các cột: <br/> <strong>Keyword</strong>, <strong>Outline</strong>, <strong>Link</strong>, <strong>Tags</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rows Display */}
      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Danh sách quy hoạch ({rows.length} Keywords)
            </label>
            <button onClick={() => onRowsChange([])} className="text-[10px] text-red-500 hover:underline">
              Xoá tất cả
            </button>
          </div>
          
          <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {rows.map((row, index) => (
              <div key={row.id} className="glass-card p-4 rounded-xl border border-[var(--border-default)] hover:border-[var(--lc-primary)]/30 transition-colors flex gap-4">
                <div className="w-6 flex shrink-0 items-center justify-center font-bold text-xs text-[var(--text-muted)] mt-2">
                  #{index + 1}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Keyword <span className="text-red-400">*</span></label>
                      <input 
                        type="text" 
                        value={row.keyword} 
                        onChange={(e) => updateRow(row.id, 'keyword', e.target.value)} 
                        className="input-field text-sm w-full"
                        placeholder="Nhập từ khoá..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Link Tham Khảo</label>
                      <input 
                        type="text" 
                        value={row.referenceLink} 
                        onChange={(e) => updateRow(row.id, 'referenceLink', e.target.value)} 
                        className="input-field text-sm w-full text-[var(--text-muted)] placeholder-[var(--border-strong)]"
                        placeholder="VD: https://example.com"
                      />
                    </div>
                  </div>

                  {/* Tags input */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Tags</label>
                    <div className="relative">
                      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-default)] min-h-[36px] focus-within:border-[var(--lc-primary)]/50 transition-colors">
                        {row.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--lc-primary)]/10 text-[var(--lc-primary)] text-[11px] font-medium rounded-md">
                            {tag}
                            <button onClick={() => removeTagFromRow(row.id, tag)} className="hover:text-red-400 font-bold leading-none">×</button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={tagInputs[row.id] || ''}
                          onChange={(e) => handleTagInputChange(row.id, e.target.value)}
                          onKeyDown={(e) => handleTagKeyDown(row.id, e)}
                          onFocus={() => setFocusedTagRow(row.id)}
                          onBlur={() => setTimeout(() => setFocusedTagRow(null), 200)}
                          placeholder={row.tags.length === 0 ? "Nhập tag, Enter để thêm..." : ""}
                          className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                        />
                      </div>
                      {/* Autocomplete suggestions */}
                      {focusedTagRow === row.id && tagSuggestions[row.id]?.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl shadow-lg overflow-hidden">
                          {tagSuggestions[row.id].map(s => (
                            <button
                              key={s}
                              onMouseDown={() => addTagToRow(row.id, s)}
                              className="block w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--lc-primary)] transition-colors"
                            >
                              🏷️ {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center justify-between">
                      <span>Outline / Dàn Ý</span>
                      <span className="text-[9px] font-normal italic opacity-70">Nếu để trống, AI sẽ tự dàn ý</span>
                    </label>
                    <textarea 
                      value={row.outline} 
                      onChange={(e) => updateRow(row.id, 'outline', e.target.value)} 
                      className="input-field text-xs w-full min-h-[60px] resize-y custom-scrollbar text-[var(--text-secondary)]"
                      placeholder="- H2: Sâm Angela là gì?&#10;- H2: Tác dụng...&#10;- H2: Cách dùng..."
                    />
                  </div>
                </div>

                <div className="shrink-0 pt-6">
                  <button 
                    onClick={() => removeRow(row.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
