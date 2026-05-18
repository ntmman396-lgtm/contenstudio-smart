"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Settings, Plus, Save, AlertTriangle, 
  ShieldCheck, Info, Search, Filter, Play, CheckCircle, 
  Edit2, ShieldAlert, X, Globe, Clock, Trash2, RotateCcw
} from 'lucide-react';
import { 
  MOCK_RULE_SECTIONS, 
  MOCK_DOMAIN_CONFIGS, 
  MOCK_CHANGE_LOGS,
} from '@/lib/mock-rules-data';
import {
  getSubDimensions,
  type UnifiedRule,
  type RuleSeverity,
} from '@/lib/qc/rule-registry';

// --- SUB-COMPONENTS ---

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, any> = {
    critical: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: ShieldAlert },
    warning: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertTriangle },
    info: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Info },
  };
  const config = map[severity.toLowerCase()] || map.info;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {severity.toUpperCase()}
    </span>
  );
}

function SubDimensionLabel({ sub }: { sub: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    format: { label: 'Định dạng', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
    link: { label: 'Liên kết', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
    image: { label: 'Hình ảnh', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
    seo: { label: 'SEO', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    accuracy: { label: 'Chính xác', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
    depth: { label: 'Độ sâu', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
    citation: { label: 'Trích dẫn', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
    tone: { label: 'Tone', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  };
  const cfg = labels[sub] || { label: sub, color: 'bg-gray-100 text-gray-600' };
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.color}`}>{cfg.label}</span>;
}

// --- MAIN PAGE ---

export default function RulesManagerPage() {
  // State — reads from unified registry
  const [sections] = useState(MOCK_RULE_SECTIONS);
  const [rules, setRules] = useState<UnifiedRule[]>([]);
  const [domains, setDomains] = useState(MOCK_DOMAIN_CONFIGS);
  
  const [selectedSectionCode, setSelectedSectionCode] = useState('TECH');
  const [selectedRuleCode, setSelectedRuleCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSub, setFilterSub] = useState<string | null>(null);
  
  const [activeBottomTab, setActiveBottomTab] = useState<'NONE'|'CHANGELOG'|'SIMULATOR'>('NONE');
  const [modalState, setModalState] = useState<'NONE'|'DOMAIN'|'TEST'|'NEW_RULE'>('NONE');

  // New rule form
  const [newRuleForm, setNewRuleForm] = useState({
    code: '', name: '', description: '',
    section: 'TECH' as 'TECH' | 'CONTENT',
    sub_dimension: 'format',
    deduction: 3, max_deduction: 10,
    severity: 'warning' as RuleSeverity,
    is_active: true,
    auto_fixable: false, fix_instruction: '',
    check_type: 'structural',
    applies_to: ['*'] as string[],
  });

  // Refresh rules from API
  const refreshRules = useCallback(async () => {
    try {
      const res = await fetch('/api/qc-rules');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRules(data);
      }
    } catch (error) {
      console.error('Failed to fetch rules', error);
    }
  }, []);

  useEffect(() => {
    refreshRules();
  }, [refreshRules]);

  // Derived state
  const subDimensions = useMemo(() => getSubDimensions(selectedSectionCode as 'TECH' | 'CONTENT'), [selectedSectionCode]);

  const displayedRules = useMemo(() => {
    let filtered = rules.filter(r => r.section === selectedSectionCode);
    if (filterSub) {
      filtered = filtered.filter(r => r.sub_dimension === filterSub);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
    }
    return filtered;
  }, [rules, selectedSectionCode, searchQuery, filterSub]);

  const activeRuleConfig = useMemo(() => {
    return rules.find(r => r.code === selectedRuleCode) || null;
  }, [rules, selectedRuleCode]);

  // Edit state for detail panel
  const [editDeduction, setEditDeduction] = useState<number>(0);
  const [editMaxDeduction, setEditMaxDeduction] = useState<number>(0);
  const [editSeverity, setEditSeverity] = useState<string>('warning');
  const [editAutoFixable, setEditAutoFixable] = useState<boolean>(false);
  const [editFixInstruction, setEditFixInstruction] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editName, setEditName] = useState<string>('');

  // Load edit state when selecting a rule
  const handleSelectRule = (code: string) => {
    setSelectedRuleCode(code);
    const rule = rules.find(r => r.code === code);
    if (rule) {
      setEditDeduction(rule.deduction);
      setEditMaxDeduction(rule.max_deduction);
      setEditSeverity(rule.severity);
      setEditAutoFixable(rule.auto_fixable);
      setEditFixInstruction(rule.fix_instruction);
      setEditDescription(rule.description);
      setEditName(rule.name);
    }
  };

  // Handlers
  const handleToggleRule = async (code: string) => {
    const rule = rules.find(r => r.code === code);
    if (!rule) return;
    
    // Optimistic update
    setRules(prev => prev.map(r => r.code === code ? { ...r, is_active: !r.is_active } : r));
    
    await fetch('/api/qc-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rule, is_active: !rule.is_active })
    });
    refreshRules();
  };
  
  const handleSaveRule = async () => {
    if (!selectedRuleCode) return;
    const rule = rules.find(r => r.code === selectedRuleCode);
    if (!rule) return;

    await fetch('/api/qc-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...rule,
        name: editName,
        description: editDescription,
        deduction: editDeduction,
        max_deduction: editMaxDeduction,
        severity: editSeverity as RuleSeverity,
        auto_fixable: editAutoFixable,
        fix_instruction: editFixInstruction,
      })
    });
    refreshRules();
    alert("✅ Đã lưu thay đổi rule — sẽ áp dụng cho lần QC tiếp theo");
  };

  const handleDeleteRule = async (code: string) => {
    if (!confirm(`Xóa rule "${code}"? Hành động này không thể hoàn tác.`)) return;
    const rule = rules.find(r => r.code === code);
    if (rule?.is_system) {
      alert("Không thể xóa System Rule");
      return;
    }
    await fetch(`/api/qc-rules?code=${code}`, { method: 'DELETE' });
    setSelectedRuleCode(null);
    refreshRules();
  };

  const handleAddRule = async () => {
    if (rules.some(r => r.code === newRuleForm.code)) {
      alert("Lỗi: Rule code đã tồn tại!");
      return;
    }
    await fetch('/api/qc-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newRuleForm, is_system: false })
    });
    refreshRules();
    setModalState('NONE');
    setNewRuleForm({
      code: '', name: '', description: '',
      section: 'TECH', sub_dimension: 'format',
      deduction: 3, max_deduction: 10,
      severity: 'warning', is_active: true,
      auto_fixable: false, fix_instruction: '',
      check_type: 'structural', applies_to: ['*'],
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-gray-50 dark:bg-gray-900">
      
      {/* HEADER */}
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Settings className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Rules Engine Manager
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Cấu hình bộ luật kiểm duyệt nội dung — 
            <span className="font-medium text-indigo-600 dark:text-indigo-400"> Đồng bộ trực tiếp với QC Engine</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveBottomTab(activeBottomTab === 'CHANGELOG' ? 'NONE' : 'CHANGELOG')}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${activeBottomTab === 'CHANGELOG' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}>
            <Clock className="w-4 h-4 inline-block mr-2" /> Change Log
          </button>
          <button 
            onClick={() => setActiveBottomTab(activeBottomTab === 'SIMULATOR' ? 'NONE' : 'SIMULATOR')}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${activeBottomTab === 'SIMULATOR' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}>
            <CheckCircle className="w-4 h-4 inline-block mr-2" /> Score Simulator
          </button>
        </div>
      </div>

      {/* MID SECTION - 3 COLUMNS */}
      <div className="flex-1 grid grid-cols-[220px_1fr_380px] overflow-hidden">
        
        {/* COLUMN 1: Sections + Sub-dimension filter */}
        <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rule Sections</span>
          </div>
          <div className="p-2 space-y-1">
            {sections.map(sec => {
              const sectionRules = rules.filter(r => r.section === sec.code);
              const activeCount = sectionRules.filter(r => r.is_active).length;
              const totalCount = sectionRules.length;
              const isSelected = selectedSectionCode === sec.code;
              
              return (
                <button
                  key={sec.id}
                  onClick={() => { setSelectedSectionCode(sec.code); setSelectedRuleCode(null); setFilterSub(null); }}
                  className={`w-full text-left px-3 py-3 rounded-lg flex flex-col gap-1 transition-colors ${
                    isSelected 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {sec.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 py-0.5 px-2 bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                      Active: {activeCount}/{totalCount}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          
          {/* Sub-dimension filter */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <div className="px-3 py-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nhóm con</span>
            </div>
            <button
              onClick={() => setFilterSub(null)}
              className={`w-full text-left px-3 py-1.5 rounded text-xs font-medium transition-colors ${!filterSub ? 'text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50'}`}
            >
              Tất cả
            </button>
            {subDimensions.map(sub => {
              const count = rules.filter(r => r.section === selectedSectionCode && r.sub_dimension === sub).length;
              return (
                <button
                  key={sub}
                  onClick={() => setFilterSub(filterSub === sub ? null : sub)}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs font-medium transition-colors flex justify-between items-center ${filterSub === sub ? 'text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50'}`}
                >
                  <SubDimensionLabel sub={sub} />
                  <span className="text-gray-400 text-[10px]">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: Rules List */}
        <div className="bg-gray-50 dark:bg-gray-900 overflow-y-auto flex flex-col border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm rule theo code, tên..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            {displayedRules.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">Không tìm thấy rule nào</div>
            ) : (
              <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-3 py-3 font-medium text-center w-12">ON/OFF</th>
                    <th className="px-3 py-3 font-medium">Code & Tên</th>
                    <th className="px-3 py-3 font-medium text-center">Nhóm</th>
                    <th className="px-3 py-3 font-medium text-center">Severity</th>
                    <th className="px-3 py-3 font-medium text-center">Auto-fix</th>
                    <th className="px-3 py-3 font-medium text-center">Trừ điểm</th>
                    <th className="px-3 py-3 font-medium text-center">Max</th>
                    <th className="px-3 py-3 font-medium text-center w-16">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {displayedRules.map(rule => (
                    <tr 
                      key={rule.code} 
                      onClick={() => handleSelectRule(rule.code)}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${selectedRuleCode === rule.code ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''} ${!rule.is_active ? 'opacity-50' : ''}`}
                    >
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleToggleRule(rule.code)}
                          className={`w-10 h-5 rounded-full relative transition-colors ${rule.is_active ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                          <span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${rule.is_active ? 'translate-x-5' : 'translate-x-0'}`}></span>
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-mono text-xs text-gray-500 dark:text-gray-400 mb-0.5">{rule.code}</div>
                        <div className="font-medium text-gray-900 dark:text-white line-clamp-1 text-xs">{rule.name}</div>
                      </td>
                      <td className="px-3 py-3 text-center"><SubDimensionLabel sub={rule.sub_dimension} /></td>
                      <td className="px-3 py-3 text-center"><SeverityBadge severity={rule.severity} /></td>
                      <td className="px-3 py-3 text-center">
                        {rule.auto_fixable ? <span className="text-green-600 dark:text-green-400 font-medium text-xs">Yes</span> : <span className="text-gray-400 text-xs">-</span>}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-xs font-semibold text-red-600 dark:text-red-400">-{rule.deduction}</td>
                      <td className="px-3 py-3 text-center font-mono text-xs text-gray-500">-{rule.max_deduction}</td>
                      <td className="px-3 py-3 text-center">
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                          <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* COLUMN 3: Details Pane */}
        <div className="bg-white dark:bg-gray-800 overflow-y-auto">
          {activeRuleConfig ? (
            <div className="p-5 flex flex-col h-full">
              <div className="mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Chi tiết Rule</h3>
                <div className="flex items-center gap-2 mt-2">
                  {activeRuleConfig.is_system && (
                    <div className="inline-flex items-center px-2.5 py-1.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800">
                      <ShieldCheck className="w-4 h-4 mr-1 pb-0.5" /> System Rule
                    </div>
                  )}
                  <SubDimensionLabel sub={activeRuleConfig.sub_dimension} />
                </div>
              </div>
              
              <div className="space-y-4 flex-1">
                {/* Rule Code (readonly) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rule Code</label>
                  <div className="w-full p-2 border rounded-md text-sm font-mono bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700">
                    {activeRuleConfig.code}
                  </div>
                </div>

                {/* Rule Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tên Rule</label>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)}
                    readOnly={activeRuleConfig.is_system} 
                    className={`w-full p-2 border rounded-md text-sm ${activeRuleConfig.is_system ? 'bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800'} dark:border-gray-700 focus:ring-1 focus:ring-indigo-500`} 
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mô tả</label>
                  <textarea 
                    value={editDescription} 
                    onChange={e => setEditDescription(e.target.value)}
                    readOnly={activeRuleConfig.is_system} 
                    rows={2} 
                    className={`w-full p-2 border rounded-md text-sm ${activeRuleConfig.is_system ? 'bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800'} dark:border-gray-700 focus:ring-1 focus:ring-indigo-500`} 
                  />
                </div>

                {/* Deduction & Max */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Điểm trừ / lần vi phạm</label>
                    <input 
                      type="number" 
                      value={editDeduction} 
                      onChange={e => setEditDeduction(Number(e.target.value))}
                      min={0} max={50}
                      className="w-full p-2 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-700 focus:ring-1 focus:ring-indigo-500 font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Max Deduction (cap)</label>
                    <input 
                      type="number" 
                      value={editMaxDeduction} 
                      onChange={e => setEditMaxDeduction(Number(e.target.value))}
                      min={0} max={100}
                      className="w-full p-2 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-700 focus:ring-1 focus:ring-indigo-500 font-mono" 
                    />
                  </div>
                </div>

                {/* Info about how deduction works */}
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md text-xs text-amber-800 dark:text-amber-300">
                  💡 Khi vi phạm rule này, QC engine trừ <strong>{editDeduction}</strong> điểm / lần, tối đa trừ <strong>{editMaxDeduction}</strong> điểm.
                  <br/>Thay đổi ở đây sẽ <strong>áp dụng ngay</strong> cho lần QC tiếp theo.
                </div>

                {/* Behaviors */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Rule Behaviors</label>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={editAutoFixable} 
                        onChange={e => setEditAutoFixable(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 bg-white" 
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-fixable (Có thể tự sửa)</span>
                    </label>
                    {editAutoFixable && (
                      <div className="pl-6 pt-1">
                        <label className="block text-xs text-gray-500 mb-1">Hướng dẫn fix (Dành cho AI):</label>
                        <textarea 
                          value={editFixInstruction} 
                          onChange={e => setEditFixInstruction(e.target.value)}
                          rows={2} 
                          className="w-full p-2 border rounded-md text-xs bg-white dark:bg-gray-800 dark:border-gray-700 font-mono" 
                        />
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <label className="block text-xs text-gray-500 mb-1">Severity / Mức độ</label>
                      <select 
                        value={editSeverity} 
                        onChange={e => setEditSeverity(e.target.value)}
                        className="w-full p-2 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-700 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="critical">Critical (Block sync)</option>
                        <option value="warning">Warning (Trừ điểm)</option>
                        <option value="info">Info (Auto-fix or note)</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Applies to */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Applies To Targets</label>
                  <div className="p-2 border rounded-md bg-gray-50 dark:bg-gray-900 dark:border-gray-700 text-sm font-mono break-words text-gray-600 dark:text-gray-400">
                    {activeRuleConfig.applies_to ? activeRuleConfig.applies_to.join(', ') : 'All (*) '}
                    <div className="mt-1 text-xs text-gray-400 font-sans italic opacity-80">Check type: {activeRuleConfig.check_type}</div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <button 
                  onClick={handleSaveRule}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center font-medium transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" /> Lưu Thay Đổi → QC Engine
                </button>
                {!activeRuleConfig.is_system && (
                  <button 
                    onClick={() => handleDeleteRule(activeRuleConfig.code)}
                    className="w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg flex items-center justify-center text-sm font-medium transition-colors dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 dark:border-red-800"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Xóa Rule
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center bg-gray-50/50 dark:bg-gray-800/10">
              <Settings className="w-16 h-16 mb-4 text-gray-200 dark:text-gray-700" />
              <p className="text-sm">Chọn một rule từ danh sách ở giữa để xem chi tiết và chỉnh sửa.</p>
              <p className="text-xs mt-2 text-gray-300 dark:text-gray-600">Mọi thay đổi sẽ đồng bộ trực tiếp với QC Engine.</p>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SIMULATOR & CHANGELOG TABS */}
      {activeBottomTab !== 'NONE' && (
        <div className="h-64 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col shrink-0">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
            <h3 className="font-semibold text-sm flex items-center">
               {activeBottomTab === 'CHANGELOG' ? <><Clock className="w-4 h-4 mr-2" /> Lịch sử thay đổi Rule</> : <><CheckCircle className="w-4 h-4 mr-2" /> Score & Rule Simulator</>}
            </h3>
            <button onClick={() => setActiveBottomTab('NONE')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activeBottomTab === 'CHANGELOG' && (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900">
                  <tr><th className="px-4 py-2">Thời gian</th><th className="px-4 py-2">Rule Code</th><th className="px-4 py-2">Hành động</th><th className="px-4 py-2">Người duyệt</th><th className="px-4 py-2">Chi tiết</th></tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {MOCK_CHANGE_LOGS.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-2 whitespace-nowrap text-gray-500">{log.time}</td>
                      <td className="px-4 py-2 font-mono text-xs font-semibold">{log.rule_code}</td>
                      <td className="px-4 py-2"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded dark:bg-blue-900/50 dark:text-blue-300 text-xs">{log.change_type}</span></td>
                      <td className="px-4 py-2">{log.changed_by}</td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400 text-xs italic">{log.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {activeBottomTab === 'SIMULATOR' && (
              <div className="flex gap-8 max-w-4xl">
                <div className="w-1/2">
                  <h4 className="text-sm font-semibold mb-2">Tổng điểm hệ thống đang phân bổ</h4>
                  <p className="text-xs text-gray-500 mb-4">Tổng max deduction cho các rule active theo từng section.</p>
                  
                  <div className="space-y-2 text-sm">
                    {sections.map(sec => {
                       const sectionRules = rules.filter(r => r.section === sec.code && r.is_active);
                       const maxScore = sectionRules.reduce((sum, r) => sum + r.max_deduction, 0);
                       const subGroups = [...new Set(sectionRules.map(r => r.sub_dimension))];
                       return (
                         <div key={sec.code} className="py-1">
                           <div className="flex justify-between items-center">
                             <span className="text-gray-600 dark:text-gray-300 font-medium">{sec.name}</span>
                             <span className="font-mono text-red-500 font-medium whitespace-nowrap">Max: -{maxScore}</span>
                           </div>
                           <div className="flex gap-2 mt-1 flex-wrap">
                             {subGroups.map(sub => {
                               const subMax = sectionRules.filter(r => r.sub_dimension === sub).reduce((s, r) => s + r.max_deduction, 0);
                               return <span key={sub} className="text-[10px] text-gray-400 font-mono">{sub}: -{subMax}</span>;
                             })}
                           </div>
                         </div>
                       )
                    })}
                  </div>
                </div>
                <div className="w-1/2 flex flex-col items-center justify-center border-l dark:border-gray-700 pl-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{rules.filter(r => r.is_active).length}</div>
                    <p className="text-sm text-gray-500 mt-1">Active Rules</p>
                    <p className="text-xs text-gray-400 mt-2">Tổng: {rules.length} rules ({rules.filter(r => r.is_system).length} system + {rules.filter(r => !r.is_system).length} custom)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM ACTIONS BAR */}
      <div className="h-16 px-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <div className="text-xs text-gray-400">
          {rules.filter(r => r.is_active).length}/{rules.length} rules active • Đồng bộ QC Engine ✓
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setModalState('NEW_RULE')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg flex items-center transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm Rule Mới
          </button>
          
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 self-center mx-1"></div>
          
          <button 
            onClick={() => setModalState('DOMAIN')}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg flex items-center transition-colors shadow-sm"
          >
            <Globe className="w-4 h-4 mr-2" /> Cấu Hình Domains Đích
          </button>
          
          <button 
            onClick={() => setModalState('TEST')}
            className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400 text-sm font-medium rounded-lg flex items-center transition-colors shadow-sm"
          >
             <Play className="w-4 h-4 mr-2" /> Sandbox Test
          </button>
        </div>
      </div>

      {/* MODALS OVERLAYS */}
      {modalState !== 'NONE' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex py-10 justify-center">
          <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-full border border-gray-200 dark:border-gray-700 overflow-hidden transform scale-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                {modalState === 'DOMAIN' && <><Globe className="w-5 h-5 mr-2 text-indigo-500" /> Quản lý danh sách Domain (Global Config)</>}
                {modalState === 'TEST' && <><Play className="w-5 h-5 mr-2 text-emerald-500" /> Testing Sandbox (Single Rule)</>}
                {modalState === 'NEW_RULE' && <><Plus className="w-5 h-5 mr-2 text-indigo-500" /> Tạo Rule Mới</>}
              </h2>
              <button onClick={() => setModalState('NONE')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {/* DOMAIN CONFIG MODAL */}
              {modalState === 'DOMAIN' && (
                 <div className="space-y-6">
                   <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm rounded-lg flex">
                     <Info className="w-5 h-5 mr-3 shrink-0" />
                     <p>Thay đổi ở đây sẽ cập nhật trực tiếp vào <code>rule_domain_configs</code> và tự động apply lên tất cả rule sử dụng lookup array tương ứng.</p>
                   </div>
                   {Object.entries(domains).map(([key, val]) => (
                     <div key={key}>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{key}</label>
                        <textarea 
                           className="w-full h-32 p-3 border rounded-lg text-sm font-mono bg-gray-50 dark:bg-gray-900 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                           defaultValue={JSON.stringify(val, null, 2)}
                        />
                     </div>
                   ))}
                   <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-sm float-right">Save All Configs</button>
                 </div>
              )}

              {/* TEST MODAL */}
              {modalState === 'TEST' && (
                 <div className="flex gap-6 h-full min-h-[400px]">
                   <div className="w-1/3 border-r dark:border-gray-700 pr-6 space-y-4">
                     <h3 className="font-semibold text-sm">Chọn Rule</h3>
                     <select className="w-full border p-2 rounded text-sm bg-white dark:bg-gray-800 dark:border-gray-700 h-[300px]" size={10}>
                       {rules.filter(r => r.is_active).map(r => (
                         <option key={r.code} value={r.code}>[{r.code}] {r.name}</option>
                       ))}
                     </select>
                   </div>
                   <div className="w-2/3 space-y-4 flex flex-col">
                     <h3 className="font-semibold text-sm">Input data / Dummy Content</h3>
                     <textarea placeholder="Paste html bài viết hoặc câu chữ vào đây để test..." className="w-full flex-1 p-3 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500" />
                     <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm flex items-center justify-center">
                        <Play className="w-4 h-4 mr-2" /> Run Local Evaluation
                     </button>
                   </div>
                 </div>
              )}

              {/* NEW RULE MODAL */}
              {modalState === 'NEW_RULE' && (
                 <div className="space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm rounded-lg">
                      Rule mới sẽ có <code>is_system = false</code> — có thể xóa hoặc tắt.
                      <br/>Sau khi thêm, rule sẽ <strong>tự động đồng bộ với QC Engine</strong> cho lần chạy tiếp theo.
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold uppercase mb-1">Mã Rule (Code unique, ví dụ: T-FMT-NEW hoặc C-ACC-NEW)</label>
                        <input 
                          type="text" 
                          value={newRuleForm.code}
                          onChange={e => setNewRuleForm({...newRuleForm, code: e.target.value})}
                          placeholder="T-FMT-NEW" 
                          className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 font-mono" 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold uppercase mb-1">Tên Rule</label>
                        <input 
                          type="text" 
                          value={newRuleForm.name}
                          onChange={e => setNewRuleForm({...newRuleForm, name: e.target.value})}
                          placeholder="Tên hiển thị" 
                          className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase mb-1">Section</label>
                        <select 
                          value={newRuleForm.section}
                          onChange={e => setNewRuleForm({...newRuleForm, section: e.target.value as 'TECH' | 'CONTENT'})}
                          className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                        >
                          {sections.map(s => <option value={s.code} key={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase mb-1">Sub-dimension</label>
                        <select 
                          value={newRuleForm.sub_dimension}
                          onChange={e => setNewRuleForm({...newRuleForm, sub_dimension: e.target.value})}
                          className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                        >
                          {newRuleForm.section === 'TECH' 
                            ? ['format', 'link', 'image', 'seo'].map(s => <option key={s} value={s}>{s}</option>)
                            : ['accuracy', 'depth', 'citation', 'tone'].map(s => <option key={s} value={s}>{s}</option>)
                          }
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase mb-1">Severity</label>
                        <select 
                          value={newRuleForm.severity}
                          onChange={e => setNewRuleForm({...newRuleForm, severity: e.target.value as RuleSeverity})}
                          className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                        >
                          <option value="critical">Critical</option>
                          <option value="warning">Warning</option>
                          <option value="info">Info</option>
                        </select>
                      </div>
                      <div>
                         <label className="block text-xs font-semibold uppercase mb-1">Check Type</label>
                         <select 
                           value={newRuleForm.check_type}
                           onChange={e => setNewRuleForm({...newRuleForm, check_type: e.target.value})}
                           className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                         >
                           <option value="structural">structural</option>
                           <option value="regex">regex</option>
                           <option value="custom_ai">custom_ai</option>
                         </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase mb-1">Điểm trừ / lần</label>
                        <input 
                          type="number" 
                          value={newRuleForm.deduction}
                          onChange={e => setNewRuleForm({...newRuleForm, deduction: Number(e.target.value)})}
                          className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase mb-1">Max Deduction</label>
                        <input 
                          type="number" 
                          value={newRuleForm.max_deduction}
                          onChange={e => setNewRuleForm({...newRuleForm, max_deduction: Number(e.target.value)})}
                          className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 font-mono" 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold uppercase mb-1">Mô tả</label>
                        <textarea 
                          value={newRuleForm.description}
                          onChange={e => setNewRuleForm({...newRuleForm, description: e.target.value})}
                          rows={2} 
                          placeholder="Mô tả chi tiết rule..." 
                          className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 text-sm" 
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleAddRule}
                      disabled={!newRuleForm.code || !newRuleForm.name}
                      className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm w-full transition-colors"
                    >
                      Thêm Rule → Đồng bộ QC Engine
                    </button>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
