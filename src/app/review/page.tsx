'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { GeneratedArticle, StrapiArticleFields } from '@/types';
import { getGeneratedArticles, updateArticleInStorage, deleteArticleFromStorage } from '@/lib/storage';
import ArticleEditor from '@/components/review/ArticleEditor';
import ArticleDetail from '@/components/review/ArticleDetail';
import AutoAssignPreviewModal from '@/components/review/AutoAssignPreviewModal';
import { buildScoreExplanation } from '@/lib/qc/qc-explain';
import { useSite } from '@/contexts/SiteContext';
import { useAuth } from '@/contexts/AuthContext';
import { WORKFLOW_STATUS_LABEL, WORKFLOW_STATUS_COLOR } from '@/types/auth';
import type { Role, WorkflowStatus } from '@/types/auth';
import { exportBatchToDocx, exportBatchToZip } from '@/lib/export-docx';

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
};

const scoreBg = (score: number) => {
  if (score >= 80) return 'bg-emerald-500/15';
  if (score >= 60) return 'bg-amber-500/15';
  return 'bg-red-500/15';
};

type ViewMode = 'list' | 'editor' | 'strapi';

/** Templates that use the Strapi-style detail view instead of split-section editor */
const STRAPI_VIEW_TEMPLATES = new Set(['gsk-blog', 'hoi-dap-bac-si', 'benh-ly', 'duoc-chat']);
const getViewModeForTemplate = (templateId: string): ViewMode =>
  STRAPI_VIEW_TEMPLATES.has(templateId) ? 'strapi' : 'editor';

