import { useEffect } from 'react'
import clsx from 'clsx'
import { CalendarCheck, CheckCircle2, FileCheck2, Hand, Home, UserRound } from 'lucide-react'
import { canAccess } from '../../utils/format'

export default function MobileNav({ active, setActive, user, onAttendanceAction, todayAttendance, refreshTodayAttendance }) {
  const checkedIn = Boolean(todayAttendance?.check_in_at)
  const completed = Boolean(todayAttendance?.check_out_at)
  const centerLabel = completed ? 'Done' : checkedIn ? 'Check Out' : 'Check In'

  const fabClass = completed
    ? 'from-slate-400 to-slate-500 shadow-slate-500/35'
    : checkedIn
      ? 'from-amber-400 to-amber-600 shadow-amber-500/45'
      : 'from-emerald-400 to-emerald-600 shadow-emerald-500/45'

  const fabLabelColor = completed
    ? 'text-slate-400'
    : checkedIn
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400'

  const isAttendanceActive = active === 'My Attendance Reports'

  useEffect(() => {
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshTodayAttendance?.()
      }
    }
    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshOnFocus)

    return () => {
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshOnFocus)
    }
  }, [refreshTodayAttendance])

  const handleCenterAction = async () => {
    let next = todayAttendance

    if (refreshTodayAttendance) {
      next = await refreshTodayAttendance()
    }

    const isCheckedIn = Boolean(next?.check_in_at)
    const isCompleted = Boolean(next?.check_out_at)
    if (isCompleted) return

    onAttendanceAction(isCheckedIn ? 'check-out' : 'check-in')
  }

  const leftItems = [
    {
      key: 'home',
      label: 'Home',
      icon: Home,
      isActive: active === 'Dashboard',
      show: canAccess(user, ['dashboard.admin', 'dashboard.employee']),
      onClick: () => setActive('Dashboard'),
    },
    {
      key: 'attendance',
      label: 'Attendance',
      icon: CalendarCheck,
      isActive: isAttendanceActive,
      show: canAccess(user, ['reports.attendance.view_own', 'attendance.view_own']),
      onClick: () => setActive('My Attendance Reports'),
    },
  ]

  const rightItems = [
    {
      key: 'requests',
      label: 'Requests',
      icon: FileCheck2,
      isActive: active === 'Permission Requests',
      show: canAccess(user, ['requests.view_all', 'requests.view_own', 'requests.create', 'requests.approve']),
      onClick: () => setActive('Permission Requests'),
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: UserRound,
      isActive: active === 'Profile',
      show: canAccess(user, ['profile.update_own', 'profile.update_all', 'dashboard.admin', 'dashboard.employee']),
      onClick: () => setActive('Profile'),
    },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 lg:hidden" aria-label="Mobile navigation">
      <div className="rounded-t-3xl border-t border-slate-200/80 bg-white/95 shadow-[0_-10px_40px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/95">
        <div
          className="grid grid-cols-5 items-end gap-0 px-1.5 pt-1.5"
          style={{ paddingBottom: 'max(0.9rem, env(safe-area-inset-bottom))' }}
        >
          <div className="col-span-2 grid grid-cols-2">
            {leftItems.map((item) => (
              <NavSlot key={item.key} item={item} />
            ))}
          </div>

          <div className="flex flex-col items-center justify-end pb-0.5">
            <button
              type="button"
              disabled={completed}
              onClick={handleCenterAction}
              className="flex flex-col items-center gap-1 disabled:opacity-65"
              aria-label={centerLabel}
            >
              <span
                className={clsx(
                  'grid h-14 w-14 -translate-y-4 place-items-center rounded-full bg-gradient-to-br text-white ring-4 ring-white transition-all duration-200 active:scale-95 dark:ring-slate-900 sm:h-15 sm:w-15',
                  'shadow-[0_10px_28px_-4px]',
                  fabClass,
                )}
              >
                {completed ? <CheckCircle2 size={24} strokeWidth={2.1} /> : <Hand size={23} strokeWidth={1.8} />}
              </span>
              <span className={clsx('-mt-3 text-[10px] font-bold tracking-tight', fabLabelColor)}>
                {centerLabel}
              </span>
            </button>
          </div>

          <div className="col-span-2 grid grid-cols-2">
            {rightItems.map((item) => (
              <NavSlot key={item.key} item={item} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavSlot({ item }) {
  if (!item?.show) {
    return <div className="min-h-[52px]" aria-hidden />
  }

  return <NavItem item={item} onClick={item.onClick} />
}

function NavItem({ item, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex w-full flex-col items-center gap-1 px-1 pb-1 pt-2.5 transition-all duration-150 active:scale-95"
    >
      <span
        className={clsx(
          'absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full transition-all duration-200',
          item.isActive ? 'bg-emerald-500 opacity-100' : 'opacity-0',
        )}
      />

      <span
        className={clsx(
          'grid h-8 w-10 place-items-center rounded-xl transition-colors duration-150',
          item.isActive
            ? 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
            : 'text-slate-400 dark:text-slate-500',
        )}
      >
        <item.icon size={20} strokeWidth={item.isActive ? 2.3 : 1.9} />
      </span>

      <span
        className={clsx(
          'text-[10px] font-bold tracking-tight transition-colors duration-150',
          item.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400',
        )}
      >
        {item.label}
      </span>
    </button>
  )
}
