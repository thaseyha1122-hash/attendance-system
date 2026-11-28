import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BriefcaseBusiness,
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
import { EmptyState, ErrorText, FormInput, FormSelect, SimpleModal, SubmitButton, Toggle } from '../components/shared/UI'
import { apiError } from '../utils/format'

const EMPTY_FORM = { department_id: '', name: '', code: '', status: 'active' }

export default function PositionsPage() {
  const [positions, setPositions] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
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

  const loadPositions = useCallback(async () => {
    const [positionResponse, optionResponse] = await Promise.all([
      api.get('/positions'),
      api.get('/employee-options'),
    ])
    setPositions(positionResponse.data || [])
    setDepartments(optionResponse.data.departments || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPositions().catch(() => {
        setError('Cannot load positions. Please check API server.')
        setLoading(false)
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadPositions])

  const totalCount = positions.length
  const activeCount = positions.filter((p) => String(p.status || 'active').toLowerCase() === 'active').length
  const inactiveCount = totalCount - activeCount
  const deptCoveredCount = new Set(positions.map((p) => p.department_id).filter(Boolean)).size
  const pct = (count) => (totalCount ? `${Math.round((count / totalCount) * 100)}%` : '0%')

  const filteredPositions = useMemo(() => {
    const q = search.trim().toLowerCase()
    return positions.filter((pos) => {
      const matchesSearch =
        !q ||
        [pos.name, pos.code, pos.department?.name].some((v) =>
          String(v || '').toLowerCase().includes(q),
        )
      const matchesDept =
        deptFilter === 'all' || String(pos.department_id || '') === String(deptFilter)
      const posStatus = String(pos.status || 'active').toLowerCase()
      const matchesStatus = statusFilter === 'all' || posStatus === statusFilter
      return matchesSearch && matchesDept && matchesStatus
    })
  }, [positions, search, deptFilter, statusFilter])

  const hasActiveFilters =
    Boolean(search.trim()) || deptFilter !== 'all' || statusFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setDeptFilter('all')
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

  const editPosition = (position) => {
    setEditing(position)
    setError('')
    setForm({
      department_id: position.department_id || '',
      name: position.name || '',
      code: position.code || '',
      status: position.status || 'active',
    })
    setShowForm(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editing) {
        await api.put(`/positions/${editing.id}`, form)
      } else {
        await api.post('/positions', form)
      }
      resetForm()
      await loadPositions()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (position) => {
    if (togglingId === position.id) return
    const currentStatus = String(position.status || 'active').toLowerCase()
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'

    setTogglingId(position.id)
    setPositions((prev) =>
      prev.map((item) => (item.id === position.id ? { ...item, status: nextStatus } : item)),
    )

    try {
      await api.put(`/positions/${position.id}`, {
        department_id: position.department_id,
        name: position.name,
        code: position.code,
        status: nextStatus,
      })
      await loadPositions()
    } catch (exception) {
      await loadPositions()
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
      await api.delete(`/positions/${target.id}`)
      await loadPositions()
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
            Manage job titles and positions linked to each company department.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.99] sm:text-sm"
        >
          <Plus size={17} strokeWidth={2.4} />
          Add Position
        </button>
      </div>

      {/* ── Compact Interactive KPI Strip ── */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard
          icon={BriefcaseBusiness}
          label="Total Positions"
          value={totalCount}
          badge="100%"
          tone="emerald"
          active={!hasActiveFilters}
          onClick={clearFilters}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Active Positions"
          value={activeCount}
          badge={pct(activeCount)}
          tone="sky"
          active={statusFilter === 'active'}
          onClick={() => setStatusFilter((s) => (s === 'active' ? 'all' : 'active'))}
        />
        <KpiCard
          icon={XCircle}
          label="Inactive Positions"
          value={inactiveCount}
          badge={pct(inactiveCount)}
          tone="slate"
          active={statusFilter === 'inactive'}
          onClick={() => setStatusFilter((s) => (s === 'inactive' ? 'all' : 'inactive'))}
        />
        <KpiCard
          icon={Layers}
          label="Departments Covered"
          value={deptCoveredCount}
          badge={`${departments.length} total`}
          tone="violet"
        />
      </div>

      {/* ── Unified Auto-Filter Toolbar ── */}
      <div className="rounded-2xl border border-slate-200/85 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_180px_auto]">
          <label className="relative flex items-center">
            <span className="sr-only">Search positions</span>
            <Search className="pointer-events-none absolute left-3.5 text-slate-400" size={16} />
            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-8 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search position name, code, or department..."
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
            aria-label="Filter department"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

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
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Position Directory</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold tabular-nums text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {filteredPositions.length === positions.length
                ? `${positions.length}`
                : `${filteredPositions.length} / ${positions.length}`}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin text-emerald-500" />
            Loading positions…
          </div>
        ) : filteredPositions.length === 0 ? (
          <EmptyState text={hasActiveFilters ? 'No positions match your filter.' : 'No positions found yet.'} />
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {filteredPositions.map((position, index) => {
                const isActive = String(position.status || 'active').toLowerCase() === 'active'
                const isToggling = togglingId === position.id
                const isDeleting = deletingId === position.id
                return (
                  <div key={position.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-500/20 dark:bg-sky-950/50 dark:text-sky-400">
                          <BriefcaseBusiness size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-400">#{index + 1}</span>
                            <p className="font-bold text-slate-950 dark:text-white">{position.name}</p>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {position.code}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              <FolderKanban size={11} />
                              {position.department?.name || 'No Dept'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Toggle
                        checked={isActive}
                        disabled={isToggling}
                        onChange={() => toggleStatus(position)}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => editPosition(position)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => setConfirmItem(position)}
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
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPositions.map((position, index) => {
                    const isActive = String(position.status || 'active').toLowerCase() === 'active'
                    const isToggling = togglingId === position.id
                    const isDeleting = deletingId === position.id

                    return (
                      <tr key={position.id} className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-800/45">
                        {/* No. Column */}
                        <td className="px-4 py-3 text-center font-mono text-xs font-bold tabular-nums text-slate-400 dark:text-slate-500">
                          {index + 1}
                        </td>

                        {/* Position Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-500/20 dark:bg-sky-950/50 dark:text-sky-400">
                              <BriefcaseBusiness size={17} />
                            </div>
                            <span className="font-bold text-slate-950 dark:text-white">{position.name}</span>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {position.code}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3">
                          {position.department?.name ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300">
                              <FolderKanban size={12} />
                              {position.department.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Status with Green Left/Right Slide Toggle */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Toggle
                              checked={isActive}
                              disabled={isToggling}
                              onChange={() => toggleStatus(position)}
                            />
                            {isToggling && <Loader2 size={13} className="animate-spin text-emerald-500" />}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => editPosition(position)}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                              title={`Edit ${position.name}`}
                              aria-label={`Edit ${position.name}`}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => setConfirmItem(position)}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                              title={`Delete ${position.name}`}
                              aria-label={`Delete ${position.name}`}
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
          title={editing ? 'Edit Position' : 'Add Position'}
          subtitle="Positions define job titles within each department."
          onClose={resetForm}
        >
          <form className="grid gap-4" onSubmit={submit}>
            <FormSelect
              label="Department"
              value={form.department_id}
              onChange={(value) => setForm({ ...form, department_id: value })}
              required
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </FormSelect>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Position Name"
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
                placeholder="e.g. Senior Sales Executive"
                required
              />
              <FormInput
                label="Position Code"
                value={form.code}
                onChange={(value) => setForm({ ...form, code: value.toUpperCase() })}
                placeholder="e.g. POS-SALES-01"
                required
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Position Active</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Allow assigning employees to this job position
                </p>
              </div>
              <Toggle
                checked={form.status === 'active'}
                onChange={(checked) => setForm({ ...form, status: checked ? 'active' : 'inactive' })}
              />
            </div>

            {error && <ErrorText text={error} />}
            <SubmitButton saving={saving} label={editing ? 'Update Position' : 'Save Position'} />
          </form>
        </SimpleModal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmItem && (
        <ConfirmDeleteModal
          title="Delete Position"
          name={confirmItem.name}
          code={confirmItem.code}
          subtitle={confirmItem.department?.name}
          message="Are you sure you want to delete this position? Employees currently assigned to it may need a new position."
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
    violet: {
      icon: 'bg-violet-50 text-violet-600 ring-1 ring-violet-500/20 dark:bg-violet-950/60 dark:text-violet-400',
      badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
      bar: 'bg-violet-500',
      activeRing: 'ring-2 ring-violet-500 border-violet-500/50',
    },
    slate: {
      icon: 'bg-slate-100 text-slate-600 ring-1 ring-slate-400/20 dark:bg-slate-800 dark:text-slate-300',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      bar: 'bg-slate-400',
      activeRing: 'ring-2 ring-slate-500 border-slate-500/50',
    },
  }
  const t = tones[tone] || tones.emerald
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'group relative flex items-center gap-3 overflow-hidden rounded-xl border bg-white px-3.5 py-2.5 text-left shadow-2xs transition-all duration-150 hover:shadow-sm dark:bg-slate-900',
        active
          ? t.activeRing
          : 'border-slate-200/85 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700',
        onClick && 'cursor-pointer active:scale-[0.99]',
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
    </Wrapper>
  )
}

function ConfirmDeleteModal({ title, name, code, subtitle, message, onConfirm, onCancel }) {
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
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{name}</p>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
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
