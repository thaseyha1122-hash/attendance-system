import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, Calendar, Check, ChevronDown, ChevronRight, Clock,
  ClipboardList, Download, FileSpreadsheet, Filter, Printer, MapPin, RotateCcw, Timer, UserMinus, Users,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../services/api'
import { EmptyState, FloatingSpinner } from '../components/shared/UI'
import AttendanceDetailModal from '../components/attendance/reports/AttendanceDetailModal'
import MyAttendanceReportsDesktop from '../components/attendance/reports/MyAttendanceReportsDesktop'
import {
  StatusBadge, formatHoursCompact,
  formatBranchName,
  formatMobileDate, formatMonthLabel, formatPeriodLabel, formatWorkHours,
} from '../components/attendance/reports/attendanceReportShared'
import { apiError, canAccess } from '../utils/format'

export default function MyAttendanceReportsPage({ user, openPermissionRequest }) {
  const [month, setMonth] = useState(currentMonth())
  const [customOpen, setCustomOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState(firstOfMonth())
  const [customTo, setCustomTo] = useState(todayStr())
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [branch, setBranch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [data, setData] = useState({ employee: null, summary: {}, records: [] })
  const [detail, setDetail] = useState(null)
  const [mobileFullOpen, setMobileFullOpen] = useState(false)
  const [mobileFullTab, setMobileFullTab] = useState('history')

  const canExport = canAccess(user, ['reports.attendance.export', 'reports.attendance.view_own', 'attendance.view_own'])

  const useRange = customOpen && Boolean(customFrom) && Boolean(customTo) && customTo >= customFrom
  const periodParams = useCallback(() => (useRange ? { from: customFrom, to: customTo } : { month }), [useRange, customFrom, customTo, month])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = periodParams()
      if (status) params.status = status
      if (type) params.type = type
      const res = await api.get('/attendance/reports/employee', { params })
      setData(res.data)
    } catch (ex) {
      setError(apiError(ex))
      setData({ employee: null, summary: {}, records: [] })
    } finally {
      setLoading(false)
    }
  }, [periodParams, status, type])

  useEffect(() => {
    // Reload report data whenever the selected report filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const summary = data.summary || {}
  const records = useMemo(() => {
    const list = data.records || []
    if (!branch) return list
    return list.filter((record) => formatBranchName(record.branch) === branch)
  }, [data.records, branch])
  const monthRange = useMemo(() => (useRange ? { from: customFrom, to: customTo } : getMonthRange(month)), [useRange, customFrom, customTo, month])
  const viewMonth = useRange ? customFrom.slice(0, 7) : month
  const changeViewMonth = (value) => { setCustomOpen(false); setMonth(value) }
  const mobileRecords = records.slice(0, 4)

  useEffect(() => {
    // Reset the full mobile view when report filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileFullOpen(false)
    setMobileFullTab('history')
  }, [month, customOpen, customFrom, customTo, status, type, branch])

  const period = customOpen ? 'custom' : month === currentMonth() ? 'this' : month === shiftMonthValue(currentMonth(), -1) ? 'last' : 'custom'
  const changePeriod = (value) => {
    if (value === 'this') { setCustomOpen(false); setMonth(currentMonth()) }
    else if (value === 'last') { setCustomOpen(false); setMonth(shiftMonthValue(currentMonth(), -1)) }
    else setCustomOpen(true)
  }

  const printReport = () => {
    const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]))
    const rows = records.map((r) => `<tr><td>${esc(r.attendance_date)}</td><td>${esc(shortTime(r.check_in_at) || '-')}</td><td>${esc(shortTime(r.check_out_at) || '-')}</td><td>${esc(formatWorkHours(r.work_minutes))}</td><td>${esc(r.late_minutes > 0 ? `${r.late_minutes}m` : '0m')}</td><td>${esc(String(r.display_status || r.status || '').replace(/_/g, ' '))}</td></tr>`).join('')
    const win = window.open('', '_blank')
    if (!win) { window.alert('Please allow pop-ups to print.'); return }
    win.document.write(`<html><head><title>My Attendance ${esc(monthRange.from)} to ${esc(monthRange.to)}</title><style>body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a}h1{font-size:18px;margin:0 0 4px}p{margin:0 0 16px;color:#64748b;font-size:12px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}th{background:#f1f5f9}</style></head><body><h1>My Attendance Report</h1><p>${esc(formatPeriodLabel(monthRange.from, monthRange.to))}</p><table><thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Late</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }
  const resetMobileFilters = () => {
    setMonth(currentMonth())
    setCustomOpen(false)
    setCustomFrom(firstOfMonth())
    setCustomTo(todayStr())
    setStatus('')
    setType('')
    setBranch('')
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const params = periodParams()
      if (status) params.status = status
      if (type) params.type = type
      const res = await api.get('/attendance/reports/export', { params, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `my-attendance-${monthRange.from}-to-${monthRange.to}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      window.alert('Export failed.')
    } finally {
      setExporting(false)
    }
  }

  if (!loading && error) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <EmptyState title="Cannot load attendance reports" description={error} />
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-md space-y-5 pb-8 md:max-w-3xl lg:hidden">
        {detail ? (
          <MobileAttendanceDetail
            record={detail}
            onBack={() => setDetail(null)}
          />
        ) : mobileFullOpen ? (
          <MobileFullAttendanceView
            activeTab={mobileFullTab}
            setActiveTab={setMobileFullTab}
            records={records}
            month={viewMonth}
            summary={summary}
            onBack={() => setMobileFullOpen(false)}
            onMonthChange={changeViewMonth}
            onSelectDate={(row) => row && setDetail(row)}
          />
        ) : (
          <>
            <MobileFilters
              period={period}
              customFrom={customFrom}
              customTo={customTo}
              monthRange={monthRange}
              status={status}
              type={type}
              branch={branch}
              onPeriodChange={changePeriod}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
              onStatusChange={setStatus}
              onTypeChange={setType}
              onBranchChange={setBranch}
              allRecords={data.records || []}
              onReset={resetMobileFilters}
            />

            <MobileReportActions
              canExport={canExport}
              exporting={exporting}
              onExport={exportCsv}
              onPrint={printReport}
              onCorrection={() => openPermissionRequest?.('Missing Check In')}
            />
            <section>
              <h3 className="mb-3 text-base font-extrabold text-slate-950 dark:text-white">This Month</h3>
              <MobileStatsGrid summary={summary} loading={loading} />
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-emerald-500" />
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Attendance History</h3>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400"
                  onClick={() => setMobileFullOpen(true)}
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>

              {loading ? (
                <div className="py-16"><FloatingSpinner /></div>
              ) : records.length === 0 ? (
                <EmptyState title="No attendance records" description="No data for this period." />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {mobileRecords.map((row) => (
                    <MobileDayCard key={row.id} row={row} onTap={() => setDetail(row)} />
                  ))}
                </div>
              )}
            </section>

            <MobileCalendar
              month={viewMonth}
              records={records}
              selectedDate=""
              onMonthChange={changeViewMonth}
              onSelectDate={(row) => row && setDetail(row)}
            />
          </>
        )}
      </div>

      <div className="hidden lg:block">
        <MyAttendanceReportsDesktop
          summary={summary}
          records={records}
          allRecords={data.records || []}
          loading={loading}
          month={month}
          status={status}
          type={type}
          branch={branch}
          onMonthChange={setMonth}
          onStatusChange={setStatus}
          onTypeChange={setType}
          onBranchChange={setBranch}
          onReset={resetMobileFilters}
          onView={setDetail}
          canExport={canExport}
          exporting={exporting}
          exportCsv={exportCsv}
          openPermissionRequest={openPermissionRequest}
        />
      </div>

      {detail && (
        <div className="hidden lg:block">
        <AttendanceDetailModal record={detail} onClose={() => setDetail(null)} canEdit={false} />
        </div>
      )}
    </>
  )
}

