'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_META, ASSIGNABLE_ROLES_BY } from '@/types/auth'
import type { AuthUser, Role } from '@/types/auth'

const SPECIALTIES = [
  'Tim mạch', 'Nội tiết', 'Thần kinh', 'Tiêu hóa', 'Hô hấp',
  'Cơ xương khớp', 'Da liễu', 'Mắt', 'Tai mũi họng', 'Nhi khoa',
  'Sản phụ khoa', 'Tiết niệu', 'Dinh dưỡng', 'Tâm thần', 'Ung bướu',
]

export default function UsersPage() {
  const { user: actor, can } = useAuth()
  const [users, setUsers]   = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<AuthUser | null>(null)
  const [error, setError]   = useState('')
  const [form, setForm]     = useState({
    email: '', name: '', role: '' as Role | '',
    password: '', specialties: [] as string[], capacity: '',
  })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/auth/users')
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  if (!actor || !can('create_account')) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
          Bạn không có quyền truy cập trang này.
        </main>
      </div>
    )
  }

  const assignableRoles = ASSIGNABLE_ROLES_BY[actor.role] as Role[]

  function openCreate() {
    setEditing(null)
    setForm({ email: '', name: '', role: '', password: '', specialties: [], capacity: '' })
    setError('')
    setShowModal(true)
  }

  function openEdit(u: AuthUser) {
    setEditing(u)
    setForm({
      email:      u.email,
      name:       u.name,
      role:       u.role,
      password:   '',
      specialties: u.specialties ?? [],
      capacity:   u.capacity?.toString() ?? '',
    })
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const payload: any = {
      name:       form.name,
      role:       form.role,
      specialties: form.specialties,
      capacity:   form.capacity ? parseInt(form.capacity) : null,
    }
    if (form.password) payload.password = form.password
    if (!editing)      payload.email    = form.email

    const url    = editing ? `/api/auth/users/${editing.id}` : '/api/auth/users'
    const method = editing ? 'PATCH' : 'POST'
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Lỗi'); return }
    setShowModal(false)
    fetchUsers()
  }

  async function handleDeactivate(u: AuthUser) {
    if (!confirm(`Vô hiệu hóa tài khoản "${u.name}"?`)) return
    await fetch(`/api/auth/users/${u.id}`, { method: 'DELETE' })
    fetchUsers()
  }

  async function handleReactivate(u: AuthUser) {
    await fetch(`/api/auth/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    })
    fetchUsers()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto px-6 py-6">

          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Quản lý Tài khoản</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Tạo và quản lý tài khoản cho các thành viên trong hệ thống.
              </p>
            </div>
            <button onClick={openCreate} className="btn-primary text-sm px-4 py-2">
              + Thêm tài khoản
            </button>
          </div>

          {/* Table */}
          <div className="glass-card rounded-xl border border-[var(--border-default)] overflow-hidden">
            <div className="grid grid-cols-[1fr_140px_160px_90px_100px] gap-4 px-5 py-3 border-b border-[var(--border-default)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-surface)]">
              <span>Thành viên</span>
              <span>Role</span>
              <span>Chuyên khoa (BS)</span>
              <span className="text-center">Trạng thái</span>
              <span className="text-center">Hành động</span>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-[var(--text-muted)]">Đang tải...</div>
            ) : users.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--text-muted)]">Chưa có tài khoản nào.</div>
            ) : (
              <div className="divide-y divide-[var(--border-default)]">
                {users.map(u => {
                  const meta = ROLE_META[u.role]
                  const canEdit = assignableRoles.includes(u.role) || actor.role === 'superadmin'
                  return (
                    <div key={u.id} className="grid grid-cols-[1fr_140px_160px_90px_100px] gap-4 px-5 py-3 items-center hover:bg-[var(--bg-card-hover)] transition-colors">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{u.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] truncate">
                        {u.role === 'bs' && u.specialties?.length
                          ? u.specialties.join(', ')
                          : '—'}
                      </span>
                      <div className="text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                          {u.isActive ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        {canEdit && (
                          <button onClick={() => openEdit(u)} title="Chỉnh sửa"
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-sm">
                            ✏️
                          </button>
                        )}
                        {canEdit && u.id !== actor.id && (
                          u.isActive ? (
                            <button onClick={() => handleDeactivate(u)} title="Vô hiệu hóa"
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors text-sm">
                              🚫
                            </button>
                          ) : (
                            <button onClick={() => handleReactivate(u)} title="Kích hoạt lại"
                              className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-[var(--text-muted)] hover:text-emerald-400 transition-colors text-sm">
                              ✅
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal tạo / chỉnh sửa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md glass-card rounded-2xl border border-[var(--border-default)] p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
              {editing ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {!editing && (
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Email *</label>
                  <input type="email" required className="input-field w-full mt-1"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Họ tên *</label>
                <input type="text" required className="input-field w-full mt-1"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Role *</label>
                <select required className="input-field w-full mt-1 appearance-none"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}>
                  <option value="">-- Chọn role --</option>
                  {assignableRoles.map(r => (
                    <option key={r} value={r}>{ROLE_META[r].label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  {editing ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}
                </label>
                <input type="password" className="input-field w-full mt-1"
                  required={!editing} minLength={8}
                  placeholder={editing ? 'Để trống nếu giữ nguyên' : 'Tối thiểu 8 ký tự'}
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>

              {form.role === 'bs' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Chuyên khoa</label>
                    <div className="mt-1 flex flex-wrap gap-1.5 p-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] max-h-36 overflow-y-auto">
                      {SPECIALTIES.map(s => (
                        <label key={s} className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" className="accent-[var(--lc-primary)]"
                            checked={form.specialties.includes(s)}
                            onChange={e => setForm(f => ({
                              ...f,
                              specialties: e.target.checked
                                ? [...f.specialties, s]
                                : f.specialties.filter(x => x !== s),
                            }))} />
                          <span className="text-xs text-[var(--text-secondary)]">{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Capacity (bài tối đa cùng lúc)</label>
                    <input type="number" min={1} max={100} className="input-field w-full mt-1"
                      placeholder="Ví dụ: 10"
                      value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary py-2 text-sm">
                  Hủy
                </button>
                <button type="submit" className="flex-1 btn-primary py-2 text-sm">
                  {editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
