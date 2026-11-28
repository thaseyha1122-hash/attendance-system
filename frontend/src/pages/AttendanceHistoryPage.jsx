import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3, CalendarCheck, ChevronLeft, ChevronRight, Clock,
  Download, Eye, Image, ListFilter, LogOut, MapPin, Pencil, RefreshCw,
  Search, UserMinus, Users, X,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../services/api'
import { EmptyState } from '../components/shared/UI'
import { attendanceLocationMapUrl, employeeFullName, initials } from '../utils/format'
import EditAttendanceModal from '../components/attendance/EditAttendanceModal'
import AdminAttendanceReportsPage from './AdminAttendanceReportsPage'

const STATUS_STYLE = {
  present:  { label: 'Present',     dot: 'bg-emerald-500', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
  late:     { label: 'Late',        dot: 'bg-amber-400',   cls: 'bg-amber-100  text-amber-700  dark:bg-amber-950/60  dark:text-amber-400'  },
  absent:   { label: 'Absent',      dot: 'bg-rose-500',    cls: 'bg-rose-100   text-rose-700   dark:bg-rose-950/60   dark:text-rose-400'   },
  half_day: { label: 'Half Day',    dot: 'bg-sky-400',     cls: 'bg-sky-100    text-sky-700    dark:bg-sky-950/60    dark:text-sky-400'    },
  on_leave: { label: 'On Leave',    dot: 'bg-sky-400',     cls: 'bg-sky-100    text-sky-700    dark:bg-sky-950/60    dark:text-sky-400'    },
}

const TYPE_STYLE = {
  office:  { label: 'Office',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
  outdoor: { label: 'Outdoor', cls: 'bg-sky-100     text-sky-600     dark:bg-sky-950/60     dark:text-sky-400'     },
}

function formatWorkHours(minutes) {
  if (minutes == null || minutes === '') return '–'
  const h = Math.floor(Number(minutes) / 60)
  const m = Number(minutes) % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

function localDateString(value = new Date()) {
  const dateValue = value instanceof Date ? value : new Date(value)
  const year = dateValue.getFullYear()
  const month = String(dateValue.getMonth() + 1).padStart(2, '0')
  const day = String(dateValue.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function localMonthString(value = new Date()) {
  const dateValue = value instanceof Date ? value : new Date(value)
  const year = dateValue.getFullYear()
  const month = String(dateValue.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default function AttendanceHistoryPage({ user, appData, isLoaded, viewMode = 'all', initialTab = 'daily' }) {
  const currentMonth = useMemo(() => localMonthString(), [])
  const [activeTab, setActiveTab]         = useState(initialTab)
  const [rows, setRows]                   = useState([])
  const [loading, setLoading]             = useState(true)
  const [month, setMonth]                 = useState(currentMonth)
  const [date, setDate]                   = useState('')
  const [department, setDept]             = useState('')
  const [branch, setBranch]               = useState('')
  const [empSearch, setEmpSearch]         = useState('')
  const [status, setStatus]               = useState('')
  const [type, setType]                   = useState('')
  const [page, setPage]                   = useState(1)
  const [perPage, setPerPage]             = useState(100)
  const [editingAttendance, setEditing]   = useState(null)
  const [photoPreview, setPhotoPreview]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { per_page: 500 }
      const effectiveDate = date || (status === 'absent' ? localDateString() : '')
      if (effectiveDate) params.date = effectiveDate
      // Absence is derived from employees who have no attendance record.
      // Load every record for the target date before calculating that list.
      if (status && status !== 'absent') params.status = status
      const res = await api.get('/attendance', { params })
      setRows(res.data.data || res.data || [])
      setPage(1)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [date, status])

  useEffect(() => {
    if (activeTab === 'daily') {
      load()
    }
  }, [load, activeTab])

  /* ── Derived filter options ───────────────────────────────────── */
  const employees    = appData?.employees || []
  const departments  = useMemo(() => [...new Set(employees.map((e) => e.department?.name).filter(Boolean))].sort(), [employees])
  const branches     = useMemo(() => [...new Set(employees.map((e) => e.branch?.name).filter(Boolean))].sort(),     [employees])
  const displayRows = useMemo(() => {
    const targetAbsentDate = date || (status === 'absent' ? localDateString() : '')
    const shouldAddAbsentRows = viewMode === 'all' && targetAbsentDate && (!status || status === 'absent')

    if (!shouldAddAbsentRows) return rows

    const employeeIdsWithAttendance = new Set(
      rows
        .map((row) => Number(row.employee_id ?? row.employee?.id))
        .filter(Boolean),
    )

    const syntheticAbsentRows = employees
      .filter((employee) => (employee.status || 'active') === 'active')
      .filter((employee) => !employeeIdsWithAttendance.has(Number(employee.id)))
      .map((employee) => ({
        id: `absent-${targetAbsentDate}-${employee.id}`,
        employee_id: employee.id,
        employee,
        attendance_date: targetAbsentDate,
        date: targetAbsentDate,
        check_in_at: null,
        check_out_at: null,
        work_minutes: null,
        status: 'absent',
        type: employee.employment_type === 'outdoor_sales' ? 'outdoor' : 'office',
        check_in_address: '',
        check_out_address: '',
        synthetic_absent: true,
      }))

    return [...rows, ...syntheticAbsentRows]
  }, [rows, employees, date, status, viewMode])

  /* ── Client-side filtering ────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = empSearch.trim().toLowerCase()
    return displayRows.filter((item) => {
      if (viewMode === 'missing_checkout' && (!item.check_in_at || item.check_out_at || item.status === 'absent')) return false
      if (!date && month) {
        const itemDate = (item.attendance_date || item.date || item.check_in_at || item.created_at || '').slice(0, 10)
        if (itemDate && !itemDate.startsWith(month)) return false
      }
      if (q) {
        const name = employeeFullName(item.employee).toLowerCase()
        const code = (item.employee?.employee_code || '').toLowerCase()
        if (!name.includes(q) && !code.includes(q)) return false
      }
      if (department && item.employee?.department?.name !== department) return false
      if (branch     && item.employee?.branch?.name     !== branch)     return false
      if (type       && item.type !== type)                              return false
      if (status === 'absent' && item.status !== 'absent')               return false
      return true
    })
  }, [displayRows, empSearch, department, branch, type, status, viewMode, date, month])

  /* ── Stats (from displayed records) ──────────── */
  const stats = useMemo(() => {
    const total = filtered.length
    const count = (fn) => filtered.filter(fn).length
    const pct   = (n)  => total ? ((n / total) * 100).toFixed(2) + '% of total' : '0%'
    const present     = count((r) => r.status === 'present')
    const late        = count((r) => r.status === 'late')
    const absent      = count((r) => r.status === 'absent')
    const onLeave     = count((r) => r.status === 'on_leave' || r.status === 'half_day')
    const missingOut  = count((r) => r.check_in_at && !r.check_out_at && r.status !== 'absent')
    return [
      { label: 'Present Records',    value: present,    pct: pct(present),   icon: Users,        tone: 'emerald' },
      { label: 'Late Records',       value: late,       pct: pct(late),      icon: Clock,        tone: 'amber'   },
      { label: 'Absent Records',     value: absent,     pct: pct(absent),    icon: UserMinus,    tone: 'rose'    },
      { label: 'On Leave',           value: onLeave,    pct: pct(onLeave),   icon: CalendarCheck,tone: 'sky'     },
      { label: 'Missing Check Out',  value: missingOut, pct: pct(missingOut),icon: LogOut,       tone: 'violet'  },
    ]
  }, [filtered])

  /* ── Pagination ───────────────────────────────────────────────── */
  const totalPages  = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage    = Math.min(page, totalPages)
  const paginated   = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const reset = () => {
    setMonth(currentMonth)
    setDate('')
    setDept('')
    setBranch('')
    setEmpSearch('')
    setStatus('')
    setType('')
    setPage(1)
  }

  /* ── CSV export ───────────────────────────────────────────────── */
  const exportCsv = () => {
    const headers = ['#', 'Code', 'Employee', 'Department', 'Check In', 'Check Out', 'Work Hours', 'Status', 'Type', 'Check In Location', 'Check Out Location']
    const csvData = filtered.map((item, i) => [
      i + 1,
      item.employee?.employee_code || '',
      employeeFullName(item.employee),
      item.employee?.department?.name || '',
      item.check_in_at  ? new Date(item.check_in_at).toLocaleString()  : '',
      item.check_out_at ? new Date(item.check_out_at).toLocaleString() : '',
      formatWorkHours(item.work_minutes),
      item.status || '',
      item.type   || '',
      item.check_in_address  || '',
      item.check_out_address || '',
    ])
    const csv  = [headers, ...csvData].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: date ? `attendance-${date}.csv` : 'attendance-records.csv' })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* ── Mode Switcher: Daily Records vs Analytics & Range Export ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition sm:text-sm',
              activeTab === 'daily'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            <ListFilter size={16} />
            Daily Log & Absent Check
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition sm:text-sm',
              activeTab === 'analytics'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            <BarChart3 size={16} />
            Range Analytics & Export
          </button>
        </div>

        {activeTab === 'daily' && (
          <button
            onClick={load}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-500' : ''} />
            Refresh
          </button>
        )}
      </div>

      {activeTab === 'analytics' ? (
        <AdminAttendanceReportsPage user={user} appData={appData} isLoaded={isLoaded} />
      ) : (
        <>
      {/* ── Stats row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Row 1 */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Month (Defaults to current month) */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Month</label>
            <input
              type="month"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={month}
              onChange={(e) => { setMonth(e.target.value); setDate(''); setPage(1) }}
            />
          </div>
          {/* Date */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Date</label>
            <input
              type="date"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(1) }}
            />
          </div>
          {/* Department */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Department</label>
            <select
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={department}
              onChange={(e) => { setDept(e.target.value); setPage(1) }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {/* Branch */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Branch</label>
            <select
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={branch}
              onChange={(e) => { setBranch(e.target.value); setPage(1) }}
            >
              <option value="">All Branches</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {/* Employee search */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Employee</label>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="Search employee..."
                value={empSearch}
                onChange={(e) => { setEmpSearch(e.target.value); setPage(1) }}
              />
            </div>
          </div>
          {/* Status */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Status</label>
            <select
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            {/* Type */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Attendance Type</label>
              <select
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                value={type}
                onChange={(e) => { setType(e.target.value); setPage(1) }}
              >
                <option value="">All Types</option>
                <option value="office">Office</option>
                <option value="outdoor">Outdoor</option>
              </select>
            </div>
            <button
              onClick={reset}
              className="h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-950 dark:text-emerald-400"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-400">
            <RefreshCw size={18} className="mr-2 animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState text="No attendance records found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1380px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  {['#', 'Employee', 'Department', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Type', 'Check In Location', 'Check Out Location', 'Photo', 'Action'].map((col) => (
                    <th key={col} className="px-4 py-4">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginated.map((item, idx) => {
                  const fullName   = employeeFullName(item.employee)
                  const photo      = item.employee?.photo_url
                  const statusInfo = STATUS_STYLE[item.status] || { label: item.status, dot: 'bg-slate-400', cls: 'bg-slate-100 text-slate-600' }
                  const typeInfo   = TYPE_STYLE[item.type]     || { label: item.type,   cls: 'bg-slate-100 text-slate-600' }
                  const rowNum     = (safePage - 1) * perPage + idx + 1
                  const isLate     = item.status === 'late'
                  const hasCheckIn = Boolean(item.check_in_at)
                  const mapUrl     = attendanceLocationMapUrl(item, 'check_in')

                  return (
                    <tr key={item.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      {/* # */}
                      <td className="px-4 py-4 text-slate-400">{rowNum}</td>

                      {/* Employee */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            {photo ? <img src={photo} alt={fullName} className="h-full w-full object-cover" /> : initials(fullName)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{fullName || '–'}</p>
                            <p className="text-[11px] text-slate-400">{item.employee?.employee_code || '–'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{item.employee?.department?.name || '–'}</td>

                      {/* Check In */}
                      <td className="px-4 py-4">
                        {item.synthetic_absent
                          ? <AbsentDayCell date={item.attendance_date} />
                          : <TimeCell datetime={item.check_in_at} isLate={isLate} />
                        }
                      </td>

                      {/* Check Out */}
                      <td className="px-4 py-4">
                        {item.check_out_at
                          ? <TimeCell datetime={item.check_out_at} isLate={false} />
                          : (
                            <div>
                              <span className="text-slate-400">–</span>
                              {hasCheckIn && <p className="text-[11px] text-amber-500">Not yet</p>}
                            </div>
                          )
                        }
                      </td>

                      {/* Working Hours */}
                      <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">
                        {item.work_minutes ? formatWorkHours(item.work_minutes) : '–'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-bold', statusInfo.cls)}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        {item.type ? (
                          <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-bold', typeInfo.cls)}>
                            {typeInfo.label}
                          </span>
                        ) : '–'}
                      </td>

                      {/* Check In Location */}
                      <td className="max-w-[160px] px-4 py-4">
                        <LocationCell item={item} type="check_in" />
                      </td>

                      {/* Check Out Location */}
                      <td className="max-w-[160px] px-4 py-4">
                        <LocationCell item={item} type="check_out" />
                      </td>

                      {/* Photo */}
                      <td className="px-4 py-4">
                        <PhotoButton item={item} onView={setPhotoPreview} />
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          {!item.synthetic_absent ? (
                            <>
                              <ActionBtn icon={Eye} label="View" tone="slate" onClick={() => {}} />
                              <ActionBtn icon={Pencil} label="Edit" tone="sky" onClick={() => setEditing(item)} />
                            </>
                          ) : (
                            <ActionBtn icon={Pencil} label="Edit" tone="sky" onClick={() => setEditing(item)} />
                          )}
                          {mapUrl && (
                            <a
                              href={mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-900/60 dark:hover:bg-emerald-950/30"
                              title="View on map"
                            >
                              <MapPin size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Footer / Pagination ───────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {(safePage - 1) * perPage + 1} to {Math.min(safePage * perPage, filtered.length)} of {filtered.length} entries
            </p>
            <div className="flex items-center gap-2">
              <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
              {/* Per page */}
              <select
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
              >
                {[10, 25, 50, 100, 200].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {editingAttendance && (
        <EditAttendanceModal
          attendance={editingAttendance}
          isLoaded={isLoaded}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}

      {photoPreview && (
        <PhotoPreviewModal preview={photoPreview} onClose={() => setPhotoPreview(null)} />
      )}
        </>
      )}
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────── */

function StatCard({ label, value, pct, icon: Icon, tone }) {
  const tones = {
    emerald: {
      icon: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-400',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      bar: 'bg-emerald-500',
    },
    amber: {
      icon: 'bg-amber-50 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-950/60 dark:text-amber-400',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      bar: 'bg-amber-500',
    },
    rose: {
      icon: 'bg-rose-50 text-rose-600 ring-1 ring-rose-500/20 dark:bg-rose-950/60 dark:text-rose-400',
      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      bar: 'bg-rose-500',
    },
    sky: {
      icon: 'bg-sky-50 text-sky-600 ring-1 ring-sky-500/20 dark:bg-sky-950/60 dark:text-sky-400',
      badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
      bar: 'bg-sky-500',
    },
    violet: {
      icon: 'bg-violet-50 text-violet-600 ring-1 ring-violet-500/20 dark:bg-violet-950/60 dark:text-violet-400',
      badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
      bar: 'bg-violet-500',
    },
  }
  const t = tones[tone] || tones.emerald

  return (
    <div className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-slate-200/85 bg-white px-3.5 py-2.5 shadow-2xs transition-all duration-150 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <span className={clsx('absolute inset-y-2 left-0 w-1 rounded-r-full opacity-75', t.bar)} />
      <div className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-lg', t.icon)}>
        <Icon size={17} strokeWidth={2.1} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        <div className="mt-0.5 flex items-baseline justify-between gap-1.5">
          <p className="truncate text-lg font-extrabold leading-tight tracking-tight tabular-nums text-slate-950 dark:text-white">
            {value}
          </p>
          {pct && (
            <span className={clsx('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums', t.badge)}>
              {pct.replace(' of total', '')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function TimeCell({ datetime, isLate }) {
  if (!datetime) return <span className="text-slate-400">–</span>
  const d    = new Date(datetime)
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <div className="flex items-start gap-2">
      <span className={clsx('mt-[5px] h-2 w-2 shrink-0 rounded-full', isLate ? 'bg-amber-400' : 'bg-emerald-500')} />
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">{time}</p>
        <p className="text-[11px] text-slate-400">{date}</p>
      </div>
    </div>
  )
}

function AbsentDayCell({ date }) {
  const d = new Date(`${date}T00:00:00`)
  const label = Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="flex items-start gap-2">
      <span className="mt-[5px] h-2 w-2 shrink-0 rounded-full bg-rose-500" />
      <div>
        <p className="font-semibold text-rose-700 dark:text-rose-300">Absent Day</p>
        <p className="text-[11px] text-slate-400">{label}</p>
      </div>
    </div>
  )
}

function LocationCell({ item, type = 'check_in' }) {
  const address = type === 'check_in' ? item.check_in_address  : item.check_out_address
  const lat     = type === 'check_in' ? item.check_in_latitude : item.check_out_latitude
  const mapUrl  = attendanceLocationMapUrl(item, type)

  if (!address && !lat) return <span className="text-slate-400">–</span>

  const lng   = type === 'check_in' ? item.check_in_longitude : item.check_out_longitude
  const label = address || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`
  const Inner = (
    <>
      <MapPin size={13} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        {lat && <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">GPS Verified</p>}
      </div>
    </>
  )

  if (mapUrl) {
    return (
      <a href={mapUrl} target="_blank" rel="noreferrer" className="flex items-start gap-1.5 hover:opacity-80">
        {Inner}
      </a>
    )
  }
  return <div className="flex items-start gap-1.5">{Inner}</div>
}

function ActionBtn({ icon: Icon, label, tone, onClick }) {
  const tones = {
    slate: 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
    sky:   'border-sky-200   text-sky-600   hover:bg-sky-50   dark:border-sky-900/60 dark:hover:bg-sky-950/30',
  }
  return (
    <button
      onClick={onClick}
      title={label}
      className={clsx('grid h-8 w-8 place-items-center rounded-lg border transition', tones[tone])}
    >
      <Icon size={14} />
    </button>
  )
}

function attendancePhotoItems(item) {
  return [
    { label: 'Check In', url: item.check_in_photo_url || item.photo_url },
    { label: 'Check Out', url: item.check_out_photo_url },
  ].filter((photo) => photo.url)
}

function PhotoButton({ item, onView }) {
  const photos = attendancePhotoItems(item)

  if (photos.length === 0) {
    return <span className="text-slate-400">-</span>
  }

  return (
    <button
      type="button"
      onClick={() => onView({ item, photos })}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
      title="View photo"
    >
      <Image size={14} />
      View
    </button>
  )
}

function PhotoPreviewModal({ preview, onClose }) {
  const [activeUrl, setActiveUrl] = useState(preview.photos[0]?.url || null)
  const activePhoto = preview.photos.find((photo) => photo.url === activeUrl) || preview.photos[0]
  const employeeName = employeeFullName(preview.item.employee)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Attendance Photo</p>
            <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{employeeName || '-'}</h3>
            <p className="text-sm text-slate-500">{preview.item.employee?.employee_code || '-'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close photo preview"
          >
            <X size={18} />
          </button>
        </div>

        {preview.photos.length > 1 && (
          <div className="flex gap-2 px-5 pt-4">
            {preview.photos.map((photo) => (
              <button
                key={photo.label}
                type="button"
                onClick={() => setActiveUrl(photo.url)}
                className={clsx(
                  'h-9 rounded-lg px-3 text-xs font-bold transition',
                  activePhoto?.url === photo.url
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {photo.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-5">
          {activePhoto?.url ? (
            <img
              src={activePhoto.url}
              alt={`${activePhoto.label} attendance photo for ${employeeName}`}
              className="max-h-[70vh] w-full rounded-xl border border-slate-100 object-contain dark:border-slate-800"
            />
          ) : (
            <div className="grid h-64 place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-700">
              No photo available.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, onChange }) {
  const pages = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3)              pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center gap-1">
      <PageBtn disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={15} />
      </PageBtn>
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`ellipsis-${i}`} className="px-1 text-slate-400">...</span>
          : (
            <PageBtn key={p} active={p === page} onClick={() => onChange(p)}>
              {p}
            </PageBtn>
          )
      )}
      <PageBtn disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRight size={15} />
      </PageBtn>
    </div>
  )
}

function PageBtn({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'grid h-9 min-w-[2.25rem] place-items-center rounded-lg border px-2 text-sm font-semibold transition',
        active
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
      )}
    >
      {children}
    </button>
  )
}