function MobileReportActions({ canExport, exporting, onExport, onPrint, onCorrection }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="flex flex-wrap items-center gap-3">
      {canExport && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={exporting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 transition active:scale-[0.99] disabled:opacity-60"
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export'}
            <ChevronDown size={15} className={clsx('transition', open && 'rotate-180')} />
          </button>
          {open && (
            <>
              <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-[calc(100%+0.4rem)] z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <button type="button" onClick={() => { setOpen(false); onExport() }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                  <FileSpreadsheet size={16} className="text-emerald-600" /> Excel (.csv)
                </button>
                <button type="button" onClick={() => { setOpen(false); onPrint() }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                  <Printer size={16} className="text-slate-500" /> Print
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={onCorrection}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-900 shadow-sm transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      >
        <ClipboardList size={16} />
        Request Correction
      </button>
    </section>
  )
}
function MobileStatsGrid({ summary, loading }) {
  const stats = [
    { label: 'Present Days', value: loading ? '-' : (summary.present ?? 0), icon: Users, tone: 'emerald' },
    { label: 'Late Check In', value: loading ? '-' : (summary.late ?? 0), icon: Clock, tone: 'orange' },
    { label: 'Absent Days', value: loading ? '-' : (summary.absent ?? 0), icon: UserMinus, tone: 'rose' },
    { label: 'Early Check Out', value: loading ? '-' : (summary.early_checkout ?? 0), icon: Timer, tone: 'yellow' },
    { label: 'Day Off', value: loading ? '-' : (summary.day_off ?? 0), icon: Calendar, tone: 'sky' },
    { label: 'Missing Check In', value: loading ? '-' : (summary.missing_checkin ?? summary.missing_attendance ?? 0), icon: ClipboardList, tone: 'violet' },
    { label: 'Missing Check Out', value: loading ? '-' : (summary.missing_checkout ?? 0), icon: ClipboardList, tone: 'fuchsia' },
    { label: 'Personal Leave', value: loading ? '-' : (summary.personal_request ?? summary.on_leave ?? 0), icon: ClipboardList, tone: 'blue' },
    { label: 'Total Working Hours', value: loading ? '-' : formatHoursCompact(summary.total_work_minutes), icon: Timer, tone: 'sky' },
    { label: 'Overtime Hours', value: loading ? '-' : formatHoursCompact(summary.overtime_minutes), icon: Clock, tone: 'violet' },
  ]
  const primary = stats.slice(0, 3)
  const hours = stats.slice(8, 10)
  const others = stats.slice(3, 8)
  const big = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    orange: 'text-orange-500',
    rose: 'text-rose-500',
  }

  return (
    <section className="space-y-3">
      <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
          {primary.map((item) => (
            <div key={item.label} className="px-3 py-4 text-center">
              <p className={clsx('text-3xl font-extrabold tabular-nums leading-none', big[item.tone])}>{item.value}</p>
              <p className="mt-2 text-[11px] font-bold leading-tight text-slate-500 dark:text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/70 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/30">
          {hours.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 px-4 py-3">
              <item.icon size={16} className="shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="text-sm font-extrabold text-slate-950 dark:text-white">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </article>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {others.map((item) => <MobileStatTile key={item.label} {...item} />)}
      </div>
    </section>
  )
}

function MobileStatTile({ label, value, icon: Icon, tone }) {
  const tones = {
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/50 dark:text-fuchsia-300',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300',
  }

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', tones[tone] || tones.sky)}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-extrabold leading-none text-slate-950 dark:text-white">{value}</p>
        <p className="mt-1 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </article>
  )
}
function MobileFilters({
  period, customFrom, customTo, monthRange, status, type, branch,
  onPeriodChange, onCustomFromChange, onCustomToChange, onStatusChange, onTypeChange, onBranchChange,
  allRecords, onReset,
}) {
  const locations = useMemo(() => [...new Set(allRecords.map((record) => formatBranchName(record.branch)).filter(Boolean))], [allRecords])
  const field = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
          <Filter size={16} className="text-emerald-500" />
          Filters
        </span>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400">
          <RotateCcw size={13} />
          Reset
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MobileFilterField label="Date">
          <select className={field} value={period} onChange={(event) => onPeriodChange(event.target.value)}>
            <option value="this">This Month</option>
            <option value="last">Last Month</option>
            <option value="custom">Custom</option>
          </select>
        </MobileFilterField>
        {period === 'custom' && (
          <>
            <MobileFilterField label="From Date">
              <input className={field} type="date" value={customFrom} max={customTo || undefined} onChange={(event) => onCustomFromChange(event.target.value)} />
            </MobileFilterField>
            <MobileFilterField label="To Date">
              <input className={field} type="date" value={customTo} min={customFrom || undefined} onChange={(event) => onCustomToChange(event.target.value)} />
            </MobileFilterField>
          </>
        )}
        <MobileFilterField label="Status">
          <select className={field} value={status} onChange={(event) => onStatusChange(event.target.value)}>
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late Check In</option>
            <option value="early_checkout">Early Check Out</option>
            <option value="day_off">Day Off</option>
            <option value="missing_checkin">Missing Check In</option>
            <option value="missing_checkout">Missing Check Out</option>
            <option value="personal_request">Personal Leave</option>
            <option value="absent">Absent</option>
          </select>
        </MobileFilterField>
        <MobileFilterField label="Type">
          <select className={field} value={type} onChange={(event) => onTypeChange(event.target.value)}>
            <option value="">All Types</option>
            <option value="office">Office</option>
            <option value="outdoor">Outdoor</option>
          </select>
        </MobileFilterField>
        <MobileFilterField label="Location">
          <select className={field} value={branch} onChange={(event) => onBranchChange(event.target.value)}>
            <option value="">All Locations</option>
            {locations.map((location) => <option key={location} value={location}>{location}</option>)}
          </select>
        </MobileFilterField>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Calendar size={13} />
        {formatPeriodLabel(monthRange.from, monthRange.to)}
      </p>
    </section>
  )
}
function MobileFilterField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      {children}
    </label>
  )
}

function MobileDayCard({ row, onTap }) {
  const displayStatus = row.display_status || row.status
  const statusTone = mobileStatusTone(displayStatus)

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      onClick={onTap}
      onKeyDown={(event) => event.key === 'Enter' && onTap()}
      role="button"
      tabIndex={0}
    >
      <span className={clsx('absolute inset-y-0 left-0 w-1.5', {
        'bg-emerald-500': statusTone === 'green',
        'bg-amber-500': statusTone === 'orange',
        'bg-yellow-500': statusTone === 'yellow',
        'bg-rose-500': statusTone === 'red',
        'bg-sky-500': statusTone === 'sky',
        'bg-violet-500': statusTone === 'violet',
        'bg-fuchsia-500': statusTone === 'fuchsia',
        'bg-blue-500': statusTone === 'blue',
      })} />
      <div className="flex items-center gap-3 px-4 py-3.5 pl-5">
        <div className={clsx('grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-center', {
          'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40': statusTone === 'green',
          'bg-amber-50 text-amber-700 dark:bg-amber-950/40': statusTone === 'orange',
          'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40': statusTone === 'yellow',
          'bg-rose-50 text-rose-700 dark:bg-rose-950/40': statusTone === 'red',
          'bg-sky-50 text-sky-700 dark:bg-sky-950/40': statusTone === 'sky',
          'bg-violet-50 text-violet-700 dark:bg-violet-950/40': statusTone === 'violet',
          'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40': statusTone === 'fuchsia',
          'bg-blue-50 text-blue-700 dark:bg-blue-950/40': statusTone === 'blue',
        })}>
          <div>
            <p className="text-sm font-bold">{monthShort(row.attendance_date)}</p>
            <p className="text-2xl font-extrabold leading-none">{dayNumber(row.attendance_date)}</p>
            <p className="mt-1 text-xs font-bold">{formatDayShort(row.attendance_date)}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-base font-extrabold text-slate-950 dark:text-white">{timeRange(row)}</p>
            <StatusBadge status={displayStatus} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500">Working Hours</p>
              <p className="mt-0.5 font-extrabold text-slate-900 dark:text-white">{formatWorkHours(row.work_minutes)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Late Check In</p>
              <p className={clsx('mt-0.5 font-extrabold', row.late_minutes > 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white')}>
                {row.late_minutes > 0 ? `${row.late_minutes}m` : '0m'}
              </p>
            </div>
          </div>
        </div>
        <ChevronRight size={22} className="shrink-0 text-slate-800 dark:text-slate-200" />
      </div>
    </article>
  )
}

function MobileCalendar({ month, records, selectedDate, onMonthChange, onSelectDate }) {
  const recordByDate = useMemo(() => {
    const map = {}
    records.forEach((record) => { map[record.attendance_date] = record })
    return map
  }, [records])
  const cells = useMemo(() => buildCalendarCells(month), [month])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-emerald-500" />
          <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <p className="mr-2 text-sm font-bold text-slate-800 dark:text-slate-100">{formatMonthLabel(month)}</p>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700" onClick={() => shiftMonth(month, -1, onMonthChange)} aria-label="Previous month">
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700" onClick={() => shiftMonth(month, 1, onMonthChange)} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} className="h-9" />
          const record = recordByDate[date]
          const active = selectedDate === date
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(record)}
              className={clsx(
                'relative grid h-9 place-items-center rounded-full text-sm font-bold',
                active ? 'bg-emerald-600 text-white' : record ? 'text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800' : 'text-slate-400',
              )}
            >
              {dayNumber(date)}
              {record && <span className={clsx('absolute bottom-1 h-1 w-1 rounded-full', statusDotClass(record), active && 'bg-white')} />}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function MobileFullAttendanceView({
  activeTab, setActiveTab, records, month, summary, onBack, onMonthChange, onSelectDate,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft size={21} />
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-extrabold text-slate-950 dark:text-white">My Attendance History</h2>
          <p className="text-sm font-semibold text-slate-500">{formatMonthLabel(month)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {['history', 'calendar', 'timeline'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'h-12 rounded-xl text-sm font-extrabold capitalize transition',
              activeTab === tab ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-700 dark:text-slate-200',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'history' && (
        records.length === 0 ? (
          <EmptyState title="No attendance records" description="No data for this period." />
        ) : (
          <section className="grid gap-3 md:grid-cols-2">
            {records.map((row) => (
              <MobileDayCard key={row.id} row={row} onTap={() => onSelectDate(row)} />
            ))}
          </section>
        )
      )}

      {activeTab === 'calendar' && (
        <>
          <MobileCalendar
            month={month}
            records={records}
            selectedDate=""
            onMonthChange={onMonthChange}
            onSelectDate={onSelectDate}
          />
          <MobileAttendanceSummary summary={summary} />
        </>
      )}

      {activeTab === 'timeline' && (
        records.length === 0 ? (
          <EmptyState title="No attendance records" description="No data for this period." />
        ) : (
          <section className="space-y-3">
            {records.map((record) => (
              <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-extrabold text-slate-950 dark:text-white">{formatMobileDate(record.attendance_date)}</p>
                    <p className="text-sm font-semibold text-slate-500">{formatDayShort(record.attendance_date)}</p>
                  </div>
                  <StatusBadge status={record.display_status || record.status} />
                </div>
                <TimelineList record={record} timeline={record.timeline || []} compact />
              </article>
            ))}
          </section>
        )
      )}
    </div>
  )
}

function MobileAttendanceDetail({ record, onBack }) {
  return (
    <div className="space-y-3">
      <MobileDetailCard record={record} />
      <button
        type="button"
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        Back
      </button>
    </div>
  )
}

function MobileDetailCard({ record }) {
  const timeline = record.timeline || []
  const displayStatus = record.display_status || record.status

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={clsx('flex items-center justify-between px-5 py-4', displayStatus === 'late' ? 'bg-amber-50 dark:bg-amber-950/30' : displayStatus === 'absent' ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30')}>
        <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white">
          <Check size={24} />
        </span>
        <StatusBadge status={displayStatus} />
      </div>
      <div className="p-5">
        <TimelineList record={record} timeline={timeline} compact />
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-slate-100 pt-5 dark:border-slate-800">
          <DetailMetric label="Working Hours" value={formatWorkHours(record.work_minutes)} />
          <DetailMetric label="Overtime Hours" value={formatWorkHours(Math.max(0, record.overtime_minutes ?? ((record.work_minutes || 0) - 480)))} />
          <DetailMetric label="Late Check In Minutes" value={`${record.late_minutes ?? 0}m`} />
          <DetailMetric label="Attendance Type" value={record.type === 'outdoor' ? 'Outdoor' : 'Office'} />
        </div>
      </div>
    </section>
  )
}

function TimelineList({ record, timeline, compact = false }) {
  const branchName = formatBranchName(record.branch)

  return (
    <div className="relative border-l-2 border-slate-100 pl-6 dark:border-slate-800">
      {timeline.map((event) => (
        <div key={event.key} className={clsx('relative', compact ? 'pb-5 last:pb-0' : 'pb-7 last:pb-0')}>
          <span className={clsx(
            'absolute -left-[2.05rem] top-0 grid h-8 w-8 place-items-center rounded-full border-4 border-white text-white shadow-sm dark:border-slate-900',
            event.tone === 'orange' ? 'bg-amber-500' : event.tone === 'blue' ? 'bg-blue-500' : event.tone === 'red' ? 'bg-rose-500' : 'bg-emerald-600',
          )}>
            <Clock size={14} />
          </span>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-extrabold text-slate-950 dark:text-white">{event.label}</p>
              {event.note && <p className="mt-0.5 text-sm font-medium text-slate-500">{event.note}</p>}
              {(event.key === 'check_in' || event.key === 'check_out') && (branchName || record.location) && (
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <MapPin size={12} />
                  {branchName || record.location}
                </p>
              )}
            </div>
            <p className="shrink-0 font-extrabold tabular-nums text-slate-950 dark:text-white">{event.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailMetric({ label, value }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}

function MobileAttendanceSummary({ summary }) {
  const rows = [
    { label: 'Total Present Days', value: summary.present ?? 0, icon: Users, tone: 'emerald' },
    { label: 'Total Late Check In', value: summary.late ?? 0, icon: Clock, tone: 'orange' },
    { label: 'Total Absent Days', value: summary.absent ?? 0, icon: UserMinus, tone: 'rose' },
    { label: 'Total Early Check Out', value: summary.early_checkout ?? 0, icon: Timer, tone: 'yellow' },
    { label: 'Total Day Off', value: summary.day_off ?? 0, icon: Calendar, tone: 'sky' },
    { label: 'Total Missing Check In', value: summary.missing_checkin ?? summary.missing_attendance ?? 0, icon: ClipboardList, tone: 'violet' },
    { label: 'Total Missing Check Out', value: summary.missing_checkout ?? 0, icon: ClipboardList, tone: 'fuchsia' },
    { label: 'Total Personal Leave', value: summary.personal_request ?? summary.on_leave ?? 0, icon: ClipboardList, tone: 'blue' },
    { label: 'Total Working Hours', value: formatHoursCompact(summary.total_work_minutes), icon: Timer, tone: 'sky' },
    { label: 'Overtime Hours', value: formatHoursCompact(summary.overtime_minutes), icon: Clock, tone: 'violet' },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="border-b border-slate-100 px-5 py-4 text-xl font-extrabold text-slate-950 dark:border-slate-800 dark:text-white">Attendance Summary</h3>
      <div className="divide-y divide-slate-100 px-5 dark:divide-slate-800">
        {rows.map((row) => <SummaryRow key={row.label} {...row} />)}
      </div>
    </section>
  )
}

function SummaryRow({ label, value, icon: Icon, tone }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-3">
        <SummaryIcon Icon={Icon} tone={tone} />
        <span className="font-bold text-slate-800 dark:text-slate-100">{label}</span>
      </div>
      <span className="text-lg font-extrabold text-slate-950 dark:text-white">{value}</span>
    </div>
  )
}

function SummaryIcon({ Icon, tone }) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    orange: 'bg-orange-100 text-orange-600',
    yellow: 'bg-yellow-100 text-yellow-700',
    rose: 'bg-rose-100 text-rose-600',
    sky: 'bg-sky-100 text-sky-600',
    violet: 'bg-violet-100 text-violet-600',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-600',
    blue: 'bg-blue-100 text-blue-600',
  }

  return (
    <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', tones[tone] || tones.emerald)}>
      <Icon size={20} />
    </span>
  )
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
}

function firstOfMonth() {
  return todayStr().slice(0, 8) + '01'
}

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonthValue(monthStr, delta) {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMonthRange(monthStr) {
  const [year, month] = monthStr.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return {
    from: `${monthStr}-01`,
    to: `${monthStr}-${String(lastDay).padStart(2, '0')}`,
  }
}

function buildCalendarCells(monthStr) {
  const [year, month] = monthStr.split('-').map(Number)
  const firstDow = new Date(year, month - 1, 1).getDay()
  const days = new Date(year, month, 0).getDate()
  const cells = Array(firstDow).fill(null)
  for (let day = 1; day <= days; day += 1) {
    cells.push(`${monthStr}-${String(day).padStart(2, '0')}`)
  }
  return cells
}

function dayNumber(dateStr) {
  if (!dateStr) return ''
  return Number(dateStr.split('-')[2])
}

function monthShort(dateStr) {
  if (!dateStr) return ''
  const date = new Date(`${dateStr}T12:00:00`)
  return date.toLocaleDateString(undefined, { month: 'short' })
}

function formatDayShort(dateStr) {
  if (!dateStr) return ''
  const date = new Date(`${dateStr}T12:00:00`)
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

function timeRange(row) {
  const checkIn = shortTime(row.check_in_at)
  const checkOut = shortTime(row.check_out_at)
  if (!checkIn && !checkOut) return '-'
  return `${checkIn || '-'} - ${checkOut || '-'}`
}

function shortTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function statusDotClass(row) {
  const status = row.display_status || row.status
  if (status === 'late') return 'bg-orange-500'
  if (status === 'early_checkout') return 'bg-yellow-500'
  if (status === 'absent') return 'bg-rose-500'
  if (status === 'day_off') return 'bg-sky-500'
  if (status === 'missing_checkin' || status === 'missing_attendance') return 'bg-violet-500'
  if (status === 'missing_checkout') return 'bg-fuchsia-500'
  if (status === 'half_day') return 'bg-amber-500'
  if (status === 'personal_request' || status === 'on_leave' || status === 'leave') return 'bg-blue-500'
  return 'bg-emerald-500'
}

function mobileStatusTone(status) {
  if (status === 'late') return 'orange'
  if (status === 'early_checkout') return 'yellow'
  if (status === 'absent') return 'red'
  if (status === 'day_off') return 'sky'
  if (status === 'missing_checkin' || status === 'missing_attendance') return 'violet'
  if (status === 'missing_checkout') return 'fuchsia'
  if (status === 'half_day') return 'amber'
  if (status === 'personal_request' || status === 'on_leave' || status === 'leave') return 'blue'
  return 'green'
}

function shiftMonth(monthStr, delta, onChange) {
  const [year, month] = monthStr.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
}
