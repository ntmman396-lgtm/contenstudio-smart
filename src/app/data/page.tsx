'use client';

import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { useSite } from '@/contexts/SiteContext';

// Core default data (fallback)
const DEFAULT_CATEGORIES = [
  'Phòng bệnh & Sống khỏe', 'Tin tức sức khỏe', 'Khỏe đẹp', 
  'Bệnh lý', 'Dược liệu', 'Thuốc', 'TPCN', 'Vắc xin', 
  'Dược chất', 'Sức khỏe tổng hợp'
];

interface InternalLink {
  id: string;
  anchor: string;
  url: string;
}

export default function DataManagerPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'tags' | 'links'>('categories');
  const { currentSite } = useSite();
  
  // State
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [links, setLinks] = useState<InternalLink[]>([]);

  // Inputs
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newLinkAnchor, setNewLinkAnchor] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Import refs
  const tagFileRef = useRef<HTMLInputElement>(null);
  const linkFileRef = useRef<HTMLInputElement>(null);

  // Import status
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      const [catsRes, tagsRes, linksRes] = await Promise.all([
        fetch(`/api/data/categories?siteId=${currentSite}`),
        fetch(`/api/data/tags?siteId=${currentSite}`),
        fetch(`/api/data/links?siteId=${currentSite}`)
      ]);
      
      let cats = await catsRes.json();
      if (!cats || cats.length === 0) {
         await fetch(`/api/data/categories?siteId=${currentSite}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(DEFAULT_CATEGORIES) });
         cats = DEFAULT_CATEGORIES;
      }
      setCategories(cats);

      let tagsList = await tagsRes.json();
      setTags(tagsList || []);

      let linksList = await linksRes.json();
      setLinks(linksList || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Load from DB — re-fetch when site changes
  useEffect(() => {
    fetchAllData();
  }, [currentSite]);

  // Add Handlers
  const handleAddCategory = async () => {
    const val = newCategory.trim();
    if (val && !categories.includes(val)) {
      setCategories([...categories, val]);
      setNewCategory('');
      await fetch(`/api/data/categories?siteId=${currentSite}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: val }) });
    }
  };

  const handleAddTag = async () => {
    const val = newTag.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val].sort());
      setNewTag('');
      await fetch(`/api/data/tags?siteId=${currentSite}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: val }) });
    }
  };

  const handleAddLink = async () => {
    const anchor = newLinkAnchor.trim();
    const url = newLinkUrl.trim();
    if (anchor && url) {
      try {
        const res = await fetch(`/api/data/links?siteId=${currentSite}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ anchor, url }) });
        const newLink = await res.json();
        setLinks([...links, newLink]);
        setNewLinkAnchor('');
        setNewLinkUrl('');
      } catch(e) {}
    }
  };

  // Remove Handlers
  const handleRemoveCategory = async (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
    await fetch(`/api/data/categories?name=${encodeURIComponent(cat)}&siteId=${currentSite}`, { method: 'DELETE' });
  };

  const handleRemoveTag = async (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    await fetch(`/api/data/tags?name=${encodeURIComponent(tag)}&siteId=${currentSite}`, { method: 'DELETE' });
  };

  const handleRemoveLink = async (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
    await fetch(`/api/data/links?id=${id}`, { method: 'DELETE' });
  };

  // ─── CSV Import: Tags ────────────────────────────────────
  const handleImportTagsCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const newTags: string[] = [];

        results.data.forEach((row: any) => {
          // Find the tag column (case-insensitive)
          const getField = (possibleNames: string[]) => {
            const matchedKey = Object.keys(row).find(key =>
              possibleNames.some(name => key.toLowerCase().trim() === name.toLowerCase())
            );
            return matchedKey ? row[matchedKey] : '';
          };

          const tagValue = getField(['Tag', 'Tags', 'tag', 'tags', 'Từ khóa', 'Keyword']);
          if (tagValue) {
            // Tags separated by comma
            const parts = tagValue.split(',').map((t: string) => t.trim()).filter(Boolean);
            newTags.push(...parts);
          }
        });

        if (newTags.length > 0) {
          const distinctNewTags = Array.from(new Set(newTags));
          setImportStatus(`⏳ Đang import ${distinctNewTags.length} tag vào Database...`);
          try {
             await fetch(`/api/data/tags?siteId=${currentSite}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(distinctNewTags) });
             await fetchAllData();
             setImportStatus(`✅ Hoàn tất import tags!`);
          } catch(e) {
             setImportStatus(`❌ Lỗi ghi tags vào DB.`);
          }
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('⚠️ Không tìm thấy dữ liệu Tag hợp lệ. Đảm bảo file CSV có cột "Tag".');
          setTimeout(() => setImportStatus(null), 5000);
        }
      },
      error: (error) => {
        setImportStatus(`❌ Lỗi đọc CSV: ${error.message}`);
        setTimeout(() => setImportStatus(null), 5000);
      }
    });
  };

  // ─── CSV Import: Internal Links ──────────────────────────
  const handleImportLinksCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const newLinks: any[] = [];

        results.data.forEach((row: any) => {
          const getField = (possibleNames: string[]) => {
            const matchedKey = Object.keys(row).find(key =>
              possibleNames.some(name => key.toLowerCase().trim() === name.toLowerCase())
            );
            return matchedKey ? row[matchedKey] : '';
          };

          const anchor = getField(['Anchor', 'Anchor Text', 'anchor', 'AnchorText', 'Từ khóa']);
          const url = getField(['URL', 'Link', 'url', 'link', 'Internal Link']);

          if (anchor && url) {
            newLinks.push({ anchor: anchor.trim(), url: url.trim() });
          }
        });

        if (newLinks.length > 0) {
          setImportStatus(`⏳ Đang import ${newLinks.length} internal links vào Database...`);
          try {
             await fetch(`/api/data/links?siteId=${currentSite}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newLinks) });
             await fetchAllData();
             setImportStatus(`✅ Hoàn tất import links!`);
          } catch(e) {
             setImportStatus(`❌ Lỗi ghi links vào DB.`);
          }
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('⚠️ Không tìm thấy dữ liệu hợp lệ. Đảm bảo CSV có cột "Anchor" + "URL".');
          setTimeout(() => setImportStatus(null), 5000);
        }
      },
      error: (error) => {
        setImportStatus(`❌ Lỗi đọc CSV: ${error.message}`);
        setTimeout(() => setImportStatus(null), 5000);
      }
    });
  };

  const handleTagFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleImportTagsCSV(e.target.files[0]);
    }
    if (tagFileRef.current) tagFileRef.current.value = '';
  };

  const handleLinkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleImportLinksCSV(e.target.files[0]);
    }
    if (linkFileRef.current) linkFileRef.current.value = '';
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto">
      <div className="max-w-[1000px] mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🗄️</span>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Cơ Sở Dữ Liệu</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Quản lý dữ liệu cho <span className="font-semibold text-[var(--text-accent)]">{currentSite === 'tiem-chung' ? '💉 Tiêm chủng' : '🏥 Nhà thuốc'}</span> — Chuyển site ở sidebar để xem dữ liệu site khác.
          </p>
        </div>

        {/* Import status banner */}
        {importStatus && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium animate-fade-in ${
            importStatus.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            importStatus.startsWith('⚠️') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {importStatus}
          </div>
        )}

        {/* Hidden file inputs */}
        <input type="file" ref={tagFileRef} onChange={handleTagFileChange} accept=".csv" className="hidden" />
        <input type="file" ref={linkFileRef} onChange={handleLinkFileChange} accept=".csv" className="hidden" />

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[var(--border-default)]">
          {[
            { id: 'categories', label: 'Danh Mục', icon: '📂' },
            { id: 'tags', label: 'Tags', icon: '🏷️' },
            { id: 'links', label: 'Internal Links', icon: '🔗' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 flex items-center gap-2 border-b-2 
                ${activeTab === tab.id 
                  ? 'border-[var(--lc-primary)] text-[var(--lc-primary)]' 
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                }`}
            >
              <span>{tab.icon}</span> {tab.label}
              {tab.id === 'tags' && tags.length > 0 && (
                <span className="text-[10px] bg-[var(--lc-primary)]/15 text-[var(--lc-primary)] px-1.5 py-0.5 rounded-full font-bold">{tags.length}</span>
              )}
              {tab.id === 'links' && links.length > 0 && (
                <span className="text-[10px] bg-[var(--lc-primary)]/15 text-[var(--lc-primary)] px-1.5 py-0.5 rounded-full font-bold">{links.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content Wrapper */}
        <div className="glass-card p-6 rounded-2xl animate-fade-in">
          
          {/* TAB: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">Danh sách Danh Mục ({categories.length})</h2>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">Dùng để phân loại bài viêt (Ví dụ: Bệnh học, Thuốc,...)</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 max-w-md">
                <input 
                  type="text" 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => { if(e.key==='Enter') handleAddCategory() }}
                  placeholder="Nhập tên danh mục mới..."
                  className="input-field text-sm"
                />
                <button onClick={handleAddCategory} className="btn-primary px-4 py-2 shrink-0">Thêm</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center justify-between px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl group hover:border-[var(--border-hover)] transition-colors">
                    <span className="text-sm text-[var(--text-secondary)] font-medium">{cat}</span>
                    <button 
                      onClick={() => handleRemoveCategory(cat)}
                      className="w-6 h-6 rounded-md hover:bg-red-500/10 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xoá"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: TAGS */}
          {activeTab === 'tags' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">Kho Tags Tự Định Nghĩa ({tags.length})</h2>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">Các Tags này sẽ được hiển thị khi gõ trên màn hình giao diện bài viết GSK.</p>
                </div>
                <button 
                  onClick={() => tagFileRef.current?.click()}
                  className="btn-secondary text-xs flex items-center gap-2 px-3 py-2"
                >
                  📥 Import CSV
                </button>
              </div>
              
              <div className="flex items-center gap-2 max-w-md">
                <input 
                  type="text" 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if(e.key==='Enter') handleAddTag() }}
                  placeholder="Nhập tên tag mới..."
                  className="input-field text-sm"
                />
                <button onClick={handleAddTag} className="btn-primary px-4 py-2 shrink-0">Thêm</button>
              </div>

              {/* Import hint */}
              <div className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-card-hover)] rounded-lg p-3 flex items-start gap-2">
                <span>💡</span>
                <span>Import CSV: file cần có cột <strong>"Tag"</strong>. Nhiều tag trong 1 ô ngăn cách bởi dấu phẩy (,). Ví dụ: <code>sốt xuất huyết, bạch hầu, vắc xin</code></span>
              </div>

              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-sm group hover:border-[var(--lc-primary)]/50 transition-colors">
                    <span className="text-[var(--text-secondary)]">{tag}</span>
                    <button 
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-[var(--text-muted)] hover:text-red-400 opacity-60 group-hover:opacity-100 font-bold leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {tags.length === 0 && <p className="text-xs text-[var(--text-muted)] italic py-2">Chưa có tag nào được tạo.</p>}
              </div>
            </div>
          )}

          {/* TAB: INTERNAL LINKS */}
          {activeTab === 'links' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">Từ điển Anchor Text ↔ Internal Link ({links.length})</h2>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">Hệ thống sẽ dựa vào Anchor Text để **quét và tự động bôi đen** gắn link vào bài viết.</p>
                </div>
                <button 
                  onClick={() => linkFileRef.current?.click()}
                  className="btn-secondary text-xs flex items-center gap-2 px-3 py-2"
                >
                  📥 Import CSV
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 max-w-3xl">
                <div className="md:col-span-4">
                  <input 
                    type="text" 
                    value={newLinkAnchor}
                    onChange={(e) => setNewLinkAnchor(e.target.value)}
                    placeholder="Anchor Text (vd: bệnh bạch hầu)"
                    className="input-field text-sm"
                  />
                </div>
                <div className="md:col-span-6">
                  <input 
                    type="url" 
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    onKeyDown={(e) => { if(e.key==='Enter') handleAddLink() }}
                    placeholder="URL (vd: https://nhathuoclongchau.com/...)"
                    className="input-field text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <button onClick={handleAddLink} className="w-full btn-primary px-4 py-2 text-sm">Thêm Map</button>
                </div>
              </div>

              {/* Import hint */}
              <div className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-card-hover)] rounded-lg p-3 flex items-start gap-2">
                <span>💡</span>
                <span>Import CSV: file cần có 2 cột <strong>"Anchor"</strong> và <strong>"URL"</strong>.</span>
              </div>

              <div className="border border-[var(--border-default)] rounded-xl overflow-hidden mt-6 bg-[var(--bg-surface)]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-card-hover)] border-b border-[var(--border-default)]">
                      <th className="px-4 py-3 text-xs font-semibold text-[var(--text-primary)] w-[250px]">Anchor Text</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[var(--text-primary)]">URL Đích</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[var(--text-primary)] text-right w-16">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-xs text-[var(--text-muted)] italic">
                          Chưa có bộ từ khoá internal link nào được tạo.
                        </td>
                      </tr>
                    ) : (
                      links.map((link) => (
                        <tr key={link.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-card-hover)] transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-[var(--lc-primary)]">{link.anchor}</td>
                          <td className="px-4 py-3 text-sm text-[var(--text-secondary)] break-all truncate max-w-[400px]">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{link.url}</a>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => handleRemoveLink(link.id)}
                              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-500/10 rounded-md transition-colors"
                            >
                              Xoá
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
