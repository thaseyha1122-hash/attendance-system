import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
  LocateFixed,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Wifi,
  X,
  XCircle,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../services/api'
import { EmptyState, ErrorText, FormInput, SimpleModal, SubmitButton, Toggle } from '../components/shared/UI'
import { apiError } from '../utils/format'

const EMPTY_FORM = {
  name: '',
  code: '',
  address: '',
  latitude: '',
  longitude: '',
  attendance_radius_meters: 100,
  status: true,
}

export default function BranchesPage() {
  const [branches, setBranches] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmItem, setConfirmItem] = useState(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/branches')
      setBranches(res.data || [])
    } catch {
      setError('Cannot load branches.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const totalCount = branches.length
  const activeCount = branches.filter((b) => Boolean(b.status)).length
  const inactiveCount = totalCount - activeCount
  const gpsCount = branches.filter((b) => b.latitude && b.longitude).length
  const pct = (count) => (totalCount ? `${Math.round((count / totalCount) * 100)}%` : '0%')

  const filteredBranches = useMemo(() => {
    const q = search.trim().toLowerCase()
    return branches.filter((branch) => {
      const matchesSearch =
        !q ||
        [branch.name, branch.code, branch.address].some((v) =>
          String(v || '').toLowerCase().includes(q),
        )
      const isActive = Boolean(branch.status)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? isActive : !isActive)
      return matchesSearch && matchesStatus
    })
  }, [branches, search, statusFilter])

  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  const openEdit = (branch) => {
    setEditing(branch)
    setForm({
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      latitude: branch.latitude ?? '',
      longitude: branch.longitude ?? '',
      attendance_radius_meters: branch.attendance_radius_meters ?? 100,
      status: Boolean(branch.status),
    })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setError('')
  }

  const useCurrentGps = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: Number(pos.coords.latitude).toFixed(6),
          longitude: Number(pos.coords.longitude).toFixed(6),
        }))
        setLocating(false)
      },
      () => {
        setError('Could not retrieve current GPS coordinates.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        latitude: form.latitude !== '' ? Number(form.latitude) : null,
        longitude: form.longitude !== '' ? Number(form.longitude) : null,
        attendance_radius_meters: Number(form.attendance_radius_meters) || 100,
      }
      if (editing) {
        await api.put(`/branches/${editing.id}`, payload)
      } else {
        await api.post('/branches', payload)
      }
      closeForm()
      await load()
    } catch (ex) {
      setError(apiError(ex))
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (branch) => {
    if (togglingId === branch.id) return
    const nextStatus = !branch.status

    setTogglingId(branch.id)
    setBranches((prev) =>
      prev.map((item) => (item.id === branch.id ? { ...item, status: nextStatus } : item)),
    )

    try {
      await api.put(`/branches/${branch.id}`, {
        name: branch.name,
        code: branch.code || null,
        address: branch.address || null,
        latitude: branch.latitude !== null && branch.latitude !== '' ? Number(branch.latitude) : null,
        longitude: branch.longitude !== null && branch.longitude !== '' ? Number(branch.longitude) : null,
        attendance_radius_meters: Number(branch.attendance_radius_meters) || 100,
        status: nextStatus,
      })
      await load()
    } catch (ex) {
      await load()
      window.alert(apiError(ex))
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
      await api.delete(`/branches/${target.id}`)
      await load()
    } catch (ex) {
      window.alert(apiError(ex))
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
            Manage office branch locations, addresses, and geofence GPS check-in radius.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.99] sm:text-sm"
        >
          <Plus size={17} strokeWidth={2.4} />
          Add Branch
        </button>
      </div>

      {/* ── Compact Interactive KPI Strip ── */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard
          icon={Building2}
          label="Total Branches"
          value={totalCount}
          badge="100%"
          tone="emerald"
          active={!hasActiveFilters}
          onClick={clearFilters}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Active Branches"
          value={activeCount}
          badge={pct(activeCount)}
          tone="sky"
          active={statusFilter === 'active'}
          onClick={() => setStatusFilter((s) => (s === 'active' ? 'all' : 'active'))}
        />
        <KpiCard
          icon={Wifi}
          label="GPS Geofence Ready"
          value={gpsCount}
          badge={pct(gpsCount)}
          tone="violet"
        />
        <KpiCard
          icon={XCircle}
          label="Inactive Branches"
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
            <span className="sr-only">Search branches</span>
            <Search className="pointer-events-none absolute left-3.5 text-slate-400" size={16} />
            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-8 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search branch name, code, or address..."
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
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Branch Directory</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold tabular-nums text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {filteredBranches.length === branches.length
                ? `${branches.length}`
                : `${filteredBranches.length} / ${branches.length}`}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin text-emerald-500" />
            Loading branches…
          </div>
        ) : filteredBranches.length === 0 ? (
          <EmptyState text={hasActiveFilters ? 'No branches match your search.' : 'No branches yet. Click Add Branch to create one.'} />
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {filteredBranches.map((branch, index) => {
                const isActive = Boolean(branch.status)
                const isToggling = togglingId === branch.id
                const isDeleting = deletingId === branch.id
                return (
                  <div key={branch.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-400">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-400">#{index + 1}</span>
                            <p className="font-bold text-slate-950 dark:text-white">{branch.name}</p>
                          </div>
                          {branch.code && (
                            <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {branch.code}
                            </span>
                          )}
                        </div>
                      </div>
                      <Toggle
                        checked={isActive}
                        disabled={isToggling}
                        onChange={() => toggleStatus(branch)}
                      />
                    </div>
                    {branch.address && (
                      <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin size={12} className="shrink-0 text-slate-400" />
                        {branch.address}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      {branch.latitude && branch.longitude ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <Wifi size={12} />
                          {branch.attendance_radius_meters}m radius
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No GPS set</span>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(branch)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => setConfirmItem(branch)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:border-slate-700 dark:text-rose-400"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <tr>
                    <th className="w-14 px-4 py-3 text-center">No.</th>
                    <th className="px-4 py-3">Branch Name</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Address</th>
                    <th className="px-4 py-3">GPS Radius</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBranches.map((branch, index) => {
                    const isActive = Boolean(branch.status)
                    const isToggling = togglingId === branch.id
                    const isDeleting = deletingId === branch.id

                    return (
                      <tr key={branch.id} className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-800/45">
                        {/* No. Column */}
                        <td className="px-4 py-3 text-center font-mono text-xs font-bold tabular-nums text-slate-400 dark:text-slate-500">
                          {index + 1}
                        </td>

                        {/* Branch Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-400">
                              <Building2 size={17} />
                            </div>
                            <span className="font-bold text-slate-950 dark:text-white">{branch.name}</span>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="px-4 py-3">
                          {branch.code ? (
                            <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {branch.code}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Address */}
                        <td className="max-w-xs truncate px-4 py-3">
                          {branch.address ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                              <MapPin size={13} className="shrink-0 text-slate-400" />
                              <span className="truncate">{branch.address}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* GPS Radius */}
                        <td className="px-4 py-3">
                          {branch.latitude && branch.longitude ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300">
                                <Wifi size={12} />
                                {branch.attendance_radius_meters}m
                              </span>
                              <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                                {Number(branch.latitude).toFixed(4)}, {Number(branch.longitude).toFixed(4)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No GPS</span>
                          )}
                        </td>

                        {/* Status with Green Left/Right Slide Toggle */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Toggle
                              checked={isActive}
                              disabled={isToggling}
                              onChange={() => toggleStatus(branch)}
                            />
                            {isToggling && <Loader2 size={13} className="animate-spin text-emerald-500" />}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(branch)}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                              title={`Edit ${branch.name}`}
                              aria-label={`Edit ${branch.name}`}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => setConfirmItem(branch)}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                              title={`Delete ${branch.name}`}
                              aria-label={`Delete ${branch.name}`}
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
          title={editing ? 'Edit Branch' : 'Add Branch'}
          subtitle="Set branch name, address and GPS check-in radius."
          onClose={closeForm}
        >
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Branch Name"
                value={form.name}
                onChange={(v) => set('name', v)}
                placeholder="e.g. Head Office Phnom Penh"
                required
              />
              <FormInput
                label="Branch Code"
                value={form.code}
                onChange={(v) => set('code', v.toUpperCase())}
                placeholder="e.g. PP-01"
              />
            </div>

            <FormInput
              label="Address"
              value={form.address}
              onChange={(v) => set('address', v)}
              placeholder="123 Street, Phnom Penh"
            />

            <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    GPS Geofence Location
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Optional coordinates for office check-in radius verification
                  </p>
                </div>
                <button
                  type="button"
                  onClick={useCurrentGps}
                  disabled={locating}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300"
                >
                  {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
                  Use Current GPS
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <FormInput
                  label="Latitude"
                  value={form.latitude}
                  onChange={(v) => set('latitude', v)}
                  placeholder="11.5564"
                  type="number"
                />
                <FormInput
                  label="Longitude"
                  value={form.longitude}
                  onChange={(v) => set('longitude', v)}
                  placeholder="104.9282"
                  type="number"
                />
                <FormInput
                  label="Radius (meters)"
                  value={form.attendance_radius_meters}
                  onChange={(v) => set('attendance_radius_meters', v)}
                  type="number"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Branch Active</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inactive branches won&apos;t appear in employee assignment
                </p>
              </div>
              <Toggle
                checked={Boolean(form.status)}
                onChange={(checked) => set('status', checked)}
              />
            </div>

            {error && <ErrorText text={error} />}
            <SubmitButton saving={saving} label={editing ? 'Update Branch' : 'Save Branch'} />
          </form>
        </SimpleModal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmItem && (
        <ConfirmDeleteModal
          title="Delete Branch"
          name={confirmItem.name}
          code={confirmItem.code}
          subtitle={confirmItem.address}
          message="Are you sure you want to delete this branch location? Employees assigned to this branch may need to be reassigned."
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
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900 dark:text-slate-100">{name}</p>
              {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
            {code && (
              <span className="shrink-0 rounded-md bg-slate-200/70 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
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
