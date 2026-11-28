import clsx from 'clsx'

export const STATUS_META = {
  present: { label: 'Present', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400', dot: 'bg-emerald-500' },
  late: { label: 'Late Check In', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400', dot: 'bg-orange-500' },
  early_checkout: { label: 'Early Check Out', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300', dot: 'bg-yellow-500' },
  absent: { label: 'Absent', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400', dot: 'bg-rose-500' },
  on_leave: { label: 'Personal Leave', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400', dot: 'bg-blue-500' },
  half_day: { label: 'Half Day', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400', dot: 'bg-amber-500' },
  missing_checkin: { label: 'Missing Check In', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400', dot: 'bg-violet-500' },
  missing_checkout: { label: 'Missing Check Out', cls: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-400', dot: 'bg-fuchsia-500' },
  missing_attendance: { label: 'Missing Check In', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400', dot: 'bg-violet-500' },
  day_off: { label: 'Day Off', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400', dot: 'bg-sky-500' },
  personal_request: { label: 'Personal Leave', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400', dot: 'bg-blue-500' },
  leave: { label: 'Personal Leave', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400', dot: 'bg-blue-500' },
}

export const GPS_META = {
  verified: { label: 'Verified', cls: 'bg-emerald-100 text-emerald-700' },
  partial: { label: 'Partial', cls: 'bg-amber-100 text-amber-700' },
  unverified: { label: 'Unverified', cls: 'bg-slate-100 text-slate-600' },
}

export const TIMELINE_TONE = {
  green: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  orange: 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
  yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
  red: 'border-rose-500 bg-rose-50 dark:bg-rose-950/30',
  blue: 'border-sky-500 bg-sky-50 dark:bg-sky-950/30',
  violet: 'border-violet-500 bg-violet-50 dark:bg-violet-950/30',
}

export const inputCls = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white'

export function formatWorkHours(minutes) {
  if (minutes == null || minutes === '') return '–'
  const h = Math.floor(Number(minutes) / 60)
  const m = Number(minutes) % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export function formatLateDuration(minutes) {
  if (!minutes || Number(minutes) <= 0) return null
  const h = Math.floor(Number(minutes) / 60)
  const m = Number(minutes) % 60
  if (h > 0 && m > 0) return `Late by ${h}h ${m}m`
  if (h > 0) return `Late by ${h}h`
  return `Late by ${m}m`
}

export function formatLateShort(minutes) {
  if (!minutes || Number(minutes) <= 0) return null
  const h = Math.floor(Number(minutes) / 60)
  const m = Number(minutes) % 60
  if (h > 0 && m > 0) return `Late ${h}h ${m}m`
  if (h > 0) return `Late ${h}h`
  return `Late ${m}m`
}

export function formatMobileDate(value) {
  if (!value) return '–'
  const d = new Date(`${value}T12:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatWeekday(value) {
  if (!value) return ''
  const d = new Date(`${value}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { weekday: 'long' })
}

export function formatMonthLabel(monthValue) {
  if (!monthValue) return ''
  const d = new Date(`${monthValue.length === 7 ? `${monthValue}-01` : monthValue}T12:00:00`)
  if (Number.isNaN(d.getTime())) return monthValue
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function formatHoursCompact(minutes) {
  if (minutes == null || minutes === '') return '0h'
  const h = Math.floor(Number(minutes) / 60)
  const m = Number(minutes) % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatDateWithDay(value) {
  if (!value) return '–'
  const d = new Date(`${value}T12:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatPeriodLabel(from, to) {
  const fmt = (v) => {
    const d = new Date(`${v}T12:00:00`)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return `${fmt(from)} – ${fmt(to)}`
}

export function formatBranchName(branch) {
  if (!branch) return ''
  if (typeof branch === 'string') return branch
  return branch.name || branch.code || branch.address || ''
}

export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function currentMonthStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthStartStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function monthEndStr() {
  const d = new Date()
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize', meta.cls)}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}

export function GpsBadge({ status }) {
  const meta = GPS_META[status] || GPS_META.unverified
  return <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-bold', meta.cls)}>{meta.label}</span>
}

export function TypeBadge({ type }) {
  const isOutdoor = type === 'outdoor'
  return (
    <span className={clsx(
      'rounded-full px-2.5 py-0.5 text-xs font-bold capitalize',
      isOutdoor ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    )}>
      {isOutdoor ? 'Outdoor' : 'Office'}
    </span>
  )
}

const KPI_TONE = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-500/30',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    bar: 'bg-emerald-500',
    glow: 'from-emerald-500/12 to-transparent',
    activeRing: 'ring-2 ring-emerald-500 border-emerald-500/50',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-950/60 dark:text-amber-400 dark:ring-amber-500/30',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    bar: 'bg-amber-500',
    glow: 'from-amber-500/12 to-transparent',
    activeRing: 'ring-2 ring-amber-500 border-amber-500/50',
  },
  orange: {
    icon: 'bg-orange-50 text-orange-600 ring-1 ring-orange-500/20 dark:bg-orange-950/60 dark:text-orange-400 dark:ring-orange-500/30',
    badge: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
    bar: 'bg-orange-500',
    glow: 'from-orange-500/12 to-transparent',
    activeRing: 'ring-2 ring-orange-500 border-orange-500/50',
  },
  yellow: {
    icon: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-500/25 dark:bg-yellow-950/60 dark:text-yellow-300 dark:ring-yellow-500/30',
    badge: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300',
    bar: 'bg-yellow-500',
    glow: 'from-yellow-500/12 to-transparent',
    activeRing: 'ring-2 ring-yellow-500 border-yellow-500/50',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-600 ring-1 ring-rose-500/20 dark:bg-rose-950/60 dark:text-rose-400 dark:ring-rose-500/30',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    bar: 'bg-rose-500',
    glow: 'from-rose-500/12 to-transparent',
    activeRing: 'ring-2 ring-rose-500 border-rose-500/50',
  },
  red: {
    icon: 'bg-rose-50 text-rose-600 ring-1 ring-rose-500/20 dark:bg-rose-950/60 dark:text-rose-400 dark:ring-rose-500/30',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    bar: 'bg-rose-500',
    glow: 'from-rose-500/12 to-transparent',
    activeRing: 'ring-2 ring-rose-500 border-rose-500/50',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600 ring-1 ring-violet-500/20 dark:bg-violet-950/60 dark:text-violet-400 dark:ring-violet-500/30',
    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
    bar: 'bg-violet-500',
    glow: 'from-violet-500/12 to-transparent',
    activeRing: 'ring-2 ring-violet-500 border-violet-500/50',
  },
  fuchsia: {
    icon: 'bg-fuchsia-50 text-fuchsia-600 ring-1 ring-fuchsia-500/20 dark:bg-fuchsia-950/60 dark:text-fuchsia-400 dark:ring-fuchsia-500/30',
    badge: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300',
    bar: 'bg-fuchsia-500',
    glow: 'from-fuchsia-500/12 to-transparent',
    activeRing: 'ring-2 ring-fuchsia-500 border-fuchsia-500/50',
  },
  blue: {
    icon: 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/20 dark:bg-blue-950/60 dark:text-blue-400 dark:ring-blue-500/30',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    bar: 'bg-blue-500',
    glow: 'from-blue-500/12 to-transparent',
    activeRing: 'ring-2 ring-blue-500 border-blue-500/50',
  },
  sky: {
    icon: 'bg-sky-50 text-sky-600 ring-1 ring-sky-500/20 dark:bg-sky-950/60 dark:text-sky-400 dark:ring-sky-500/30',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    bar: 'bg-sky-500',
    glow: 'from-sky-500/12 to-transparent',
    activeRing: 'ring-2 ring-sky-500 border-sky-500/50',
  },
  teal: {
    icon: 'bg-teal-50 text-teal-600 ring-1 ring-teal-500/20 dark:bg-teal-950/60 dark:text-teal-400 dark:ring-teal-500/30',
    badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    bar: 'bg-teal-500',
    glow: 'from-teal-500/12 to-transparent',
    activeRing: 'ring-2 ring-teal-500 border-teal-500/50',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-1 ring-slate-400/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    bar: 'bg-slate-500',
    glow: 'from-slate-500/10 to-transparent',
    activeRing: 'ring-2 ring-slate-500 border-slate-500/50',
  },
}

export function SummaryStat({ label, value, tone = 'emerald', help }) {
  const t = KPI_TONE[tone] || KPI_TONE.emerald
  return (
    <div className="relative overflow-hidden px-5 py-5 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
      <div className="flex items-center gap-2">
        <span className={clsx('h-2 w-2 shrink-0 rounded-full', t.bar)} />
        <p className="truncate text-xs font-bold text-slate-600 dark:text-slate-300">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums text-slate-950 dark:text-white">
        {value}
      </p>
      {help != null && help !== '' && (
        <p className="mt-1 truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">{help}</p>
      )}
    </div>
  )
}

export function DashboardSummaryCard({ title, subtitle, stats, headerRight, columns = 4 }) {
  const colClass = {
    4: 'grid-cols-2 sm:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5',
  }[columns] || 'grid-cols-2 sm:grid-cols-4'

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-5 py-3.5 text-white">
        <div>
          <p className="text-base font-extrabold tracking-tight sm:text-lg">{title}</p>
          {subtitle && <p className="text-xs font-medium text-emerald-100">{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      <div className={clsx('grid divide-x divide-y divide-slate-100 dark:divide-slate-800 sm:divide-y-0', colClass)}>
        {stats.map((s) => (
          <SummaryStat key={s.label} label={s.label} value={s.value} tone={s.tone} help={s.help} />
        ))}
      </div>
    </article>
  )
}

export function SummaryCard({ label, value, pct, trend, icon: Icon, tone = 'emerald', active = false, onClick }) {
  const t = KPI_TONE[tone] || KPI_TONE.emerald
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
      {/* Left accent stripe */}
      <span className={clsx('absolute inset-y-2 left-0 w-1 rounded-r-full transition-opacity', t.bar, active ? 'opacity-100' : 'opacity-65 group-hover:opacity-100')} />

      {/* Compact Icon */}
      <div className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-transform duration-150 group-hover:scale-105', t.icon)}>
        {Icon && <Icon size={17} strokeWidth={2.1} />}
      </div>

      {/* Label + Value inline */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div className="mt-0.5 flex items-baseline justify-between gap-1.5">
          <p className="truncate text-lg font-extrabold leading-tight tracking-tight tabular-nums text-slate-950 dark:text-white">
            {value}
          </p>
          {pct != null ? (
            <span className={clsx('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums', t.badge)}>
              {pct}
            </span>
          ) : trend ? (
            <span className="truncate text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {trend}
            </span>
          ) : null}
        </div>
      </div>
    </Wrapper>
  )
}
