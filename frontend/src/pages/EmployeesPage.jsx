import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { EmptyState, Toggle } from '../components/shared/UI'
import { api, employeeService } from '../services/api'
import { canAccess, employeeFullName, initials, titleCase } from '../utils/format'

export default function EmployeesPage({ appData, refresh, setModal, setEditingEmployee, user }) {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [branch, setBranch] = useState('all')
  const [employmentType, setEmploymentType] = useState('all')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [confirmEmployee, setConfirmEmployee] = useState(null)
  const [fetchedEmployees, setFetchedEmployees] = useState(null)
  const [loading, setLoading] = useState(false)

  const employees = useMemo(() => {
    if (fetchedEmployees !== null) return fetchedEmployees
    return appData.employees || []
  }, [fetchedEmployees, appData.employees])

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const list = await employeeService.fetchAll()
      setFetchedEmployees(list)
    } catch {
      // Ignore fetch errors; fallback to appData.employees
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (appData.employees?.length) return
    let mounted = true
    employeeService
      .fetchAll()
      .then((list) => {
        if (mounted) setFetchedEmployees(list)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [appData.employees?.length])

  const totalCount = employees.length
  const activeCount = employees.filter((item) => item.status === 'active').length
  const officeCount = employees.filter((item) => item.employment_type !== 'outdoor_sales').length
  const outdoorCount = employees.filter((item) => item.employment_type === 'outdoor_sales').length
  const photoCount = employees.filter((item) => item.photo_path || item.photo_url).length
  const pct = (count) => (totalCount ? `${Math.round((count / totalCount) * 100)}%` : '0%')

  const departments = useMemo(() => {
    return [...new Set(employees.map((item) => item.department?.name).filter(Boolean))].sort()
  }, [employees])

  const branches = useMemo(() => {
    return [...new Set(employees.map((item) => item.branch?.name).filter(Boolean))].sort()
  }, [employees])

  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return employees.filter((employee) => {
      const fullName = employeeFullName(employee, '')
      const email = employee.user?.email || ''
      const username = employee.user?.name || ''
      const roleName = employee.user?.role?.name || ''
      const matchesSearch = !keyword || [
        employee.employee_code,
        fullName,
        username,
        email,
        employee.phone,
        roleName,
        employee.position?.name,
        employee.department?.name,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))

      const matchesDepartment = department === 'all' || employee.department?.name === department
      const matchesStatus = status === 'all' || employee.status === status
      const matchesBranch = branch === 'all' || employee.branch?.name === branch
      const matchesType =
        employmentType === 'all' ||
        (employmentType === 'outdoor_sales'
          ? employee.employment_type === 'outdoor_sales'
          : employee.employment_type !== 'outdoor_sales')

      return matchesSearch && matchesDepartment && matchesStatus && matchesBranch && matchesType
    })
  }, [branch, department, employees, employmentType, search, status])

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / perPage))
  const safePage = Math.min(page, totalPages)
  const pagedEmployees = useMemo(() => {
    const start = (safePage - 1) * perPage
    return filteredEmployees.slice(start, start + perPage)
  }, [filteredEmployees, safePage, perPage])

  const openCreate = () => {
    setEditingEmployee(null)
    setModal('employee')
  }

  const openEdit = (employee) => {
    setEditingEmployee(employee)
    setModal('employee')
  }

  const clearFilters = () => {
    setSearch('')
    setDepartment('all')
    setStatus('all')
    setBranch('all')
    setEmploymentType('all')
    setPage(1)
  }

  const exportCsv = () => {
    const headers = ['Code', 'Full Name', 'Username', 'Email', 'Phone', 'Role', 'Department', 'Position', 'Branch', 'Attendance Type', 'Status']
    const rows = filteredEmployees.map((emp) => [
      emp.employee_code || '',
      employeeFullName(emp, ''),
      emp.user?.name || '',
      emp.user?.email || '',
      emp.phone || '',
      emp.user?.role?.name || '',
      emp.department?.name || '',
      emp.position?.name || '',
      emp.branch?.name || '',
      emp.employment_type === 'outdoor_sales' ? 'Outdoor Sales' : 'Office Staff',
      titleCase(emp.status || 'active'),
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `employees-directory-${new Date().toISOString().slice(0, 10)}.csv`,
    })
    a.click()
    URL.revokeObjectURL(url)
  }

  const canCreate = canAccess(user, ['employees.create'])
  const canEdit = canAccess(user, ['employees.update'])
  const canDelete = canAccess(user, ['employees.delete'])

  const toggleEmployeeStatus = async (employee) => {
    if (!canEdit || togglingId === employee.id) return
    const currentStatus = String(employee.status || 'active').toLowerCase()
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'

    setTogglingId(employee.id)
    // Optimistically update local list
    setFetchedEmployees((prev) => {
      const base = prev !== null ? prev : (appData.employees || [])
      return base.map((item) => (item.id === employee.id ? { ...item, status: nextStatus } : item))
    })

    try {
      await api.put(`/employees/${employee.id}`, {
        employee_code: employee.employee_code,
        first_name: employee.first_name || employeeFullName(employee).split(' ')[0] || 'Employee',
        last_name: employee.last_name || employeeFullName(employee).split(' ').slice(1).join(' ') || '',
        phone: employee.phone || '',
        telegram_chat_id: employee.telegram_chat_id || '',
        address: employee.address || '',
        department_id: employee.department_id || employee.department?.id || null,
        position_id: employee.position_id || employee.position?.id || null,
        branch_id: employee.branch_id || employee.branch?.id || null,
        hire_date: employee.hire_date ? String(employee.hire_date).slice(0, 10) : null,
        employment_type: employee.employment_type || 'full_time',
        status: nextStatus,
        require_face_verification: Boolean(employee.require_face_verification),
        require_gps: Boolean(employee.require_gps),
        require_ip_restriction: employee.require_ip_restriction !== false,
      })
      await loadEmployees()
      refresh()
    } catch (ex) {
      // Revert on failure
      await loadEmployees()
      const msg = ex.response?.data?.message || 'Could not update employee status.'
      window.alert(msg)
    } finally {
      setTogglingId(null)
    }
  }

  const deleteEmployee = (employee) => setConfirmEmployee(employee)

  const confirmDelete = async () => {
    if (!confirmEmployee) return
    setDeletingId(confirmEmployee.id)
    setConfirmEmployee(null)
    try {
      await api.delete(`/employees/${confirmEmployee.id}`)
      await loadEmployees()
      refresh()
    } catch (ex) {
      const msg = ex.response?.data?.message || 'Could not delete employee.'
      window.alert(msg)
    } finally {
      setDeletingId(null)
    }
  }

  const hasActiveFilters =
    Boolean(search.trim()) ||
    department !== 'all' ||
    status !== 'all' ||
    branch !== 'all' ||
    employmentType !== 'all'

  return (
    <div className="space-y-5">
      {/* ── Top Action Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Manage and organize your workforce directory, roles, and attendance types.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredEmployees.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-sm"
          >
            <Download size={16} className="text-emerald-600 dark:text-emerald-400" />
            Export CSV
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.99] sm:text-sm"
            >
              <Plus size={17} strokeWidth={2.4} />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* ── Compact 5-Column Interactive KPI Strip ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        <EmployeeKpiCard
          icon={Users}
          label="Total Employees"
          value={totalCount}
          badge="100%"
          tone="emerald"
          active={!hasActiveFilters}
          onClick={clearFilters}
        />
        <EmployeeKpiCard
          icon={UserCheck}
          label="Active Staff"
          value={activeCount}
          badge={pct(activeCount)}
          tone="sky"
          active={status === 'active'}
          onClick={() => { setStatus((s) => (s === 'active' ? 'all' : 'active')); setPage(1) }}
        />
        <EmployeeKpiCard
          icon={BriefcaseBusiness}
          label="Office Staff"
          value={officeCount}
          badge={pct(officeCount)}
          tone="blue"
          active={employmentType === 'office'}
          onClick={() => { setEmploymentType((t) => (t === 'office' ? 'all' : 'office')); setPage(1) }}
        />
        <EmployeeKpiCard
          icon={Navigation}
          label="Outdoor Sales"
          value={outdoorCount}
          badge={pct(outdoorCount)}
          tone="orange"
          active={employmentType === 'outdoor_sales'}
          onClick={() => { setEmploymentType((t) => (t === 'outdoor_sales' ? 'all' : 'outdoor_sales')); setPage(1) }}
        />
        <EmployeeKpiCard
          icon={Camera}
          label="Photo Profiles"
          value={photoCount}
          badge={pct(photoCount)}
          tone="violet"
        />
      </div>

      {/* ── Unified Auto-Filter Toolbar ── */}
      <div className="rounded-2xl border border-slate-200/85 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
          {/* Search Input */}
          <label className="relative flex items-center">
            <span className="sr-only">Search employees</span>
            <Search className="pointer-events-none absolute left-3.5 text-slate-400" size={16} />
            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-8 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search name, code, email, phone..."
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-2.5 rounded-md p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-800"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </label>

          <FilterSelect
            value={department}
            onChange={(v) => { setDepartment(v); setPage(1) }}
            ariaLabel="Department"
          >
            <option value="all">All Departments</option>
            {departments.map((name) => <option key={name} value={name}>{name}</option>)}
          </FilterSelect>

          <FilterSelect
            value={branch}
            onChange={(v) => { setBranch(v); setPage(1) }}
            ariaLabel="Branch"
          >
            <option value="all">All Branches</option>
            {branches.map((name) => <option key={name} value={name}>{name}</option>)}
          </FilterSelect>

          <FilterSelect
            value={employmentType}
            onChange={(v) => { setEmploymentType(v); setPage(1) }}
            ariaLabel="Attendance Type"
          >
            <option value="all">All Types</option>
            <option value="office">Office Staff</option>
            <option value="outdoor_sales">Outdoor Sales</option>
          </FilterSelect>

          <FilterSelect
            value={status}
            onChange={(v) => { setStatus(v); setPage(1) }}
            ariaLabel="Status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </FilterSelect>

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

      {/* ── Directory Table & Card Grid Container ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/85 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        {/* Directory Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Employee Directory</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold tabular-nums text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {filteredEmployees.length === employees.length
                ? `${employees.length}`
                : `${filteredEmployees.length} / ${employees.length}`}
            </span>
          </div>

          {/* Table vs Card Grid Switcher */}
          <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-0.5 dark:border-slate-800 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={clsx(
                'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition',
                viewMode === 'table'
                  ? 'bg-white text-emerald-700 shadow-2xs dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white',
              )}
              title="Table View"
            >
              <List size={15} />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={clsx(
                'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition',
                viewMode === 'grid'
                  ? 'bg-white text-emerald-700 shadow-2xs dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white',
              )}
              title="Card Grid View"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>

        {loading && employees.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin text-emerald-500" />
            Loading all employees…
          </div>
        ) : filteredEmployees.length === 0 ? (
          <EmptyState text="No employees match these filters." />
        ) : viewMode === 'grid' ? (
          /* ── Card Grid View ── */
          <div className="grid gap-3.5 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pagedEmployees.map((employee, idx) => (
              <EmployeeGridCard
                key={employee.id}
                rowNumber={(safePage - 1) * perPage + idx + 1}
                employee={employee}
                canEdit={canEdit}
                canDelete={canDelete}
                isDeleting={deletingId === employee.id}
                isToggling={togglingId === employee.id}
                onToggleStatus={() => toggleEmployeeStatus(employee)}
                onEdit={() => openEdit(employee)}
                onDelete={() => deleteEmployee(employee)}
              />
            ))}
          </div>
        ) : (
          /* ── Clean Streamlined Table View ── */
          <>
            {/* Mobile Automatic Card List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {pagedEmployees.map((employee, idx) => (
                <div key={employee.id} className="p-3.5">
                  <EmployeeGridCard
                    rowNumber={(safePage - 1) * perPage + idx + 1}
                    employee={employee}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    isDeleting={deletingId === employee.id}
                    isToggling={togglingId === employee.id}
                    onToggleStatus={() => toggleEmployeeStatus(employee)}
                    onEdit={() => openEdit(employee)}
                    onDelete={() => deleteEmployee(employee)}
                  />
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1140px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <tr>
                    <th className="w-12 px-3.5 py-3 text-center">No.</th>
                    <th className="px-3.5 py-3">Employee</th>
                    <th className="px-3.5 py-3">Username</th>
                    <th className="px-3.5 py-3">Phone</th>
                    <th className="px-3.5 py-3">Role</th>
                    <th className="px-3.5 py-3">Department</th>
                    <th className="px-3.5 py-3">Branch</th>
                    <th className="px-3.5 py-3">Attendance Type</th>
                    <th className="px-3.5 py-3">Status</th>
                    <th className="px-3.5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pagedEmployees.map((employee, index) => {
                    const rowNumber = (safePage - 1) * perPage + index + 1
                    const fullName = employeeFullName(employee)
                    const email = employee.user?.email || ''
                    const username = employee.user?.name || ''
                    const roleName = employee.user?.role?.name || ''
                    const roleSlug = employee.user?.role?.slug
                    const isProtected = roleSlug === 'super_admin' || roleSlug === 'admin'
                    const isDeleting = deletingId === employee.id
                    const isToggling = togglingId === employee.id
                    const isOutdoor = employee.employment_type === 'outdoor_sales'
                    const statusKey = String(employee.status || 'active').toLowerCase()
                    const isActive = statusKey === 'active'

                    return (
                      <tr key={employee.id} className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-800/45">
                        {/* No. Column */}
                        <td className="px-3.5 py-3 text-center font-mono text-xs font-bold tabular-nums text-slate-400 dark:text-slate-500">
                          {rowNumber}
                        </td>

                        {/* Employee Avatar + Name + Code + Email */}
                        <td className="px-3.5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-500/20 dark:from-emerald-500/20 dark:to-teal-500/20 dark:text-emerald-300">
                              {employee.photo_url ? (
                                <img className="h-full w-full object-cover" src={employee.photo_url} alt={fullName} />
                              ) : (
                                initials(fullName)
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate font-bold text-slate-950 dark:text-white">{fullName || '-'}</p>
                                {employee.employee_code && (
                                  <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    {employee.employee_code}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                {email || 'No login email'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Dedicated Username Column */}
                        <td className="px-3.5 py-3">
                          {username ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2 py-1 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              <User size={12} className="shrink-0 text-slate-400" />
                              {username}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Dedicated Phone Column */}
                        <td className="px-3.5 py-3">
                          {employee.phone ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                              <Phone size={12} className="shrink-0 text-slate-400" />
                              {employee.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Dedicated Role Column */}
                        <td className="px-3.5 py-3">
                          {roleName ? (
                            <span
                              className={clsx(
                                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1',
                                isProtected
                                  ? 'bg-violet-50 text-violet-700 ring-violet-500/20 dark:bg-violet-950/50 dark:text-violet-300'
                                  : 'bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300',
                              )}
                            >
                              <ShieldCheck size={12} className="shrink-0" />
                              {roleName}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Department & Position stacked */}
                        <td className="px-3.5 py-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">
                            {employee.department?.name || '—'}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {employee.position?.name || '—'}
                          </p>
                        </td>

                        {/* Branch */}
                        <td className="px-3.5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <MapPin size={12} className="shrink-0 text-slate-400" />
                            {employee.branch?.name || '—'}
                          </span>
                        </td>

                        {/* Attendance Type */}
                        <td className="px-3.5 py-3">
                          {isOutdoor ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 ring-1 ring-orange-500/20 dark:bg-orange-950/50 dark:text-orange-300">
                              <Navigation size={11} />
                              Outdoor Sales
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-500/20 dark:bg-sky-950/50 dark:text-sky-300">
                              <Building2 size={11} />
                              Office Staff
                            </span>
                          )}
                        </td>

                        {/* Status with Green Left/Right Slide Toggle */}
                        <td className="px-3.5 py-3">
                          <div className="flex items-center gap-2">
                            <Toggle
                              checked={isActive}
                              disabled={!canEdit || isProtected || isToggling}
                              onChange={() => toggleEmployeeStatus(employee)}
                            />
                            {isToggling && <Loader2 size={13} className="animate-spin text-emerald-500" />}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-3.5 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {canEdit && (
                              <button
                                type="button"
                                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                                onClick={() => openEdit(employee)}
                                title={`Edit ${fullName}`}
                                aria-label={`Edit ${fullName}`}
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            {canDelete && !isProtected && (
                              <button
                                type="button"
                                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                onClick={() => deleteEmployee(employee)}
                                disabled={isDeleting}
                                title={`Delete ${fullName}`}
                                aria-label={`Delete ${fullName}`}
                              >
                                {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                              </button>
                            )}
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

        {/* ── Working Pagination Footer ── */}
        {filteredEmployees.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{(safePage - 1) * perPage + 1}</span> to{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(safePage * perPage, filteredEmployees.length)}</span> of{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{filteredEmployees.length}</span> employees
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="inline-flex items-center gap-1">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-400">…</span>}
                      <button
                        type="button"
                        onClick={() => setPage(p)}
                        className={clsx(
                          'grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-bold transition',
                          p === safePage
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                        )}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Next page"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                aria-label="Rows per page"
              >
                {[10, 15, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} / page</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {confirmEmployee && (
        <DeleteConfirmModal
          employee={confirmEmployee}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmEmployee(null)}
        />
      )}
    </div>
  )
}

function EmployeeKpiCard({ icon: Icon, label, value, badge, tone = 'emerald', active = false, onClick }) {
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
    blue: {
      icon: 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/20 dark:bg-blue-950/60 dark:text-blue-400',
      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      bar: 'bg-blue-500',
      activeRing: 'ring-2 ring-blue-500 border-blue-500/50',
    },
    orange: {
      icon: 'bg-orange-50 text-orange-600 ring-1 ring-orange-500/20 dark:bg-orange-950/60 dark:text-orange-400',
      badge: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
      bar: 'bg-orange-500',
      activeRing: 'ring-2 ring-orange-500 border-orange-500/50',
    },
    violet: {
      icon: 'bg-violet-50 text-violet-600 ring-1 ring-violet-500/20 dark:bg-violet-950/60 dark:text-violet-400',
      badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
      bar: 'bg-violet-500',
      activeRing: 'ring-2 ring-violet-500 border-violet-500/50',
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

function EmployeeGridCard({
  rowNumber,
  employee,
  canEdit,
  canDelete,
  isDeleting,
  isToggling,
  onToggleStatus,
  onEdit,
  onDelete,
}) {
  const fullName = employeeFullName(employee)
  const email = employee.user?.email || ''
  const roleSlug = employee.user?.role?.slug
  const isProtected = roleSlug === 'super_admin' || roleSlug === 'admin'
  const isOutdoor = employee.employment_type === 'outdoor_sales'
  const statusKey = String(employee.status || 'active').toLowerCase()
  const isActive = statusKey === 'active'

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
              {employee.photo_url ? (
                <img className="h-full w-full object-cover" src={employee.photo_url} alt={fullName} />
              ) : (
                initials(fullName)
              )}
              {rowNumber != null && (
                <span className="absolute bottom-0 right-0 rounded-tl-md bg-slate-900/75 px-1 text-[9px] font-bold text-white">
                  #{rowNumber}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-950 dark:text-white">{fullName || '-'}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                {employee.employee_code && (
                  <span className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {employee.employee_code}
                  </span>
                )}
                <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {employee.position?.name || employee.user?.role?.name || 'Staff'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Toggle
              checked={isActive}
              disabled={!canEdit || isProtected || isToggling}
              onChange={onToggleStatus}
            />
          </div>
        </div>

        <div className="mt-3.5 space-y-1.5 border-t border-slate-200/60 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-400">
              <User size={13} />
              Username
            </span>
            <span className="truncate font-mono font-semibold">{employee.user?.name || '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck size={13} />
              Role
            </span>
            <span className="truncate font-semibold">{employee.user?.role?.name || '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Phone size={13} />
              Phone
            </span>
            <span className="font-semibold tabular-nums">{employee.phone || '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Building2 size={13} />
              Department
            </span>
            <span className="truncate font-semibold">{employee.department?.name || '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-400">
              <MapPin size={13} />
              Branch
            </span>
            <span className="truncate font-semibold">{employee.branch?.name || '—'}</span>
          </div>
          {email && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Mail size={13} />
                Email
              </span>
              <span className="max-w-40 truncate font-medium">{email}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-slate-200/60 pt-3 dark:border-slate-800">
        {isOutdoor ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
            <Navigation size={11} />
            Outdoor Sales
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
            <Building2 size={11} />
            Office Staff
          </span>
        )}

        <div className="flex items-center gap-1.5">
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Pencil size={13} />
              Edit
            </button>
          )}
          {canDelete && !isProtected && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
              aria-label={`Delete ${fullName}`}
            >
              {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterSelect({ value, onChange, ariaLabel, children }) {
  return (
    <select
      aria-label={ariaLabel}
      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  )
}

function DeleteConfirmModal({ employee, onConfirm, onCancel }) {
  const fullName = employeeFullName(employee)
  const photoUrl = employee.photo_url
  const role = employee.user?.role?.name || 'No login account'
  const dept = employee.department?.name || '-'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 dark:bg-rose-950/50">
              <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Delete Employee</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-200 text-sm font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {photoUrl
                ? <img src={photoUrl} alt={fullName} className="h-full w-full object-cover" />
                : initials(fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900 dark:text-slate-100">{fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{dept} · {role}</p>
              <p className="font-mono text-xs text-slate-400 dark:text-slate-500">{employee.employee_code}</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            Deleting this employee will also remove their login account and all associated data. Are you sure?
          </p>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
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
