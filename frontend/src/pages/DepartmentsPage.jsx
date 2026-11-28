import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../services/api'
import { EmptyState, ErrorText, FormInput, FormTextarea, SimpleModal, SubmitButton, Toggle } from '../components/shared/UI'
import { apiError } from '../utils/format'

const EMPTY_FORM = { name: '', code: '', description: '', status: 'active' }

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmItem, setConfirmItem] = useState(null)
  const [error, setError] = useState('')

  const loadDepartments = useCallback(async () => {
    const response = await api.get('/departments')
    setDepartments(response.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDepartments().catch(() => {
        setError('Cannot load departments. Please check API server.')
        setLoading(false)
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadDepartments])

  const totalCount = departments.length
  const activeCount = departments.filter((d) => String(d.status || 'active').toLowerCase() === 'active').length
  const inactiveCount = totalCount - activeCount
  const pct = (count) => (totalCount ? `${Math.round((count / totalCount) * 100)}%` : '0%')

  const filteredDepartments = useMemo(() => {
    const q = search.trim().toLowerCase()
    return departments.filter((dept) => {
      const matchesSearch =
        !q ||
        [dept.name, dept.code, dept.description].some((v) =>
          String(v || '').toLowerCase().includes(q),
        )
      const deptStatus = String(dept.status || 'active').toLowerCase()
      const matchesStatus = statusFilter === 'all' || deptStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [departments, search, statusFilter])

  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  const resetForm = () => {
    setEditing(null)
    setShowForm(false)
    setError('')
    setForm(EMPTY_FORM)
  }

  const openCreate = () => {
    setEditing(null)
    setError('')
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const editDepartment = (department) => {
    setEditing(department)
    setError('')
    setForm({
      name: department.name || '',
      code: department.code || '',
      description: department.description || '',
      status: department.status || 'active',
    })
    setShowForm(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editing) {
        await api.put(`/departments/${editing.id}`, form)
      } else {
        await api.post('/departments', form)
      }
      resetForm()
      await loadDepartments()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (department) => {
    if (togglingId === department.id) return
    const currentStatus = String(department.status || 'active').toLowerCase()
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'

    setTogglingId(department.id)
    setDepartments((prev) =>
      prev.map((item) => (item.id === department.id ? { ...item, status: nextStatus } : item)),
    )

    try {
      await api.put(`/departments/${department.id}`, {
        name: department.name,
        code: department.code,
        description: department.description || '',
        status: nextStatus,
      })
      await loadDepartments()
    } catch (exception) {
      await loadDepartments()
      window.alert(apiError(exception))
    } finally {
      setTogglingId(null)
    }
  }

  const confirmDelete = async () => {
    if (!confirmItem) return
    setDeletingId(confirmItem.id)
    const target = confirmItem
    setConfirmItem(null)
    try {
      await api.delete(`/departments/${target.id}`)
      await loadDepartments()
    } catch (exception) {
      window.alert(apiError(exception))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Top Action Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Organize your company structure into functional departments and teams.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.99] sm:text-sm"
        >
          <Plus size={17} strokeWidth={2.4} />
          Add Department
        </button>
      </div>

      {/* ── Compact Interactive KPI Cards ── */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <KpiCard
          icon={Layers}
          label="Total Departments"
          value={totalCount}
          badge="100%"
          tone="emerald"
          active={!hasActiveFilters}
          onClick={clearFilters}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Active Departments"
          value={activeCount}
          badge={pct(activeCount)}
          tone="sky"
          active={statusFilter === 'active'}
          onClick={() => setStatusFilter((s) => (s === 'active' ? 'all' : 'active'))}
        />
        <KpiCard
          icon={XCircle}
          label="Inactive Departments"
          value={inactiveCount}
          badge={pct(inactiveCount)}
          tone="slate"
          active={statusFilter === 'inactive'}
          onClick={() => setStatusFilter((s) => (s === 'inactive' ? 'all' : 'inactive'))}
        />
      </div>

      {/* ── Unified Auto-Filter Toolbar ── */}
      <div className="rounded-2xl border border-slate-200/85 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
          <label className="relative flex items-center">
            <span className="sr-only">Search departments</span>
            <Search className="pointer-events-none absolute left-3.5 text-slate-400" size={16} />
            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-8 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search department name, code, or description..."
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 rounded-md p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-800"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </label>

          <select
            aria-label="Filter status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* ── Table & Mobile Cards Container ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/85 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Department Directory</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold tabular-nums text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {filteredDepartments.length === departments.length
                ? `${departments.length}`
                : `${filteredDepartments.length} / ${departments.length}`}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin text-emerald-500" />
            Loading departments…
          </div>
        ) : filteredDepartments.length === 0 ? (
          <EmptyState text={hasActiveFilters ? 'No departments match your search.' : 'No departments found yet.'} />
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {filteredDepartments.map((department, index) => {
                const isActive = String(department.status || 'active').toLowerCase() === 'active'
                const isToggling = togglingId === department.id
                const isDeleting = deletingId === department.id
                return (
                  <div key={department.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-400">
                          <FolderKanban size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-400">#{index + 1}</span>
                            <p className="font-bold text-slate-950 dark:text-white">{department.name}</p>
                          </div>
                          <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {department.code}
                          </span>
                        </div>
                      </div>
                      <Toggle
                        checked={isActive}
                        disabled={isToggling}
                        onChange={() => toggleStatus(department)}
                      />
                    </div>
                    {department.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{department.description}</p>
                    )}
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => editDepartment(department)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => setConfirmItem(department)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:border-slate-700 dark:text-rose-400"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[740px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <tr>
                    <th className="w-14 px-4 py-3 text-center">No.</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDepartments.map((department, index) => {
                    const isActive = String(department.status || 'active').toLowerCase() === 'active'
                    const isToggling = togglingId === department.id
                    const isDeleting = deletingId === department.id

                    return (
                      <tr key={department.id} className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-800/45">
                        {/* No. Column */}
                        <td className="px-4 py-3 text-center font-mono text-xs font-bold tabular-nums text-slate-400 dark:text-slate-500">
                          {index + 1}
                        </td>

                        {/* Department Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-400">
                              <FolderKanban size={17} />
                            </div>
                            <span className="font-bold text-slate-950 dark:text-white">{department.name}</span>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {department.code}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {department.description || '—'}
                        </td>

                        {/* Status with Green Left/Right Slide Toggle */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Toggle
                              checked={isActive}
                              disabled={isToggling}
                              onChange={() => toggleStatus(department)}
                            />
                            {isToggling && <Loader2 size={13} className="animate-spin text-emerald-500" />}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => editDepartment(department)}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                              title={`Edit ${department.name}`}
                              aria-label={`Edit ${department.name}`}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => setConfirmItem(department)}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                              title={`Delete ${department.name}`}
                              aria-label={`Delete ${department.name}`}
                            >
                              {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <SimpleModal
          title={editing ? 'Edit Department' : 'Add Department'}
          subtitle="Departments organize employees and job positions across the company."
          onClose={resetForm}
        >
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Department Name"
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
                placeholder="e.g. Sales & Marketing"
                required
              />
              <FormInput
                label="Department Code"
                value={form.code}
                onChange={(value) => setForm({ ...form, code: value.toUpperCase() })}
                placeholder="e.g. SALES"
                required
              />
            </div>

            <FormTextarea
              label="Description"
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
              placeholder="Optional summary of responsibilities..."
            />

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Department Active</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enable or disable this department for employee assignment
                </p>
              </div>
              <Toggle
                checked={form.status === 'active'}
                onChange={(checked) => setForm({ ...form, status: checked ? 'active' : 'inactive' })}
              />
            </div>

            {error && <ErrorText text={error} />}
            <SubmitButton saving={saving} label={editing ? 'Update Department' : 'Save Department'} />
          </form>
        </SimpleModal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmItem && (
        <ConfirmDeleteModal
          title="Delete Department"
          name={confirmItem.name}
          code={confirmItem.code}
          message="Are you sure you want to delete this department? Positions or employees linked to it may be affected."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmItem(null)}
        />
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, badge, tone = 'emerald', active = false, onClick }) {
  const tones = {
    emerald: {
      icon: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-400',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      bar: 'bg-emerald-500',
      activeRing: 'ring-2 ring-emerald-500 border-emerald-500/50',
    },
    sky: {
      icon: 'bg-sky-50 text-sky-600 ring-1 ring-sky-500/20 dark:bg-sky-950/60 dark:text-sky-400',
      badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
      bar: 'bg-sky-500',
      activeRing: 'ring-2 ring-sky-500 border-sky-500/50',
    },
    slate: {
      icon: 'bg-slate-100 text-slate-600 ring-1 ring-slate-400/20 dark:bg-slate-800 dark:text-slate-300',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      bar: 'bg-slate-400',
      activeRing: 'ring-2 ring-slate-500 border-slate-500/50',
    },
  }
  const t = tones[tone] || tones.emerald

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group relative flex items-center gap-3 overflow-hidden rounded-xl border bg-white px-3.5 py-2.5 text-left shadow-2xs transition-all duration-150 hover:shadow-sm active:scale-[0.99] dark:bg-slate-900',
        active
          ? t.activeRing
          : 'border-slate-200/85 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700',
      )}
    >
      <span className={clsx('absolute inset-y-2 left-0 w-1 rounded-r-full', t.bar, active ? 'opacity-100' : 'opacity-70')} />
      <div className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-lg', t.icon)}>
        <Icon size={17} strokeWidth={2.1} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        <div className="mt-0.5 flex items-baseline justify-between gap-1.5">
          <p className="truncate text-lg font-extrabold leading-tight tracking-tight tabular-nums text-slate-950 dark:text-white">
            {value}
          </p>
          {badge && (
            <span className={clsx('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums', t.badge)}>
              {badge}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function ConfirmDeleteModal({ title, name, code, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 dark:bg-rose-950/50">
              <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
            <span className="font-bold text-slate-900 dark:text-slate-100">{name}</span>
            {code && (
              <span className="rounded-md bg-slate-200/70 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {code}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-700"
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
