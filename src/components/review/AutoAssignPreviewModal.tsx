import React, { useState, useEffect } from 'react';

interface PreviewAssignment {
  articleId: string;
  title: string;
  specialty?: string;
  suggestedBsId?: string;
  suggestedBsName?: string;
  score?: number;
  error?: string;
}

interface AutoAssignPreviewModalProps {
  articleIds: string[];
  onClose: () => void;
  onConfirm: (assignments: { articleId: string; bsId: string }[]) => Promise<void>;
}

export default function AutoAssignPreviewModal({
  articleIds,
  onClose,
  onConfirm
}: AutoAssignPreviewModalProps) {
  const [previews, setPreviews] = useState<PreviewAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchPreviewAndDoctors = async () => {
      setLoading(true);
      try {
        // Fetch preview
        const resPreview = await fetch('/api/articles/auto-batch-assign-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleIds }),
        });
        const dataPreview = await resPreview.json();
        if (Array.isArray(dataPreview.previews)) {
          setPreviews(dataPreview.previews);
        }

        // Fetch doctors for manual override
        const resDoctors = await fetch('/api/articles/batch-assign?role=bs');
        const dataDoctors = await resDoctors.json();
        if (dataDoctors.users) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setDoctors(dataDoctors.users.map((u: any) => ({ id: u.id, name: u.name })));
        }
      } catch (err) {
        console.error('Lỗi khi fetch auto-assign preview', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreviewAndDoctors();
  }, [articleIds]);

  const handleBsChange = (articleId: string, newBsId: string) => {
    setPreviews(prev => prev.map(p => {
      if (p.articleId === articleId) {
        const doc = doctors.find(d => d.id === newBsId);
        return {
          ...p,
          suggestedBsId: newBsId,
          suggestedBsName: doc ? doc.name : p.suggestedBsName,
          error: undefined
        };
      }
      return p;
    }));
  };

  const handleConfirm = async () => {
    const finalAssignments = previews
      .filter(p => p.suggestedBsId && !p.error)
      .map(p => ({
        articleId: p.articleId,
        bsId: p.suggestedBsId!
      }));

    if (finalAssignments.length === 0) {
      alert("Không có bài viết nào hợp lệ để gán.");
      return;
    }

    setSubmitting(true);
    await onConfirm(finalAssignments);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 px-4 animate-fade-in" style={{ animationDuration: '200ms' }}>
      <div className="w-full max-w-3xl bg-[#161b22] rounded-2xl border border-[var(--border-default)] p-6 shadow-xl flex flex-col max-h-[85vh]">
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">🤖 Tùy chỉnh Auto-Assign BS</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Hệ thống đã chuẩn bị gợi ý dựa trên chuyên khoa và tải của bác sĩ (Load-Balancing). HĐYK có thể thay đổi trên bảng trước khi Xác nhận gửi lô.
            </p>
          </div>
          <button onClick={onClose} disabled={submitting} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg disabled:opacity-50">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto hidden-scrollbar min-h-[300px] border border-[var(--border-default)] rounded-xl bg-[#0d1117] relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <span className="text-3xl animate-bounce mb-3">⚙️</span>
              <p className="text-sm">Đang tính toán thuật toán phân bổ...</p>
            </div>
          ) : previews.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--text-muted)]">
              Không có dữ liệu preview.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-[#161b22] sticky top-0 z-10 text-[var(--text-muted)] border-b border-[var(--border-default)]">
                <tr>
                  <th className="py-3 px-4 font-semibold text-xs w-[40%]">Tên bài viết</th>
                  <th className="py-3 px-4 font-semibold text-xs">Chuyên khoa</th>
                  <th className="py-3 px-4 font-semibold text-xs">Bác sĩ đề xuất</th>
                </tr>
              </thead>
              <tbody>
                {previews.map((p) => (
                  <tr key={p.articleId} className="border-b border-[#1f2937]/50 hover:bg-[#1f2937]/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-[var(--text-primary)] font-medium truncate max-w-[280px]" title={p.title}>{p.title}</p>
                      {p.error && <p className="text-[10px] text-red-400 mt-1">{p.error}</p>}
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--text-secondary)]">
                      {p.specialty || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <select 
                        value={p.suggestedBsId || ''}
                        onChange={(e) => handleBsChange(p.articleId, e.target.value)}
                        className={`w-full bg-[#0d1117] border border-[var(--border-default)] rounded-lg px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none ${!p.suggestedBsId ? 'text-red-400 border-red-500/50' : 'text-teal-400'}`}
                      >
                        <option value="" disabled>-- Cần chọn BS --</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      {p.score !== undefined && (
                        <p className="text-[10px] text-teal-500/70 mt-1 text-right block">Score: {Math.round(p.score)}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-default)]">
          <button 
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[#1f2937] transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || submitting}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? '⏳ Đang Assign...' : '✅ Xác Nhận Assign Batch'}
          </button>
        </div>

      </div>
    </div>
  );
}