function ReviewQueueContent() {
  const [articles, setArticles] = useState<GeneratedArticle[]>([]);
  const [activeArticle, setActiveArticle] = useState<GeneratedArticle | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [_previewArticle] = useState<GeneratedArticle | null>(null); // kept for hook count stability

  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
  const [confirmRegenerateId, setConfirmRegenerateId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saveToastVisible, setSaveToastVisible] = useState(false);

  const showSaveToast = () => {
    setSaveToastVisible(true);
    setTimeout(() => setSaveToastVisible(false), 2500);
  };

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetIds, setAssignTargetIds] = useState<string[]>([]);
  const [assignType, setAssignType] = useState<'ctv' | 'bs'>('ctv');
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Auto Assign Preview modal state
  const [showAutoAssignPreview, setShowAutoAssignPreview] = useState(false);

  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');
  const filterBsIdParam = searchParams.get('filterBsId');
  const { currentSite } = useSite();
  const { user } = useAuth();
  const deepLinkHandled = React.useRef(false);

  // Reset deep link tracking when ID changes
  React.useEffect(() => {
    deepLinkHandled.current = false;
  }, [initialId]);

  useEffect(() => {
    console.log('[DEEP-LINK DEBUG] Effect triggered. initialId:', initialId, 'currentSite:', currentSite);
    // When deep-linking by ID, fetch ALL articles (no site filter) to guarantee a match
    const siteFilter = initialId ? undefined : currentSite;
    getGeneratedArticles(siteFilter).then((data) => {
      console.log('[DEEP-LINK DEBUG] Fetch resolved. data length:', data.length, 'siteFilter:', siteFilter);
      setArticles(data);
      if (initialId && !deepLinkHandled.current) {
        const match = data.find(a => a.id === initialId);
        console.log('[DEEP-LINK DEBUG] Resolving deep-link. Match found:', !!match);
        if (match) {
          deepLinkHandled.current = true;
          setActiveArticle(match);
          setViewMode(getViewModeForTemplate(match.templateId));
        } else {
          console.log('[DEEP-LINK DEBUG] Match not found for ID:', initialId);
        }
      }
      // NOTE: Do NOT reset activeArticle/viewMode here when currentSite changes.
      // If user is already viewing a detail, the list refreshes silently in the background.
    });
  }, [initialId, currentSite]);

  // Cập nhật State nội bộ sau khi API hoàn tất thành công
  const updateArticlesState = (updater: (prev: GeneratedArticle[]) => GeneratedArticle[]) => {
    setArticles(updater);
  };

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTemplate, setFilterTemplate] = useState('');
  const [filterScore, setFilterScore] = useState(''); // 'high', 'medium', 'low'
  const [filterStatus, setFilterStatus] = useState(''); // legacy QC status
  const [filterWorkflow, setFilterWorkflow] = useState(''); // RBAC workflow status
  const [filterQcGrade, setFilterQcGrade] = useState(''); // 'A','B','C','D','E'
  const [filterSafety, setFilterSafety] = useState(''); // 'SAFE_TO_PUBLISH','REVIEW','NEEDS_REVISION','REJECT'
  const [sortBy, setSortBy] = useState(''); // 'score_high','score_low','issues','recent'
  
  // Advanced User Filters
  const [filterCreatedBy, setFilterCreatedBy] = useState('');
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [filterApprovedBy, setFilterApprovedBy] = useState('');
  const [filterAssignedBy, setFilterAssignedBy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Role-based pre-filtering
  const roleFilteredArticles = React.useMemo(() => {
    if (!user) return articles;
    const role = user.role as Role;
    switch (role) {
      case 'ctv':
        return articles.filter(a => ((a as unknown) as { createdBy?: string, assignedCtvId?: string }).createdBy === user.id || ((a as unknown) as { createdBy?: string, assignedCtvId?: string }).assignedCtvId === user.id);
      case 'bs':
        return articles.filter(a => ((a as unknown) as { assignedBsId?: string }).assignedBsId === user.id);
      case 'hdyk':
        // HĐYK chỉ thấy bài đã auto_approved (QC status = approved) — cổng chất lượng trước y khoa
        return articles.filter(a => a.status === 'approved');
      case 'btv':
        // BTV sees all CTV articles + own articles
        return articles;
      default:
        // lead, superadmin see all
        return articles;
    }
  }, [articles, user]);

  // Filter logic (on top of role filter)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredArticles = roleFilteredArticles.filter((article: any) => {
    if (searchQuery && !article.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTemplate && article.templateId !== filterTemplate) return false;
    if (filterStatus && article.status !== filterStatus) return false;
    // Workflow status filter
    if (filterWorkflow && ((article as unknown) as { workflowStatus?: string }).workflowStatus !== filterWorkflow) return false;
    
    const score = article.qcScore ?? 0;
    if (filterScore === 'high' && score < 80) return false;
    if (filterScore === 'medium' && (score >= 80 || score < 60)) return false;
    if (filterScore === 'low' && score >= 60) return false;

    // QC Grade filter
    if (filterQcGrade && article.qcGrade !== filterQcGrade) return false;

    // Safety Decision filter
    if (filterSafety && article.qcDecision !== filterSafety) return false;

    // Advanced User Filters
    if (filterCreatedBy && article.createdBy !== filterCreatedBy) return false;
    if (filterAssignedTo && article.assignedCtvId !== filterAssignedTo && article.assignedBsId !== filterAssignedTo) return false;
    if (filterApprovedBy && article.approvedBy !== filterApprovedBy) return false;
    if (filterAssignedBy && article.assignedBy !== filterAssignedBy) return false;

    return true;
  }).sort((a: GeneratedArticle, b: GeneratedArticle) => {
    switch (sortBy) {
      case 'score_high': return (b.qcScore || 0) - (a.qcScore || 0);
      case 'score_low': return (a.qcScore || 0) - (b.qcScore || 0);
      case 'issues': return (b.qcManualIssues || 0) - (a.qcManualIssues || 0);
      case 'recent': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default: return 0;
    }
  });

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / itemsPerPage));
  const currentArticles = filteredArticles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filters change
  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, filterTemplate, filterScore, filterStatus, filterWorkflow, filterQcGrade, filterSafety, sortBy, filterAssignedTo]);

  // Auto-set BS filter when navigating from Dashboard "Quản lý bài" link
  React.useEffect(() => {
    if (filterBsIdParam) {
      setFilterAssignedTo(filterBsIdParam);
    }
  }, [filterBsIdParam]);

  // Listen for sidebar 'Review Queue' clicks to escape detail view

  
  React.useEffect(() => {
    const handleReset = () => {
      setActiveArticle(null);
      setViewMode('list');
    };
    window.addEventListener('resetReviewList', handleReset);
    return () => window.removeEventListener('resetReviewList', handleReset);
  }, []);

  // ─── Workflow Action Handlers ──────────────────────────────
  const handleWorkflowAction = async (articleId: string, action: string, payload?: Record<string, any>) => {
    try {
      const body: Record<string, any> = { action, ...payload };
      
      // For reject, prompt for mandatory fields (simplified — full form in detail view)
      if (action === 'reject') {
        const reason = prompt('Lý do từ chối (bắt buộc):');
        if (!reason) return;
        body.rejectionReason = reason;
        body.inlineComments = [{ note: reason }];
        body.revisionChecklist = [{ item: 'Cần chỉnh sửa theo góp ý', done: false }];
      }

      const res = await fetch(`/api/articles/${articleId}/workflow`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi: ${data.error}`);
        return;
      }
      alert(`✅ ${data.message}`);
      // Refresh article list
      const siteFilter = currentSite;
      const freshArticles = await getGeneratedArticles(siteFilter);
      setArticles(freshArticles);
    } catch (err) {
      console.error('[workflow action]', err);
      alert('Lỗi khi thực hiện hành động');
    }
  };

  const handleAssignBs = async (articleId: string) => {
    try {
      const res = await fetch(`/api/articles/${articleId}/assign-bs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // auto-assign
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi: ${data.error}`);
        return;
      }
      alert(`✅ Đã assign cho ${data.assignedBsName || 'BS'} (${data.method})`);
      const freshArticles = await getGeneratedArticles(currentSite);
      setArticles(freshArticles);
    } catch (err) {
      console.error('[assign-bs]', err);
      alert('Lỗi khi assign BS');
    }
  };

  // ─── Assign Modal Handlers ─────────────────────────────────
  const openAssignModal = async (articleIds: string[], type: 'ctv' | 'bs') => {
    setAssignTargetIds(articleIds);
    setAssignType(type);
    setAssignLoading(true);
    setShowAssignModal(true);
    try {
      const res = await fetch(`/api/articles/batch-assign?role=${type}`);
      const data = await res.json();
      setAssignableUsers(data.users || []);
    } catch {
      setAssignableUsers([]);
    }
    setAssignLoading(false);
  };

  const executeAssign = async (assigneeId: string) => {
    try {
      const res = await fetch('/api/articles/batch-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds: assignTargetIds, assigneeId, assigneeType: assignType }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi: ${data.error}`);
        return;
      }
      alert(`✅ ${data.message}`);
      setShowAssignModal(false);
      setSelectedArticleIds([]);
      const freshArticles = await getGeneratedArticles(currentSite);
      setArticles(freshArticles);
    } catch {
      alert('Lỗi khi assign');
    }
  };

  // Execute auto-assign after preview confirmation
  const handleAutoAssignConfirm = async (assignments: { articleId: string; bsId: string }[]) => {
    try {
      const res = await fetch('/api/articles/batch-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi: ${data.error}`);
        return;
      }
      alert(`✅ ${data.message}`);
      setShowAutoAssignPreview(false);
      setSelectedArticleIds([]);
      // Refresh list
      const freshArticles = await getGeneratedArticles(currentSite);
      setArticles(freshArticles);
    } catch {
      alert('Lỗi submit auto-assign');
    }
  };

  // Bulk Handlers
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportingSingleId, setExportingSingleId] = useState<string | null>(null);

  // ─── Export DOCX Handlers ─────────────────────────────────
  const handleExportSelected = async () => {
    if (selectedArticleIds.length === 0) return;
    setIsExportingDocx(true);
    try {
      const res = await fetch('/api/articles/export-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds: selectedArticleIds }),
      });
      if (!res.ok) throw new Error('Failed to fetch articles');
      const data = await res.json();
      await exportBatchToZip(data, `export_${selectedArticleIds.length}_articles_${new Date().toISOString().slice(0, 10)}`);
    } catch (error) {
      console.error('DOCX export error:', error);
      alert('❌ Lỗi khi export DOCX. Vui lòng thử lại.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportSingle = async (articleId: string) => {
    setExportingSingleId(articleId);
    try {
      const res = await fetch('/api/articles/export-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds: [articleId] }),
      });
      if (!res.ok) throw new Error('Failed to fetch article');
      const data = await res.json();
      if (data.length > 0) {
        const title = data[0].title?.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s-]/g, '').replace(/\s+/g, '_').slice(0, 50) || 'article';
        await exportBatchToDocx(data, title);
      }
    } catch (error) {
      console.error('DOCX export error:', error);
      alert('❌ Lỗi khi export DOCX.');
    } finally {
      setExportingSingleId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedArticleIds.length === 0) return;
    if (window.confirm(`Duyệt ${selectedArticleIds.length} bài viết đã chọn?`)) {
      const toUpdate = articles.filter(a => selectedArticleIds.includes(a.id));
      await Promise.all(toUpdate.map(a => updateArticleInStorage({ ...a, status: 'approved' })));
      
      updateArticlesState(prev =>
        prev.map(a => (selectedArticleIds.includes(a.id) ? { ...a, status: 'approved' as const } : a))
      );
      setSelectedArticleIds([]);
    }
  };

  const handleBulkSyncStrapi = async () => {
    const approvedIds = articles.filter(a => selectedArticleIds.includes(a.id) && a.status === 'approved').map(a => a.id);
    if (approvedIds.length === 0) {
      alert('Chỉ có thể đồng bộ các bài viết Đã duyệt (Approved). Vui lòng chọn lại.');
      return;
    }
    if (window.confirm(`Đồng bộ ${approvedIds.length} bài viết đã duyệt sang Strapi?`)) {
      setIsSyncing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      const syncStamp = new Date().toISOString();
      const toUpdate = articles.filter(a => approvedIds.includes(a.id));
      await Promise.all(toUpdate.map(a => updateArticleInStorage({ ...a, syncedAt: syncStamp })));

      updateArticlesState(prev =>
        prev.map(a => (approvedIds.includes(a.id) ? { ...a, syncedAt: syncStamp } : a))
      );
      setSelectedArticleIds([]);
      setIsSyncing(false);
      alert(`Đã xuất bản ${approvedIds.length} bài lên Strapi thành công!`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedArticleIds.length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedArticleIds.length} bài viết đã chọn? Hành động này không thể hoàn tác.`)) {
      try {
        await Promise.all(selectedArticleIds.map(id => deleteArticleFromStorage(id)));
        updateArticlesState(prev => prev.filter(a => !selectedArticleIds.includes(a.id)));
        setSelectedArticleIds([]);
        window.dispatchEvent(new Event('storage')); // trigger sidebar update
        alert('Đã xóa các bài viết thành công!');
      } catch (err) {
        alert('Lỗi khi xóa hàng loạt: ' + err);
      }
    }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedArticleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const currentIds = currentArticles.map(a => a.id);
    const allSelected = currentIds.every(id => selectedArticleIds.includes(id));
    if (allSelected) {
      setSelectedArticleIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedArticleIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const executeDelete = async (id: string) => {
    await deleteArticleFromStorage(id);
    updateArticlesState(prev => prev.filter(a => a.id !== id));
    setSelectedArticleIds(prev => prev.filter(x => x !== id));
    window.dispatchEvent(new Event('storage')); // trigger sidebar update
  };

  // Editor handlers
  const executeRegenerate = async (article: GeneratedArticle) => {
    setRegeneratingIds(prev => {
      const next = new Set(prev);
      next.add(article.id);
      return next;
    });
    try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item: { id: article.id, title: article.title, status: 'draft', outline: '' },
            settings: {
              sourceText: article.references?.join('\n') || '', // fallback
              templateId: article.templateId,
              articleCount: 1,
              tone: 'professional',
              language: 'vi',
              minWords: 600,
              maxWords: 1500,
            }
          }),
        });
  
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        const newArticleData = { ...data.article, id: article.id };
        await updateArticleInStorage(newArticleData);
        updateArticlesState(prev => prev.map(a => a.id === data.article.id ? newArticleData : a));
        alert("Đã tạo lại bài viết thành công!");
    } catch(err) {
        alert("Lỗi tạo lại: " + err);
    } finally {
        setRegeneratingIds(prev => {
           const next = new Set(prev);
           next.delete(article.id);
           return next;
        });
    }
  };

  const handleSave = async (updated: GeneratedArticle) => {
    await updateArticleInStorage(updated);
    updateArticlesState(prev => prev.map(a => (a.id === updated.id ? updated : a)));
    setActiveArticle(updated);
    // Stay on detail page — show toast
    showSaveToast();
  };

  const handleApprove = async (article: GeneratedArticle) => {
    const updated = { ...article, status: 'approved' as const };
    await updateArticleInStorage(updated);
    updateArticlesState(prev =>
      prev.map(a => (a.id === article.id ? updated : a))
    );
    setActiveArticle(null);
    setViewMode('list');
  };

  const handleReject = async (article: GeneratedArticle) => {
    const updated = { ...article, status: 'rejected' as const };
    await updateArticleInStorage(updated);
    updateArticlesState(prev =>
      prev.map(a => (a.id === article.id ? updated : a))
    );
    setActiveArticle(null);
    setViewMode('list');
  };

  // Strapi detail handlers
  const handleDetailSave = async (article: GeneratedArticle, _fields: StrapiArticleFields) => {
    // Merge fields back into article so dashboard reflects edits
    const merged: GeneratedArticle = {
      ...article,
      title: _fields.tenBaiViet,
      content: _fields.moTa,
      sapo: _fields.moTaNgan,
      category: _fields.danhMucBaiViet,
      tags: _fields.tags,
      seoMeta: {
        title: _fields.seo.metaTitle,
        description: _fields.seo.metaDescription,
      },
      rawFields: {
        ...(article.rawFields || {}),
        timHieuChung: _fields.moTa,
        trieuChung: _fields.trieuChung || '',
        nguyenNhan: _fields.nguyenNhan || '',
        nguyCo: _fields.nguyCo || '',
        chanDoanDieuTri: _fields.chanDoanDieuTri || '',
        sinhHoatPhongNgua: _fields.sinhHoatPhongNgua || '',
        faq: _fields.faq || [],
      },
    };
    await updateArticleInStorage(merged);
    updateArticlesState(prev => prev.map(a => (a.id === merged.id ? merged : a)));
    setActiveArticle(merged);
    // Stay on detail page — show toast
    showSaveToast();
  };

  const handleDetailPublish = async (article: GeneratedArticle, _fields: StrapiArticleFields) => {
    const updated = { ...article, status: 'approved' as const };
    await updateArticleInStorage(updated);
    updateArticlesState(prev =>
      prev.map(a => (a.id === article.id ? updated : a))
    );
    setActiveArticle(null);
    setViewMode('list');
  };

  const handleSoftUpdate = (updatedArticle: GeneratedArticle) => {
    updateArticlesState(prev => prev.map(a => (a.id === updatedArticle.id ? updatedArticle : a)));
    setActiveArticle(updatedArticle);
  };

  // Save toast overlay
  const SaveToast = () => saveToastVisible ? (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in">
      <div className="px-6 py-3 rounded-2xl bg-emerald-600/95 text-white text-sm font-semibold shadow-[0_8px_32px_rgba(16,185,129,0.4)] backdrop-blur-sm flex items-center gap-3 border border-emerald-400/30">
        <span className="text-lg">✅</span>
        <span>Đã lưu nháp thành công!</span>
      </div>
    </div>
  ) : null;

  // Full-screen editor mode
  if (viewMode === 'editor' && activeArticle) {
    return (
      <>
        <ArticleEditor
          article={activeArticle}
          onSave={handleSave}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => { setActiveArticle(null); setViewMode('list'); }}
        />
        <SaveToast />
      </>
    );
  }

  // Strapi-style detail view
  if (viewMode === 'strapi' && activeArticle) {
    return (
      <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
        <Sidebar />
        <ArticleDetail
          article={activeArticle}
          onSave={handleDetailSave}
          onPublish={handleDetailPublish}
          onBack={() => { setActiveArticle(null); setViewMode('list'); }}
          onSoftUpdate={handleSoftUpdate}
        />
        <SaveToast />
      </div>
    );
  }

  // List view — Workflow-based stats
  const draftCount = roleFilteredArticles.filter(a => ((a as unknown) as { workflowStatus?: string }).workflowStatus === 'draft').length;
  const pendingBsCount = roleFilteredArticles.filter(a => ((a as unknown) as { workflowStatus?: string }).workflowStatus === 'pending_bs_review').length;
  const underReviewCount = roleFilteredArticles.filter(a => ((a as unknown) as { workflowStatus?: string }).workflowStatus === 'under_review').length;
  const publishedCount = roleFilteredArticles.filter(a => ((a as unknown) as { workflowStatus?: string }).workflowStatus === 'published').length;
  const needsRevisionCount = roleFilteredArticles.filter(a => {
    const ws = ((a as unknown) as { workflowStatus?: string }).workflowStatus;
    return ws === 'needs_revision' || ws === 'cta_pending';
  }).length;

  const getDistinctUsers = (keyId: keyof GeneratedArticle, keyName: keyof GeneratedArticle) => {
    const map = new Map<string, string>();
    roleFilteredArticles.forEach(a => {
      const id = a[keyId] as string;
      const name = a[keyName] as string;
      if (id && name) map.set(id, name);
    });
    return Array.from(map.entries());
  };

  const creators = getDistinctUsers('createdBy', 'createdByName');
  const getDistinctAssignees = () => {
    const map = new Map<string, string>();
    roleFilteredArticles.forEach(a => {
      if (a.assignedCtvId && a.assignedCtvName) map.set(a.assignedCtvId, a.assignedCtvName);
      if (a.assignedBsId && a.assignedBsName) map.set(a.assignedBsId, a.assignedBsName);
    });
    return Array.from(map.entries());
  };
  const assignees = getDistinctAssignees();
  const approvers = getDistinctUsers('approvedBy', 'approvedByName');
  const assigners = getDistinctUsers('assignedBy', 'assignedByName');

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mb-2 uppercase tracking-wider font-medium">
              <span>Workspace</span>
              <span>/</span>
              <span className="text-[var(--text-accent)]">Articles List</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                  Danh Sách Bài Viết
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  Quản lý quá trình viết và kiểm định nội dung y khoa
                </p>
              </div>
              <Link
                href="/create"
                className="btn-primary px-5 py-2.5 flex items-center gap-2 group shadow-[0_0_20px_rgba(0,102,204,0.3)] hover:shadow-[0_0_25px_rgba(0,102,204,0.5)] transition-all"
              >
                <span>✨</span>
                <span>Tạo bài mới</span>
                <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 group-hover:text-[var(--text-primary)] transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Stats cards — workflow pipeline */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            <div className={`glass-card p-3 rounded-xl cursor-pointer hover:border-slate-400/30 transition-colors ${filterWorkflow === 'draft' ? 'border-slate-400/50 ring-1 ring-slate-400/20' : ''}`} onClick={() => setFilterWorkflow(filterWorkflow === 'draft' ? '' : 'draft')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-slate-300">{draftCount}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Bản nháp</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-500/15 flex items-center justify-center text-sm">📝</div>
              </div>
            </div>
            <div className={`glass-card p-3 rounded-xl cursor-pointer hover:border-amber-400/30 transition-colors ${filterWorkflow === 'pending_bs_review' ? 'border-amber-400/50 ring-1 ring-amber-400/20' : ''}`} onClick={() => setFilterWorkflow(filterWorkflow === 'pending_bs_review' ? '' : 'pending_bs_review')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-amber-400">{pendingBsCount}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Chờ assign BS</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-sm">⏳</div>
              </div>
            </div>
            <div className={`glass-card p-3 rounded-xl cursor-pointer hover:border-blue-400/30 transition-colors ${filterWorkflow === 'under_review' ? 'border-blue-400/50 ring-1 ring-blue-400/20' : ''}`} onClick={() => setFilterWorkflow(filterWorkflow === 'under_review' ? '' : 'under_review')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-blue-400">{underReviewCount}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Đang duyệt</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-sm">🔍</div>
              </div>
            </div>
            <div className={`glass-card p-3 rounded-xl cursor-pointer hover:border-orange-400/30 transition-colors ${filterWorkflow === 'needs_revision' ? 'border-orange-400/50 ring-1 ring-orange-400/20' : ''}`} onClick={() => setFilterWorkflow(filterWorkflow === 'needs_revision' ? '' : 'needs_revision')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-orange-400">{needsRevisionCount}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Cần xử lý</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center text-sm">🔧</div>
              </div>
            </div>
            <div className={`glass-card p-3 rounded-xl cursor-pointer hover:border-emerald-400/30 transition-colors ${filterWorkflow === 'published' ? 'border-emerald-400/50 ring-1 ring-emerald-400/20' : ''}`} onClick={() => setFilterWorkflow(filterWorkflow === 'published' ? '' : 'published')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-emerald-400">{publishedCount}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Đã xuất bản</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-sm">✅</div>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedArticleIds.length > 0 && (
            <div className="glass-card mb-4 px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in border border-[var(--lc-primary)]/30 bg-[var(--lc-primary)]/5">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Đã chọn <span className="text-[var(--lc-primary)] font-bold">{selectedArticleIds.length}</span> bài viết
              </span>
              <div className="flex items-center gap-2">
                {/* BTV/Lead/SA: Assign CTV */}
                {(user?.role === 'btv' || user?.role === 'lead' || user?.role === 'superadmin') && (
                  <button
                    onClick={() => openAssignModal(selectedArticleIds, 'ctv')}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
                  >
                    👤 Assign CTV
                  </button>
                )}
                {/* HĐYK/Lead/SA: Assign BS */}
                {(user?.role === 'hdyk' || user?.role === 'lead' || user?.role === 'superadmin') && (
                  <>
                    <button
                      onClick={() => setShowAutoAssignPreview(true)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-colors shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                    >
                      🤖 Auto-Assign BS
                    </button>
                    <button
                      onClick={() => openAssignModal(selectedArticleIds, 'bs')}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 transition-colors"
                    >
                      🩺 Assign BS
                    </button>
                  </>
                )}
                <button
                  onClick={handleExportSelected}
                  disabled={isExportingDocx}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5"
                >
                  {isExportingDocx ? (
                    <><span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> Đang export...</>
                  ) : (
                    <><span>📦</span> Export ZIP</>
                  )}
                </button>
                <button
                  onClick={handleBulkApprove}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  ✅ Duyệt
                </button>
                <button
                  onClick={handleBulkSyncStrapi}
                  disabled={isSyncing}
                  className="btn-primary px-3 py-1.5 text-xs shadow-[0_0_15px_rgba(0,102,204,0.3)] bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-none"
                >
                  {isSyncing ? '⏳ Đang đẩy...' : '🚀 Strapi'}
                </button>
                {user && ['superadmin', 'lead', 'btv'].includes(user.role) && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                    title="Xóa tất cả các bài viết đã chọn"
                  >
                    🗑️ Xóa đã chọn
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active BS Filter Badge (from Dashboard "Quản lý bài" link) */}
          {filterBsIdParam && filterAssignedTo && (() => {
            const bsName = assignees.find(([id]) => id === filterAssignedTo)?.[1] || 'Bác sĩ';
            return (
              <div className="glass-card mb-3 px-4 py-3 rounded-xl flex items-center justify-between border border-teal-500/30 bg-teal-500/5 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🩺</span>
                  <span className="text-sm font-medium text-teal-400">Đang xem bài của: <strong className="text-teal-300">{bsName}</strong></span>
                </div>
                <button
                  onClick={() => { setFilterAssignedTo(''); window.history.replaceState(null, '', '/review'); }}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 transition-colors"
                >
                  ✕ Xóa filter
                </button>
              </div>
            );
          })()}

          {/* Filters Bar */}
          <div className="glass-card mb-6 px-5 py-3 rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-3 w-full overflow-x-auto pb-1 scrollbar-hide">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Tìm theo tên bài..." 
                  className="input-field py-1.5 pl-8 text-xs w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-[10px]">🔍</span>
              </div>
              
              <select 
                className="input-field py-1.5 text-xs w-36 appearance-none cursor-pointer"
                value={filterTemplate}
                onChange={(e) => setFilterTemplate(e.target.value)}
              >
                <option value="">Tất cả Template</option>
                <option value="benh-ly">Bệnh Lý</option>
                <option value="hoi-dap-bac-si">Hỏi đáp Bác sĩ</option>
                <option value="duoc-chat">Dược Chất</option>
                <option value="gsk-blog">Blog GSK</option>
              </select>

              <select 
                className="input-field py-1.5 text-xs w-40 appearance-none cursor-pointer"
                value={filterWorkflow}
                onChange={(e) => setFilterWorkflow(e.target.value)}
              >
                <option value="">Tất cả Workflow</option>
                <option value="draft">📝 Bản nháp</option>
                <option value="pending_bs_review">⏳ Chờ assign BS</option>
                <option value="under_review">🔍 Đang duyệt</option>
                <option value="needs_revision">🔧 Cần chỉnh sửa</option>
                <option value="cta_pending">📌 Chờ CTA</option>
                <option value="published">✅ Đã xuất bản</option>
                <option value="closed">🚫 Đã đóng</option>
              </select>

              <select 
                className="input-field py-1.5 text-xs w-36 appearance-none cursor-pointer"
                value={filterScore}
                onChange={(e) => setFilterScore(e.target.value)}
              >
                <option value="">Tất cả Điểm</option>
                <option value="high">Cao (80-100)</option>
                <option value="medium">Khá (60-79)</option>
                <option value="low">Thấp (&lt; 60)</option>
              </select>

              <select 
                className="input-field py-1.5 text-xs w-28 appearance-none cursor-pointer"
                value={filterQcGrade}
                onChange={(e) => setFilterQcGrade(e.target.value)}
              >
                <option value="">QC Grade</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="D">Grade D</option>
                <option value="E">Grade E</option>
              </select>

              <select 
                className="input-field py-1.5 text-xs w-36 appearance-none cursor-pointer"
                value={filterSafety}
                onChange={(e) => setFilterSafety(e.target.value)}
              >
                <option value="">Safety</option>
                <option value="SAFE_TO_PUBLISH">🛡️ Safe</option>
                <option value="REVIEW">⚠️ Review</option>
                <option value="NEEDS_REVISION">🔧 Revision</option>
                <option value="REJECT">❌ Reject</option>
              </select>

              <select 
                className="input-field py-1.5 text-xs w-36 appearance-none cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">Sắp xếp</option>
                <option value="score_high">QC Score ↑</option>
                <option value="score_low">QC Score ↓</option>
                <option value="issues">Nhiều lỗi nhất</option>
                <option value="recent">Mới nhất</option>
              </select>
            </div>

            {/* Advanced User Filters for Management Roles */}
            {user && ['superadmin', 'lead', 'btv', 'hdyk'].includes(user.role) && (
              <div className="flex flex-wrap items-center gap-3 w-full border-t border-[var(--border-default)] pt-2 mt-1">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider shrink-0 mr-2 flex items-center gap-1.5">
                  Lọc Theo Nhân Sự
                </span>
                
                <select 
                  className="input-field py-1.5 text-xs w-44 appearance-none cursor-pointer shrink-0"
                  value={filterCreatedBy}
                  onChange={(e) => setFilterCreatedBy(e.target.value)}
                >
                  <option value="">👤 Người tạo (Tất cả)</option>
                  {creators.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>

                <select 
                  className="input-field py-1.5 text-xs w-48 appearance-none cursor-pointer shrink-0"
                  value={filterAssignedTo}
                  onChange={(e) => setFilterAssignedTo(e.target.value)}
                >
                  <option value="">👩‍⚕️ BS/CTV được Assign (All)</option>
                  {assignees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>

                <select 
                  className="input-field py-1.5 text-xs w-48 appearance-none cursor-pointer shrink-0"
                  value={filterApprovedBy}
                  onChange={(e) => setFilterApprovedBy(e.target.value)}
                >
                  <option value="">✅ Người duyệt bài (Tất cả)</option>
                  {approvers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>

                <select 
                  className="input-field py-1.5 text-xs w-52 appearance-none cursor-pointer shrink-0"
                  value={filterAssignedBy}
                  onChange={(e) => setFilterAssignedBy(e.target.value)}
                >
                  <option value="">🤝 Người thực hiện assign (All)</option>
                  {assigners.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Article table */}
          <div className="glass-card rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[40px_1fr_120px_90px_140px_100px_160px] gap-4 px-5 py-3 border-b border-[var(--border-default)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider items-center">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-[var(--border-default)] bg-[var(--bg-card-hover)] checked:bg-[var(--lc-primary)] cursor-pointer"
                checked={currentArticles.length > 0 && currentArticles.every(a => selectedArticleIds.includes(a.id))}
                onChange={toggleSelectAll}
              />
              <span>Title & Date</span>
              <span>Template</span>
              <span>Sources</span>
              <span className="text-center">QC Score</span>
              <span className="text-center">Status</span>
              <span className="text-center">Actions</span>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-[var(--border-default)] min-h-[400px]">
              {currentArticles.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                  <span className="text-4xl opacity-50 mb-3">📭</span>
                  <p className="text-[var(--text-muted)] text-sm">Không tìm thấy bài viết nào phù hợp với bộ lọc.</p>
                </div>
              ) : (
                currentArticles.map((article, index) => (
                  <div
                    key={article.id}
                    onClick={() => { setActiveArticle(article); setViewMode(getViewModeForTemplate(article.templateId)); }}
                    className="grid grid-cols-[40px_1fr_120px_90px_140px_100px_160px] gap-4 px-5 py-4 items-center hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors duration-200 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Checkbox */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-[var(--border-default)] bg-[var(--bg-card-hover)] checked:bg-[var(--lc-primary)] cursor-pointer"
                        checked={selectedArticleIds.includes(article.id)}
                        onChange={(e) => toggleSelection(article.id, e as any)}
                      />
                    </div>

                  {/* Title */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {article.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 min-w-0">
                      <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-card-hover)] px-1.5 py-0.5 rounded shrink-0">
                        {article.createdAt}
                      </span>
                      {(article as any).createdByName && (
                        <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0" title="Người tạo bài">
                          ✍️ {(article as any).createdByName}
                        </span>
                      )}
                      {(article as any).assignedBsName && (
                        <span className="text-[10px] text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0" title="Bác sĩ phụ trách duyệt">
                          🩺 {(article as any).assignedBsName}
                        </span>
                      )}
                      {(article as any).assignedCtvName && (
                        <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0" title="CTV phụ trách viết">
                          👤 {(article as any).assignedCtvName}
                        </span>
                      )}
                      <p className="text-[11px] text-[var(--text-muted)] truncate flex-1 leading-snug">
                        {article.sapo?.slice(0, 50)}...
                      </p>
                    </div>
                  </div>

                  {/* Template */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[var(--lc-primary)]/10 text-[var(--lc-primary)] flex items-center justify-center text-[10px] font-bold">
                      {article.templateName.charAt(0)}
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] truncate">
                      {article.templateName}
                    </span>
                  </div>

                  {/* Source / Citation Panel */}
                  <div className="flex flex-col gap-1 relative group/cit">
                    {article.citationReport && article.citationReport.total_citations > 0 ? (
                      <>
                        <div className="text-[10px] font-medium flex items-center gap-1 cursor-help">
                          <span className="text-emerald-400" title="Từ KB nội bộ">📚 {article.citationReport.from_kb}</span>
                          <span className="text-[var(--text-muted)]">·</span>
                          <span className="text-blue-400" title="AI tự lấy nguồn ngoài">🌐 {article.citationReport.from_external}</span>
                          {article.citationReport.unverified > 0 && (
                             <>
                               <span className="text-[var(--text-muted)]">·</span>
                               <span className="text-red-400 animate-pulse font-bold flex items-center gap-0.5" title={`${article.citationReport.unverified} nguồn rác/chưa duyệt`}>
                                  ⚠️ {article.citationReport.unverified}
                               </span>
                             </>
                          )}
                        </div>
                        
                        {/* Tooltip for Citation Breakdown */}
                        <div className="absolute top-full mt-2 left-0 opacity-0 group-hover/cit:opacity-100 pointer-events-none transition-opacity duration-200 z-10 w-72">
                          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] p-3 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-left flex flex-col gap-2 relative">
                            <div className="absolute -top-1.5 left-4 w-3 h-3 rotate-45 border-l border-t border-[var(--border-default)] bg-[var(--bg-elevated)]" />
                            <div className="font-bold text-[11px] text-[var(--text-primary)] border-b border-[var(--border-default)] pb-1 mb-1 relative z-10">
                              Báo Cáo Trích Dẫn & Nguồn
                            </div>
                            <div className="text-[10px] space-y-1 relative z-10">
                              <p className="text-emerald-400">✅ {article.citationReport.from_kb} nguồn từ Knowledge Base</p>
                              <p className="text-blue-400">🌐 {article.citationReport.from_external} nguồn AI khai thác ngoài</p>
                              {article.citationReport.unverified > 0 && (
                                 <p className="text-red-400 font-bold bg-red-400/10 p-1.5 rounded mt-2 border border-red-400/30">
                                    ⚠️ Phát hiện {article.citationReport.unverified} nguồn CHƯA KIỂM ĐỊNH (AI hallucination/ngoài whitelist):
                                 </p>
                              )}
                            </div>
                            {article.citationReport.transparency_notes && article.citationReport.transparency_notes.map((note: string, i: number) => (
                               <div key={i} className={`text-[9px] mt-1 border-t border-[var(--border-default)] pt-1 leading-relaxed break-words ${note.includes('CẢNH BÁO') ? 'text-red-300 font-medium' : 'text-[var(--text-muted)]'}`}>
                                 {note}
                               </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
                          🔗 {article.references?.length || 0}
                          <span className="text-[var(--text-muted)] text-[10px]">nguồn</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* QC Score Column */}
                  <div className="text-center relative flex flex-col items-center gap-1 group/tooltip">
                    {article.qcScore !== undefined ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                            article.qcGrade === 'A' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            article.qcGrade === 'B' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                            article.qcGrade === 'C' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                            article.qcGrade === 'D' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                            'bg-red-500/15 text-red-400 border-red-500/30'
                          }`}>
                            {article.qcGrade}
                          </span>
                          <span className={`text-sm font-bold ${
                            article.qcScore >= 90 ? 'text-emerald-400' :
                            article.qcScore >= 80 ? 'text-emerald-300' :
                            article.qcScore >= 70 ? 'text-amber-400' :
                            article.qcScore >= 60 ? 'text-orange-400' :
                            'text-red-400'
                          }`}>
                            {article.qcScore}
                          </span>
                        </div>
                        {/* Chú giải QC — giải thích tại sao chấm số đó */}
                        <p className="text-[8px] text-[var(--text-muted)] leading-tight max-w-[140px] truncate" title={buildScoreExplanation(article)}>
                          {buildScoreExplanation(article)}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px]">
                          {(article.qcAutoFixes || 0) > 0 && (
                            <span className="text-blue-400">✓{article.qcAutoFixes} fix</span>
                          )}
                          {(article.qcManualIssues || 0) > 0 && (
                            <span className="text-amber-400">⚠{article.qcManualIssues}</span>
                          )}
                          {article.qcSyncBlocked && (
                            <span className="text-red-400 font-bold">🚫</span>
                          )}
                        </div>
                        {/* Safety Decision badge */}
                        {article.qcDecision && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5 ${
                            article.qcDecision === 'SAFE_TO_PUBLISH' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            article.qcDecision === 'REVIEW' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            article.qcDecision === 'NEEDS_REVISION' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {article.qcDecision === 'SAFE_TO_PUBLISH' ? '🛡️ SAFE' :
                             article.qcDecision === 'REVIEW' ? '⚠️ REVIEW' :
                             article.qcDecision === 'NEEDS_REVISION' ? '🔧 REVISION' :
                             '❌ REJECT'}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center justify-center px-3 h-10 rounded-xl text-[10px] font-bold bg-[var(--bg-card-hover)] text-[var(--text-muted)] border border-[var(--border-default)] shadow-sm whitespace-nowrap">
                        Chưa chấm
                      </span>
                    )}
                  </div>

                  {/* Status — shows workflowStatus (from RBAC) with fallback to legacy status */}
                  <div className="text-center flex flex-col items-center gap-1.5">
                    {regeneratingIds.has(article.id) ? (
                      <span className="status-badge bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        Đang tạo lại...
                      </span>
                    ) : article.syncedAt ? (
                      <span className="status-badge bg-violet-500/15 text-violet-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                        Đã Synced
                      </span>
                    ) : (() => {
                      const wfStatus = ((article as any).workflowStatus || 'draft') as WorkflowStatus;
                      const wfLabel = WORKFLOW_STATUS_LABEL[wfStatus] || wfStatus;
                      const wfColor = WORKFLOW_STATUS_COLOR[wfStatus] || 'text-slate-400 bg-slate-500/15';
                      return (
                        <span className={`status-badge ${wfColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            wfStatus === 'draft' ? 'bg-slate-400' :
                            wfStatus === 'pending_bs_review' ? 'bg-amber-400' :
                            wfStatus === 'under_review' ? 'bg-blue-400' :
                            wfStatus === 'needs_revision' ? 'bg-orange-400' :
                            wfStatus === 'cta_pending' ? 'bg-violet-400' :
                            wfStatus === 'published' ? 'bg-emerald-400' :
                            'bg-red-400'
                          }`} />
                          {wfLabel}
                        </span>
                      );
                    })()}
                    {/* QC status fallback for articles not yet in workflow */}
                    {!(article as any).workflowStatus && article.status !== 'pending_review' && (
                      <span className="text-[9px] text-[var(--text-muted)]">
                        QC: {article.status}
                      </span>
                    )}
                  </div>

                  {/* Actions — workflow buttons + edit */}
                  <div className="flex items-center justify-center gap-1.5 relative" onClick={(e) => e.stopPropagation()}>
                    {(() => {
                      const wfStatus = ((article as any).workflowStatus || 'draft') as WorkflowStatus;
                      const role = user?.role as Role;
                      const buttons: React.ReactNode[] = [];

                      // Submit Action (draft/needs_revision → pending_bs_review)
                      const isCreator = (article as any).createdBy === user?.id;
                      const isAssignee = (article as any).assignedCtvId === user?.id;
                      const hasAssignee = !!(article as any).assignedCtvId;
                      
                      let canSubmit = false;
                      if (wfStatus === 'draft' || wfStatus === 'needs_revision') {
                        if (role === 'ctv' && (isCreator || isAssignee)) canSubmit = true;
                        if (role === 'btv' && (!hasAssignee || isAssignee)) canSubmit = true;
                        if (role === 'lead' || role === 'superadmin') canSubmit = true;
                      }

                      if (canSubmit) {
                        buttons.push(
                          <button key="submit" onClick={() => handleWorkflowAction(article.id, 'submit')}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors" title="Nộp bài lên hàng đợi duyệt">
                            📤 Nộp
                          </button>
                        );
                      }

                      // BS: Cấp thực thi cơ bản (chỉ xử lý bài được assign, under_review)
                      if (role === 'bs' && wfStatus === 'under_review') {
                        buttons.push(
                          <button key="approve" onClick={() => handleWorkflowAction(article.id, 'approve')}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors" title="Duyệt bài">
                            ✅ Duyệt
                          </button>
                        );
                        buttons.push(
                          <button key="request_revision" onClick={() => {
                            const note = prompt('Ghi chú điều chỉnh cho CTV:');
                            if (!note) return;
                            handleWorkflowAction(article.id, 'request_revision', {
                              rejectionReason: note,
                              inlineComments: [{ note }],
                              revisionChecklist: [{ item: note, done: false }],
                            });
                          }}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors border border-amber-500/20" title="Yêu cầu CTV điều chỉnh — bài sẽ quay lại đúng BS này sau khi sửa">
                            ✏️ Điều chỉnh
                          </button>
                        );
                        buttons.push(
                          <button key="reject" onClick={() => handleWorkflowAction(article.id, 'reject')}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" title="Từ chối bài hoàn toàn">
                            ❌ Trả
                          </button>
                        );
                      }

                      // HĐYK: Cấp quản lý y khoa (Quyền duyệt cao hơn/mở rộng hơn so với BS)
                      const isManagerRole = role === 'hdyk' || role === 'lead' || role === 'superadmin';
                      if (isManagerRole && (wfStatus === 'under_review' || wfStatus === 'pending_bs_review' || wfStatus === 'needs_revision')) {
                        buttons.push(
                          <button key="override_approve" onClick={() => handleWorkflowAction(article.id, 'override_approve')}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors border border-purple-500/30" title="Phê duyệt vượt cấp (HĐYK)">
                            👑 Duyệt (HĐYK)
                          </button>
                        );
                      }
                      
                      if (isManagerRole && wfStatus === 'under_review') {
                         buttons.push(
                           <button key="reject" onClick={() => handleWorkflowAction(article.id, 'reject')}
                             className="text-[10px] font-bold px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" title="Từ chối bài">
                             ❌ Trả
                           </button>
                         );
                      }

                      // BTV: Assign CTV (single article)
                      if ((role === 'btv' || role === 'lead' || role === 'superadmin') && 
                          (wfStatus === 'draft' || wfStatus === 'needs_revision')) {
                        buttons.push(
                          <button key="assign-ctv" onClick={() => openAssignModal([article.id], 'ctv')}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors" title="Assign cho CTV">
                            👤 CTV
                          </button>
                        );
                      }

                      // HĐYK: Assign BS (pending_bs_review → under_review)
                      if ((role === 'hdyk' || role === 'lead' || role === 'superadmin') && wfStatus === 'pending_bs_review') {
                        buttons.push(
                          <button key="assign-bs" onClick={() => openAssignModal([article.id], 'bs')}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors" title="Assign cho BS">
                            🩺 BS
                          </button>
                        );
                      }

                      // Publish Action (cta_pending → published)
                      let canPublish = false;
                      if (wfStatus === 'cta_pending') {
                        if (role === 'ctv' && (isCreator || isAssignee)) canPublish = true;
                        if (role === 'btv' && (!hasAssignee || isAssignee)) canPublish = true;
                        if (role === 'lead' || role === 'superadmin') canPublish = true;
                      }

                      if (canPublish) {
                        buttons.push(
                          <button key="publish" onClick={() => handleWorkflowAction(article.id, 'publish')}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors" title="Xuất bản">
                            🚀 Publish
                          </button>
                        );
                      }

                      // Export DOCX button — always visible
                      buttons.push(
                        <button key="export-docx"
                          onClick={() => handleExportSingle(article.id)}
                          disabled={exportingSingleId === article.id}
                          className="text-[10px] font-medium px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50" title="Export DOCX">
                          {exportingSingleId === article.id ? <span className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin inline-block" /> : '📄'}
                        </button>
                      );

                      // Edit button — always visible
                      buttons.push(
                        <button key="edit"
                          onClick={() => { setActiveArticle(article); setViewMode(getViewModeForTemplate(article.templateId)); }}
                          className="text-[10px] font-medium px-2 py-1 rounded bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="Xem / Chỉnh sửa">
                          ✏️
                        </button>
                      );

                      // Delete button — restricted by role
                      if (user && (['superadmin', 'lead', 'btv'].includes(user.role) || (article as any).createdBy === user.id)) {
                        buttons.push(
                          <button key="delete"
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa bài viết "${article.title}" không? Hành động này không thể hoàn tác.`)) {
                                executeDelete(article.id);
                              }
                            }}
                            className="text-[10px] font-medium px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Xóa bài viết">
                            🗑️
                          </button>
                        );
                      }

                      return buttons;
                    })()}
                  </div>
                </div>
              )))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-card-hover)]">
                <span className="text-[#8b949e] text-xs">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredArticles.length)} trong {filteredArticles.length} bài
                </span>
                <div className="flex gap-1">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="w-8 h-8 rounded flex items-center justify-center text-xs hover:bg-[var(--bg-card-hover)] disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                        currentPage === idx + 1 
                          ? 'bg-[var(--lc-primary)] text-[var(--text-primary)]' 
                          : 'hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="w-8 h-8 rounded flex items-center justify-center text-xs hover:bg-[var(--bg-card-hover)] disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ─── Assign Modal ──────────────────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 animate-fade-in" style={{ animationDuration: '200ms' }}>
          <div className="w-full max-w-md bg-[#161b22] rounded-2xl border border-[var(--border-default)] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {assignType === 'ctv' ? '👤 Assign CTV' : '🩺 Assign BS'}
              </h2>
              <button onClick={() => setShowAssignModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg">✕</button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Chọn {assignType === 'ctv' ? 'Cộng tác viên' : 'Bác sĩ'} để assign {assignTargetIds.length} bài viết
            </p>
            {assignLoading ? (
              <div className="py-8 text-center text-sm text-[var(--text-muted)]">Đang tải danh sách...</div>
            ) : assignableUsers.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                Không tìm thấy {assignType === 'ctv' ? 'CTV' : 'BS'} nào. Hãy tạo tài khoản trước.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {assignableUsers.map((u: any) => (
                  <button
                    key={u.id}
                    onClick={() => executeAssign(u.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border-default)] hover:border-[var(--lc-primary)]/50 hover:bg-[var(--bg-card-hover)] transition-all group text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                      {u.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--lc-primary)] truncate">{u.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[var(--text-muted)]">{u.email}</span>
                        {u.specialties?.length > 0 && (
                          <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded">{u.specialties.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-[var(--text-muted)]">Đang xử lý</p>
                      <p className={`text-sm font-bold ${(u.currentLoad || 0) > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {u.currentLoad || 0} bài
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Auto Assign Preview Modal ───────────────────────── */}
      {showAutoAssignPreview && (
        <AutoAssignPreviewModal
          articleIds={selectedArticleIds}
          onClose={() => setShowAutoAssignPreview(false)}
          onConfirm={handleAutoAssignConfirm}
        />
      )}

    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-white">Loading...</div>}>
      <ReviewQueueContent />
    </Suspense>
  );
}
