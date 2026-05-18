'use client';

import React, { useState, useEffect } from 'react';
import { KBSource, SourceType } from '@/lib/kb/mock-kb-data';
import { UploadCloud, Link as LinkIcon, FileText, CheckCircle2, RotateCcw } from 'lucide-react';

interface UploadSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (source: KBSource | KBSource[]) => void;
}

const STAGES = [
  { id: 'extract', label: '1. Trích xuất Text & Metadata' },
  { id: 'clean', label: '2. Chuẩn hoá & Làm sạch' },
  { id: 'chunk', label: '3. Phân mảng ngữ nghĩa (Semantic Chunking)' },
  { id: 'embed', label: '4. Vector Embedding' },
  { id: 'done', label: '5. Hoàn tất Indexing' },
];

export default function UploadSourceModal({ isOpen, onClose, onComplete }: UploadSourceModalProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'url'>('pdf');
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // URL state
  const [urlInput, setUrlInput] = useState('');
  
  // Pipeline state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // Final Review state
  const [formData, setFormData] = useState({
    title: '',
    publisher: '',
    language: 'vi',
    publish_year: new Date().getFullYear(),
    topic_tags: '',
    template_tags: 'BENH_LY',
    scope: 'specific' as 'general' | 'specific'
  });

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setUrlInput('');
      setIsProcessing(false);
      setProgress(0);
      setCurrentStageIdx(0);
      setIsFinished(false);
      setFormData({
        title: '',
        publisher: '',
        language: 'vi',
        publish_year: new Date().getFullYear(),
        topic_tags: '',
        template_tags: 'BENH_LY',
        scope: 'specific'
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const simulatePipeline = () => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentStageIdx(0);

    // Mock progress 
    let currentP = 0;
    const interval = setInterval(() => {
      currentP += 5;
      setProgress(currentP);

      if (currentP >= 20) setCurrentStageIdx(1);
      if (currentP >= 40) setCurrentStageIdx(2);
      if (currentP >= 60) setCurrentStageIdx(3);
      if (currentP >= 80) setCurrentStageIdx(4);

      if (currentP >= 100) {
        clearInterval(interval);
        setIsProcessing(false);
        setIsFinished(true);
        // Auto-fill some stub data
        const urls = urlInput.split('\n').map(u => u.trim()).filter(Boolean);
        const urlCount = urls.length;
        
        let initialTitle = 'Nguồn tài liệu mới';
        if (selectedFile) {
          initialTitle = selectedFile.name.replace('.pdf', '');
        } else if (urlCount === 1) {
          try { initialTitle = 'Bài viết học thuật từ ' + new URL(urls[0]).hostname; } catch(e){}
        } else if (urlCount > 1) {
          initialTitle = `Danh sách tổng hợp (${urlCount} nguồn y khoa)`;
        }

        setFormData(prev => ({
          ...prev,
          title: initialTitle,
          publisher: selectedFile ? 'Tài liệu PDF' : 'Nguồn Web',
          topic_tags: 'tiểu đường, gan nhiễm mỡ',
          scope: urlCount > 1 ? 'general' : 'specific'
        }));
      }
    }, 150); // Fast simulation
  };

  const handleFinish = () => {
    if (activeTab === 'url') {
      const urls = urlInput.split('\n').map(u => u.trim()).filter(Boolean);
      
      if (urls.length > 0) {
        const newSources: KBSource[] = urls.map((url, i) => {
          let hostname = url;
          try { hostname = new URL(url).hostname; } catch(e) {}
          
          return {
            id: `src-${Date.now()}-${i}`,
            title: urls.length === 1 ? formData.title : `[${hostname}] ${formData.title}`,
            source_type: 'url',
            language: formData.language,
            publisher: urls.length === 1 ? formData.publisher : hostname,
            publish_year: formData.publish_year,
            topic_tags: formData.topic_tags.split(',').map(s => s.trim()).filter(Boolean),
            template_tags: [formData.template_tags],
            scope: formData.scope,
            status: 'ready',
            chunk_count: Math.floor(Math.random() * 30) + 5,
            is_active: true,
            uploaded_by: 'admin',
            created_at: new Date().toISOString(),
            last_indexed_at: new Date().toISOString(),
            origin_url: url
          };
        });
        onComplete(newSources);
        return;
      }
    }

    // PDF flow
    const newSource: KBSource = {
      id: `src-${Date.now()}`,
      title: formData.title,
      source_type: 'pdf',
      language: formData.language,
      publisher: formData.publisher,
      publish_year: formData.publish_year,
      topic_tags: formData.topic_tags.split(',').map(s => s.trim()).filter(Boolean),
      template_tags: [formData.template_tags],
      scope: formData.scope,
      status: 'ready',
      chunk_count: Math.floor(Math.random() * 50) + 10,
      is_active: true,
      uploaded_by: 'admin',
      created_at: new Date().toISOString(),
      last_indexed_at: new Date().toISOString(),
      file_size_kb: selectedFile ? Math.round(selectedFile.size / 1024) : 0,
      page_count: Math.floor(Math.random() * 20) + 2
    };
    
    onComplete(newSource);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0C10]/80 flex justify-center items-center backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] w-full max-w-2xl rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-default)] flex justify-between items-center bg-[var(--bg-secondary)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Thêm nguồn tài liệu Knowledge Base</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors" disabled={isProcessing}>✕</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {!isProcessing && !isFinished && (
            <>
              {/* Tab selector */}
              <div className="flex bg-[var(--bg-card-hover)] p-1 rounded-lg mb-6">
                 <button 
                   onClick={() => setActiveTab('pdf')} 
                   className={`flex-1 py-2 flex justify-center items-center gap-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'pdf' ? 'bg-[var(--bg-primary)] shadow text-[var(--lc-primary)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
                 >
                   <FileText size={16} /> Upload PDF
                 </button>
                 <button 
                   onClick={() => setActiveTab('url')} 
                   className={`flex-1 py-2 flex justify-center items-center gap-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'url' ? 'bg-[var(--bg-primary)] shadow text-[var(--lc-primary)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
                 >
                   <LinkIcon size={16} /> Liên kết URL
                 </button>
              </div>

              {activeTab === 'pdf' ? (
                <div className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--lc-primary)] rounded-xl py-12 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group bg-[var(--bg-secondary)]"
                     onClick={() => document.getElementById('pdf-upload')?.click()}
                >
                  <input type="file" id="pdf-upload" accept="application/pdf" className="hidden" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
                  <div className="w-16 h-16 rounded-full bg-[var(--lc-primary)]/10 text-[var(--lc-primary)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud size={32} />
                  </div>
                  {selectedFile ? (
                    <>
                      <p className="font-bold text-[var(--text-primary)] mb-1">{selectedFile.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-[var(--text-primary)] mb-1">Click hoặc kéo thả file PDF vào đây</p>
                      <p className="text-sm text-[var(--text-secondary)]">Dung lượng tối đa 50MB</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-default)]">
                   <label className="text-sm font-bold text-[var(--text-secondary)] mb-2 block">Nhập danh sách URL (Mỗi URL 1 dòng để Bulk Import)</label>
                   <textarea 
                     className="input-field w-full min-h-[120px] resize-y custom-scrollbar text-sm font-mono leading-relaxed"
                     placeholder="https://who.int/...&#10;https://pubmed.ncbi.nlm.nih.gov/...&#10;https://cdc.gov/..."
                     value={urlInput}
                     onChange={(e) => setUrlInput(e.target.value)}
                   />
                </div>
              )}

              <div className="border-t border-[var(--border-default)] mt-8 pt-4 flex justify-end">
                <button 
                  onClick={simulatePipeline} 
                  disabled={Boolean(activeTab === 'pdf' ? !selectedFile : !urlInput)}
                  className="btn-primary py-2 px-6 shadow-lg disabled:opacity-50"
                >
                  Bắt đầu nạp dữ liệu
                </button>
              </div>
            </>
          )}

          {isProcessing && (
            <div className="py-8">
               <div className="mb-8 flex justify-between items-center text-sm font-bold text-[var(--text-secondary)]">
                 <span>Tiến trình xử lý KB Ingestion</span>
                 <span className="text-[var(--lc-primary)]">{progress}%</span>
               </div>
               
               <div className="w-full bg-[var(--bg-card-hover)] h-2 rounded-full overflow-hidden mb-8">
                 <div className="bg-gradient-to-r from-blue-500 to-[var(--lc-primary)] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
               </div>

               <div className="space-y-4">
                 {STAGES.map((stage, idx) => {
                   const isPast = idx < currentStageIdx;
                   const isCurrent = idx === currentStageIdx;
                   return (
                     <div key={stage.id} className={`flex items-center gap-3 text-sm ${isPast ? 'text-emerald-400' : isCurrent ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-muted)]'}`}>
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${isPast ? 'border-emerald-400 bg-emerald-400/20' : isCurrent ? 'border-[var(--lc-primary)] bg-[var(--lc-primary)]/20 animate-pulse' : 'border-[var(--border-default)] bg-transparent'}`}>
                         {isPast ? <CheckCircle2 size={12} /> : (isCurrent ? <RotateCcw size={10} className="animate-spin" /> : null)}
                       </div>
                       <span>{stage.label}</span>
                     </div>
                   );
                 })}
               </div>
            </div>
          )}

          {isFinished && (
            <div className="animate-fade-in">
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3 mb-6">
                <CheckCircle2 size={24} className="shrink-0" />
                <div>
                   <h3 className="font-bold text-sm">Trích xuất & Indexing thành công!</h3>
                   <p className="text-xs mt-1">Hệ thống AI đã tự động điền các thông tin metadata. Bạn có thể kiểm tra và chỉnh sửa trước khi lưu.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Tên Tài Liệu (Title)</label>
                  <input type="text" className="input-field w-full text-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Nhà xuất bản/Cơ quan (Publisher)</label>
                  <input type="text" className="input-field w-full text-sm" value={formData.publisher} onChange={e => setFormData({...formData, publisher: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Năm xuất bản (Year)</label>
                  <input type="number" className="input-field w-full text-sm" value={formData.publish_year} onChange={e => setFormData({...formData, publish_year: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Đề cập Template mặc định</label>
                  <select className="input-field w-full text-sm" value={formData.template_tags} onChange={e => setFormData({...formData, template_tags: e.target.value})}>
                     <option value="BENH_LY">Bệnh Lý</option>
                     <option value="THUOC">Thuốc & Hoạt Chất</option>
                     <option value="GSK_BLOG">GSK Bài Chuẩn</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Phân loại Nhóm Nguồn (Scope)</label>
                  <select className="input-field w-full text-sm font-semibold" value={formData.scope} onChange={e => setFormData({...formData, scope: e.target.value as 'general' | 'specific'})}>
                     <option value="general">Nhóm 1: Trang web thông tin sức khỏe uy tín, đa dạng nội dung (Toàn tập)</option>
                     <option value="specific">Nhóm 2: Link bài viết, chuyên đề cho topic cụ thể</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Ngôn ngữ</label>
                  <select className="input-field w-full text-sm" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>
                     <option value="vi">Tiếng Việt</option>
                     <option value="en">English</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Topic Tags (do AI tự nhận diện, cách nhau bằng dấu phẩy)</label>
                  <input type="text" className="input-field w-full text-sm font-mono text-emerald-400" value={formData.topic_tags} onChange={e => setFormData({...formData, topic_tags: e.target.value})} />
                </div>
              </div>

              <div className="border-t border-[var(--border-default)] mt-6 pt-4 flex justify-end gap-3">
                 <button onClick={() => setIsFinished(false)} className="btn-secondary px-4 py-2 text-sm">Làm lại</button>
                 <button onClick={handleFinish} className="btn-primary px-6 py-2 shadow-lg text-sm bg-gradient-to-r from-emerald-500 to-[var(--lc-primary)] border-none">
                   Lưu & Kích Hoạt
                 </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
