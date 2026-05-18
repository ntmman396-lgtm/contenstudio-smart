'use client';

import React, { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';


// ─── Toggle Component ───────────────────────────────────────

export function Toggle({
  value,
  onChange,
  labels = ['FALSE', 'TRUE'],
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  labels?: [string, string];
}) {
  return (
    <div className="inline-flex items-center rounded-lg overflow-hidden border border-[var(--border-default)]">
      <button
        onClick={() => onChange(false)}
        className={`px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
          !value
            ? 'bg-[var(--lc-primary)] text-white'
            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
      >
        {labels[0]}
      </button>
      <button
        onClick={() => onChange(true)}
        className={`px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
          value
            ? 'bg-[var(--lc-primary)] text-white'
            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
      >
        {labels[1]}
      </button>
    </div>
  );
}

// ─── Image Upload Placeholder ───────────────────────────────

export function ImageDropZone({
  label,
  value,
  onChange,
  keyword = '',
}: {
  label: string;
  value: string | null;
  onChange: (url: string) => void;
  keyword?: string;
}) {


  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--text-primary)]">{label}</label>

      </div>
      <div
        className="rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-card-hover)] hover:border-[var(--lc-primary)]/40 hover:bg-[var(--lc-primary)]/5 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center h-[140px]"
        onClick={() => {
          const url = prompt('Nhập URL ảnh:', value || '');
          if (url) onChange(url);
        }}
      >
        {value ? (
          <div
            className="w-full h-full rounded-xl bg-cover bg-center"
            style={{ backgroundImage: `url(${value})` }}
          />
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-[var(--lc-primary)]/10 flex items-center justify-center text-lg mb-2">📷</div>
            <p className="text-[11px] text-[var(--text-muted)] text-center px-4">
              Click to add an asset or drag and drop one in this area
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Relation Selector ──────────────────────────────────────

export function RelationField({
  label,
  value,
  placeholder = 'Add relation',
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[var(--text-primary)]">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field text-sm pr-8"
        />
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

// ─── Toolbar Button ─────────────────────────────────────────

function ToolbarBtn({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
  className = '',
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        shrink-0 w-7 h-7 flex items-center justify-center rounded text-xs transition-all duration-150
        ${active
          ? 'bg-[var(--lc-primary)]/20 text-[var(--lc-primary)] font-bold'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
        }
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <div className="shrink-0 w-px h-5 bg-[var(--border-default)] mx-0.5" />;
}

// ─── Source Code Modal ──────────────────────────────────────

function SourceModal({
  html,
  onSave,
  onClose,
}: {
  html: string;
  onSave: (html: string) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState(html);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span className="text-[var(--lc-primary)]">{'</>'}</span> Source Code
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={() => { onSave(code); onClose(); }} className="btn-primary text-xs px-4 py-1.5">
              Áp dụng
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              ✕
            </button>
          </div>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            className="w-full h-full min-h-[400px] font-mono text-xs p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--lc-primary)] resize-none leading-relaxed"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─── TipTap RichText Editor ─────────────────────────────────

export function RichTextEditor({
  label,
  value,
  onChange,
  wordCount,
  children,
  minHeight = 200,
  keyword,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  wordCount?: boolean;
  children?: React.ReactNode;
  minHeight?: number;
  keyword?: string;
}) {
  const [showSource, setShowSource] = useState(false);


  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'tiptap-link' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'tiptap-image' },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Subscript,
      Superscript,
      Placeholder.configure({
        placeholder: 'Bắt đầu viết nội dung...',
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'ProseMirror',
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  // Sync incoming value changes (e.g. from source editor)
  const handleSourceSave = useCallback((html: string) => {
    if (editor) {
      editor.commands.setContent(html);
      onChange(html);
    }
  }, [editor, onChange]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = prompt('Nhập URL:', editor.getAttributes('link').href || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = prompt('Nhập URL ảnh:', 'https://');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleAutoLink = useCallback(async () => {
    if (!editor) return;
    try {
      const res = await fetch('/api/data/links');
      if (!res.ok) throw new Error('Failed to fetch links');
      const links = await res.json() as { id: string; anchor: string; url: string }[];
      if (!links || links.length === 0) {
        alert('Kho Internal Link đang trống.');
        return;
      }

      links.sort((a, b) => b.anchor.length - a.anchor.length);

      const parser = new DOMParser();
      const doc = parser.parseFromString(editor.getHTML(), 'text/html');

      const walkTextNodes = (node: Node) => {
        if (node.nodeName === 'A' || node.nodeName === 'H2' || node.nodeName === 'H3') return; // Skip inside links and headings
        if (node.nodeType === Node.TEXT_NODE) {
          let text = node.textContent || '';
          if (!text.trim()) return;

          let tempHtml = text;
          let changed = false;

          links.forEach(l => {
            // Match anchor exactly (case-insensitive) but allow surrounding whitespace/punctuation
            // We use a simple regex strategy here for demonstration
            const EscapedAnchor = l.anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(^|[^\\p{L}\\p{M}\\d_])(${EscapedAnchor})($|[^\\p{L}\\p{M}\\d_])`, 'giu');
            if (regex.test(tempHtml)) {
              tempHtml = tempHtml.replace(regex, `$1<a class="tiptap-link" target="_blank" href="${l.url}">$2</a>$3`);
              changed = true;
            }
          });

          if (changed) {
            const span = document.createElement('span');
            span.innerHTML = tempHtml;
            node.parentNode?.replaceChild(span, node);
          }
        } else {
          Array.from(node.childNodes).forEach(walkTextNodes);
        }
      };

      Array.from(doc.body.childNodes).forEach(walkTextNodes);

      let newHtml = doc.body.innerHTML;
      // unwrap the temporary replacement spans
      newHtml = newHtml.replace(/<span>(.*?)<\/span>/g, '$1');

      editor.commands.setContent(newHtml);
      onChange(newHtml);
      alert('Đã chạy tính năng chèn Internal Link thành công!');
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi tự động gắn keyword link.');
    }
  }, [editor, onChange]);

  if (!editor) return null;

  const plainText = value.replace(/<[^>]+>/g, '');
  const words = plainText.split(/\s+/).filter(Boolean).length;
  const chars = plainText.length;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[var(--text-primary)]">{label}</label>

      {/* Toolbar Row 1 */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-t-xl bg-[var(--bg-card-hover)] border border-[var(--border-default)] border-b-0 flex-wrap">
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          ↩
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          ↪
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setShowSource(true)} title="Source Code">
          {'</>'}
        </ToolbarBtn>

        <ToolbarSep />

        <ToolbarBtn onClick={addLink} active={editor.isActive('link')} title="Chèn link">
          🔗
        </ToolbarBtn>
        <ToolbarBtn onClick={handleAutoLink} title="Auto-link từ điển Anchor Text">
          ✨🔗
        </ToolbarBtn>
        <ToolbarBtn onClick={addImage} title="Chèn ảnh bằng URL">
          📷
        </ToolbarBtn>


        <ToolbarSep />

        {/* Color */}
        <div className="relative shrink-0">
          <input
            type="color"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-7 h-7 rounded cursor-pointer opacity-0 absolute inset-0"
            title="Màu chữ"
          />
          <div className="w-7 h-7 flex items-center justify-center rounded text-xs text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] cursor-pointer">
            <span className="font-bold" style={{ color: editor.getAttributes('textStyle').color || 'var(--text-muted)' }}>A</span>
            <span className="text-[8px]">▾</span>
          </div>
        </div>

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
          active={editor.isActive('highlight')}
          title="Highlight"
        >
          <span className="px-0.5 rounded" style={{ backgroundColor: '#fef08a', color: '#000' }}>A</span>
        </ToolbarBtn>

        <ToolbarSep />

        <ToolbarBtn onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Xóa định dạng">
          ⊘
        </ToolbarBtn>

        {children && (
          <>
            <ToolbarSep />
            {children}
          </>
        )}
      </div>

      {/* Toolbar Row 2 */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-[var(--bg-card-hover)] border-x border-[var(--border-default)] flex-wrap" style={{ marginTop: 0 }}>
        
        {/* Table tools */}
        <ToolbarBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Chèn bảng 3x3">
          📊
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.isActive('table')} title="Xóa bảng">
          🗑️
        </ToolbarBtn>
        
        <ToolbarSep />

        {/* Heading selector */}
        <select
          className="shrink-0 bg-transparent text-[11px] text-[var(--text-secondary)] border border-[var(--border-default)] rounded px-1.5 py-0.5 outline-none cursor-pointer mr-1"
          value={
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' :
            editor.isActive('heading', { level: 4 }) ? 'h4' : 'p'
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'p') editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: parseInt(v.replace('h', '')) as 2 | 3 | 4 }).run();
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        <ToolbarSep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <span className="underline">U</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <span className="line-through">S</span>
        </ToolbarBtn>

        <ToolbarSep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
          x<sup className="text-[8px]">2</sup>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
          x<sub className="text-[8px]">2</sub>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          {'<>'}
        </ToolbarBtn>

        <ToolbarSep />

        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường kẻ ngang">
          —
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          ❝
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
          {'▯'}
        </ToolbarBtn>

        <ToolbarSep />

        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
          ≡
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
          ≡
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
          ≡
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
          ☰
        </ToolbarBtn>

        <ToolbarSep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          •≡
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
          1≡
        </ToolbarBtn>
      </div>

      {/* Editor content area */}
      <div className="border border-[var(--border-default)] rounded-b-xl bg-[var(--bg-surface)] overflow-hidden tiptap-editor-wrapper" style={{ marginTop: 0 }}>
        <EditorContent editor={editor} className="tiptap-editor-content" />
      </div>

      {/* Word count */}
      {wordCount && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[var(--text-muted)]">
              Words: <strong className="text-[var(--text-secondary)]">{words}</strong>
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              Characters: <strong className="text-[var(--text-secondary)]">{chars}</strong>
            </span>
          </div>
          <button
            onClick={() => setShowSource(true)}
            className="text-[10px] text-[var(--text-accent)] hover:underline font-medium"
          >
            {'</>'} Source
          </button>
        </div>
      )}

      {/* Source Code Modal */}
      {showSource && (
        <SourceModal
          html={editor.getHTML()}
          onSave={handleSourceSave}
          onClose={() => setShowSource(false)}
        />
      )}


    </div>
  );
}

// ─── FAQ Editor ─────────────────────────────────────────────

export function FAQEditor({ 
  value = [], 
  onChange,
  onAutoExtract,
}: { 
  value?: { question: string, answer: string }[], 
  onChange: (v: { question: string, answer: string }[]) => void,
  onAutoExtract?: () => void,
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const addFaq = () => onChange([...value, { question: '', answer: '' }]);
  const updateFaq = (index: number, field: 'question' | 'answer', val: string) => {
    const newVal = [...value];
    newVal[index][field] = val;
    onChange(newVal);
  };
  const removeFaq = (index: number) => {
    const newVal = value.filter((_, i) => i !== index);
    onChange(newVal);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--text-primary)]">FAQ - Câu Hỏi Thường Gặp</label>
        <div className="flex items-center gap-2">
          {onAutoExtract && (
            <button onClick={onAutoExtract} className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-bold hover:bg-blue-500/20 transition-colors">
              ✨ Tự động trích xuất
            </button>
          )}
          <button onClick={addFaq} className="text-[10px] bg-[var(--lc-primary)]/10 text-[var(--lc-primary)] px-2 py-1 rounded font-bold hover:bg-[var(--lc-primary)]/20 transition-colors">
            + Thêm Câu Hỏi
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-default)] shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 dark:text-[var(--text-primary)] mb-4">
          Câu hỏi thường gặp
        </h3>
        
        {value.length === 0 ? (
          <p className="text-xs text-center text-[var(--text-muted)] py-4">Chưa có câu hỏi nào. Nhấn Thêm Câu Hỏi hoặc Trích xuất từ nội dung.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[var(--border-default)]">
            {value.map((item, i) => (
              <div key={i} className="py-3">
                <div 
                  className="flex items-start gap-3 cursor-pointer group"
                  onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                >
                  <div className="w-5 h-5 rounded-full bg-gray-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 group-hover:bg-[var(--lc-primary)] transition-colors">
                    ?
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <input 
                        value={item.question} 
                        onChange={e => updateFaq(i, 'question', e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="font-semibold text-gray-800 dark:text-[var(--text-primary)] text-[13px] bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-700 outline-none w-full mr-2 pb-0.5 transition-colors"
                        placeholder="Nhập câu hỏi..."
                      />
                      <div className="flex items-center gap-2 shrink-0 text-gray-400">
                        <button onClick={e => { e.stopPropagation(); removeFaq(i); }} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">✕</button>
                        <svg className={`w-4 h-4 transition-transform duration-200 ${expandedIndex === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                {expandedIndex === i && (
                  <div className="mt-2 ml-8 pr-6 animate-fade-in">
                    <textarea 
                      value={item.answer} 
                      onChange={e => updateFaq(i, 'answer', e.target.value)}
                      className="w-full text-[13px] text-gray-600 dark:text-[var(--text-secondary)] bg-gray-50 dark:bg-[var(--bg-surface)] p-3 rounded-lg border border-transparent focus:border-[var(--lc-primary)]/50 outline-none resize-none transition-colors"
                      rows={3}
                      placeholder="Nhập câu trả lời..."
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
