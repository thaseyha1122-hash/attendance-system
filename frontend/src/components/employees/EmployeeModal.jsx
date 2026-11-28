import { useEffect, useState } from 'react'
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  LocateFixed,
  Mail,
  MapPinned,
  Navigation,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
  Wifi,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../services/api'
import { ErrorText, Toggle } from '../shared/UI'
import { apiError, initials } from '../../utils/format'

export default function EmployeeModal({ employee, onClose, onSaved }) {
  const isEdit = Boolean(employee)
  const loginRoleId = employee?.user?.role_id || employee?.user?.role?.id || ''
  const initialForm = {
    employee_code: employee?.employee_code || '',
    full_name: [employee?.first_name, employee?.last_name].filter(Boolean).join(' '),
    phone: employee?.phone || '',
    telegram_chat_id: employee?.telegram_chat_id || '',
    address: employee?.address || '',
    department_id: employee?.department_id || '',
    position_id: employee?.position_id || '',
    branch_id: employee?.branch_id || '',
    hire_date: employee?.hire_date ? String(employee.hire_date).slice(0, 10) : '',
    employment_type: employee?.employment_type || 'full_time',
    status: employee?.status || 'active',
    create_login: !employee,
    login_email: employee?.user?.email || '',
    login_username: employee?.user?.name || '',
    login_password: '',
    role_id: loginRoleId,
  }
  const [form, setForm] = useState(initialForm)
  const [options, setOptions] = useState({ departments: [], positions: [], branches: [], roles: [] })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(employee?.photo_url || '')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [access, setAccess] = useState({
    gpsRestriction: Boolean(employee?.require_gps),
    faceVerification: Boolean(employee?.require_face_verification),
    ipRestriction: employee?.require_ip_restriction !== false,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMode, setSaveMode] = useState('close')

  useEffect(() => {
    api.get('/employee-options')
      .then((response) => {
        const nextOptions = response.data
        setOptions(nextOptions)
        const employeeRole = nextOptions.roles?.find((role) => role.slug === 'office_staff')
        setForm((current) => ({
          ...current,
          role_id: current.role_id || employeeRole?.id || '',
        }))
      })
      .catch(() => setError('Cannot load departments, positions, branches, and roles.'))
  }, [])

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (error) setError('')
  }

  const updateAttendanceType = (type) => {
    setForm((current) => {
      const next = { ...current, employment_type: type }
      const currentRole = options.roles.find((role) => String(role.id) === String(current.role_id))
      const isDefaultStaffRole =
        !currentRole || currentRole.slug === 'office_staff' || currentRole.slug === 'outdoor_sales'

      if (isDefaultStaffRole) {
        const matchingRole = options.roles.find(
          (role) => role.slug === (type === 'outdoor_sales' ? 'outdoor_sales' : 'office_staff'),
        )
        if (matchingRole) next.role_id = matchingRole.id
      }
      return next
    })
  }

  const updateRole = (roleId) => {
    setForm((current) => {
      const next = { ...current, role_id: roleId }
      const selectedRole = options.roles.find((role) => String(role.id) === String(roleId))
      if (selectedRole?.slug === 'outdoor_sales' || selectedRole?.slug === 'sales_manager') {
        next.employment_type = 'outdoor_sales'
      } else if (selectedRole?.slug === 'office_staff') {
        next.employment_type = 'full_time'
      }
      return next
    })
    if (error) setError('')
  }

  const updateDepartment = (deptId) => {
    setForm((current) => {
      const next = { ...current, department_id: deptId }
      if (deptId && current.position_id) {
        const pos = options.positions.find((p) => String(p.id) === String(current.position_id))
        if (pos?.department_id && String(pos.department_id) !== String(deptId)) {
          next.position_id = ''
        }
      }
      return next
    })
    if (error) setError('')
  }

  const updatePosition = (posId) => {
    setForm((current) => {
      const next = { ...current, position_id: posId }
      const selectedPos = options.positions.find((p) => String(p.id) === String(posId))
      if (selectedPos?.department_id && !current.department_id) {
        next.department_id = selectedPos.department_id
      }
      const posCode = String(selectedPos?.code || selectedPos?.name || '').toLowerCase()
      if (posCode.includes('outdoor')) {
        next.employment_type = 'outdoor_sales'
      }
      // Auto-suggest matching role when creating or when role is still default staff role
      const currentRole = options.roles.find((role) => String(role.id) === String(current.role_id))
      const isDefaultStaffRole =
        !currentRole || currentRole.slug === 'office_staff' || currentRole.slug === 'outdoor_sales'
      if (selectedPos && isDefaultStaffRole) {
        const slugCandidate = String(selectedPos.code || '').toLowerCase()
        const matchingRole = options.roles.find(
          (r) => r.slug === slugCandidate || r.name.toLowerCase() === selectedPos.name.toLowerCase(),
        )
        if (matchingRole) next.role_id = matchingRole.id
      }
      return next
    })
    if (error) setError('')
  }

  const handlePhoto = (file) => {
    setPhoto(file || null)
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(file ? URL.createObjectURL(file) : employee?.photo_url || '')
  }

  const clearPhoto = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setPhoto(null)
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    setPhotoPreview('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    if (form.login_password && confirmPassword && form.login_password !== confirmPassword) {
      setError('Password and confirm password do not match.')
      setSaving(false)
      return
    }

    const body = new FormData()
    const [firstName, ...lastNameParts] = form.full_name.trim().split(/\s+/).filter(Boolean)
    const payload = {
      ...form,
      first_name: firstName || '',
      last_name: lastNameParts.join(' '),
    }
    delete payload.full_name
    Object.entries(payload).forEach(([key, value]) =>
      body.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value),
    )
    body.append('require_face_verification', access.faceVerification ? '1' : '0')
    body.append('require_gps', access.gpsRestriction ? '1' : '0')
    body.append('require_ip_restriction', access.ipRestriction ? '1' : '0')
    if (photo) body.append('photo', photo)
    if (isEdit) body.append('_method', 'PUT')

    try {
      await api.post(isEdit ? `/employees/${employee.id}` : '/employees', body)
      if (saveMode === 'another' && !isEdit) {
        setForm({
          ...initialForm,
          employee_code: '',
          full_name: '',
          phone: '',
          address: '',
          department_id: '',
          position_id: '',
          branch_id: '',
          hire_date: '',
          login_email: '',
          login_username: '',
          login_password: '',
        })
        setConfirmPassword('')
        handlePhoto(null)
        onSaved({ keepOpen: true })
      } else {
        onSaved()
      }
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  const isOutdoor = form.employment_type === 'outdoor_sales'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-xs sm:p-5"
      onClick={onClose}
    >
      <form
        className="my-auto w-full max-w-4xl"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          {/* ── Sticky Modal Header ── */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
            <div className="flex items-center gap-3.5">
              <div className={clsx(
                'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-md',
                isEdit
                  ? 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-600/20'
                  : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-600/20',
              )}>
                {isEdit ? <Pencil size={18} /> : <UserPlus size={19} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white sm:text-lg">
                    {isEdit ? 'Edit Employee Profile' : 'Add New Employee'}
                  </h3>
                  {form.employee_code && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {form.employee_code}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEdit
                    ? 'Update personal details, work assignment, login credentials, and attendance rules.'
                    : 'Create an employee record with department assignment and system login credentials.'}
                </p>
              </div>
            </div>
            <button
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              onClick={onClose}
              type="button"
              aria-label="Close employee form"
            >
              <X size={17} />
            </button>
          </div>

          {/* ── Scrollable Form Body ── */}
          <div className="max-h-[calc(100vh-11rem)] space-y-4 overflow-y-auto bg-slate-50/50 p-4 dark:bg-slate-950 sm:p-6">

            {/* ── Top Profile Banner (Avatar Upload + Quick Identity + Status) ── */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/85 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <label className="group relative grid h-16 w-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-base font-extrabold text-emerald-700 ring-2 ring-emerald-500/25 transition hover:ring-emerald-500 dark:text-emerald-300">
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handlePhoto(event.target.files?.[0] || null)}
                  />
                  {photoPreview ? (
                    <img className="h-full w-full object-cover" src={photoPreview} alt="Employee preview" />
                  ) : form.full_name.trim() ? (
                    initials(form.full_name)
                  ) : (
                    <Camera size={22} className="text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span className=" inset-0 hidden place-items-center bg-slate-950/50 text-white group-hover:grid">
                    <Camera size={16} />
                  </span>
                </label>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/*"
                        onChange={(event) => handlePhoto(event.target.files?.[0] || null)}
                      />
                      {photoPreview ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    JPG, PNG or WebP (Max 4MB). Used for profile & attendance ID.
                  </p>
                </div>
              </div>

              {/* Quick Status Pills */}
              <div className="flex flex-col items-start gap-1.5 sm:items-end">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Account Status
                </span>
                <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-0.5 dark:border-slate-800 dark:bg-slate-800">
                  {[
                    ['active', 'Active', 'text-emerald-700 dark:text-emerald-300'],
                    ['inactive', 'Inactive', 'text-slate-600 dark:text-slate-300'],
                    ['suspended', 'Suspended', 'text-rose-600 dark:text-rose-400'],
                  ].map(([val, label, activeColor]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updateField('status', val)}
                      className={clsx(
                        'rounded-lg px-2.5 py-1 text-xs font-bold transition',
                        form.status === val
                          ? clsx('bg-white shadow-2xs dark:bg-slate-900', activeColor)
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── 2-Column Grid for Section 1 (Personal) & Section 2 (Work) ── */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* 1. Personal Information */}
              <EmployeeModalSection icon={UserRound} title="Personal Details" tone="emerald">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <EmployeeTextField
                      icon={UserRound}
                      label="Full Name"
                      value={form.full_name}
                      onChange={(value) => updateField('full_name', value)}
                      placeholder="e.g. Sokha Chan"
                      required
                    />
                  </div>
                  <EmployeeTextField
                    icon={Phone}
                    label="Phone Number"
                    value={form.phone}
                    onChange={(value) => updateField('phone', value)}
                    placeholder="012 345 678"
                  />
                  <EmployeeTextField
                    icon={Bell}
                    label="Telegram Chat ID"
                    value={form.telegram_chat_id}
                    onChange={(value) => updateField('telegram_chat_id', value)}
                    placeholder="Optional alert ID"
                  />
                  <div className="sm:col-span-2">
                    <EmployeeTextField
                      icon={Mail}
                      label="Work Email Address"
                      type="email"
                      value={form.login_email}
                      onChange={(value) => updateField('login_email', value)}
                      placeholder="name@company.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <EmployeeTextField
                      icon={MapPinned}
                      label="Present Address"
                      value={form.address}
                      onChange={(value) => updateField('address', value)}
                      placeholder="Street, Sangkat, Khan, Province..."
                    />
                  </div>
                </div>
              </EmployeeModalSection>

              {/* 2. Work Assignment */}
              <EmployeeModalSection icon={BriefcaseBusiness} title="Work Assignment" tone="sky">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <EmployeeTextField
                    icon={Fingerprint}
                    label="Employee Code"
                    value={form.employee_code}
                    onChange={(value) => updateField('employee_code', value)}
                    placeholder="e.g. EMP-001"
                    required
                  />
                  <EmployeeTextField
                    icon={CalendarCheck}
                    label="Join Date"
                    type="date"
                    value={form.hire_date}
                    onChange={(value) => updateField('hire_date', value)}
                  />
                  <EmployeeSelectField
                    icon={Building2}
                    label="Department"
                    value={form.department_id}
                    onChange={updateDepartment}
                  >
                    <option value="">Select department</option>
                    {options.departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </EmployeeSelectField>
                  <EmployeeSelectField
                    icon={BriefcaseBusiness}
                    label="Position"
                    value={form.position_id}
                    onChange={updatePosition}
                  >
                    <option value="">Select position</option>
                    {options.positions
                      .filter((p) => !form.department_id || !p.department_id || String(p.department_id) === String(form.department_id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </EmployeeSelectField>
                  <div className="sm:col-span-2">
                    <EmployeeSelectField
                      icon={MapPinned}
                      label="Assigned Branch"
                      value={form.branch_id}
                      onChange={(value) => updateField('branch_id', value)}
                    >
                      <option value="">Select branch</option>
                      {options.branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </EmployeeSelectField>
                  </div>

                  {/* Interactive Check-In Mode Cards (Separated cleanly from Role names) */}
                  <div className="sm:col-span-2">
                    <EmployeeLabel required>Check-In Location Mode</EmployeeLabel>
                    <div className="mt-1.5 grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => updateAttendanceType('full_time')}
                        className={clsx(
                          'flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition',
                          !isOutdoor
                            ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/15 dark:border-emerald-500/70 dark:bg-emerald-950/40 dark:text-emerald-200'
                            : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
                        )}
                      >
                        <div className={clsx(
                          'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                          !isOutdoor ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800',
                        )}>
                          <Building2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold">Office Check-In</p>
                          <p className="truncate text-[10px] opacity-75">Inside branch GPS radius</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateAttendanceType('outdoor_sales')}
                        className={clsx(
                          'flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition',
                          isOutdoor
                            ? 'border-orange-500 bg-orange-50/70 text-orange-900 ring-2 ring-orange-500/15 dark:border-orange-500/70 dark:bg-orange-950/40 dark:text-orange-200'
                            : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
                        )}
                      >
                        <div className={clsx(
                          'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                          isOutdoor ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800',
                        )}>
                          <Navigation size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold">Field / Outdoor GPS</p>
                          <p className="truncate text-[10px] opacity-75">Anywhere + route tracking</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </EmployeeModalSection>
            </div>

            {/* ── Section 3: System Login & Role ── */}
            <EmployeeModalSection icon={KeyRound} title="Login Account & Role" tone="violet">
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                <EmployeeTextField
                  icon={UserRound}
                  label="Username"
                  value={form.login_username}
                  onChange={(value) => updateField('login_username', value)}
                  placeholder="Enter username"
                  required={!isEdit || Boolean(form.login_password)}
                />
                <EmployeeSelectField
                  icon={ShieldCheck}
                  label="System Permission Role"
                  value={form.role_id}
                  onChange={updateRole}
                  required
                >
                  <option value="">Select role</option>
                  {options.roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </EmployeeSelectField>
                <EmployeePasswordField
                  label={isEdit ? 'New Password (Optional)' : 'Password'}
                  value={form.login_password}
                  onChange={(value) => updateField('login_password', value)}
                  show={showPassword}
                  onToggleShow={() => setShowPassword((v) => !v)}
                  placeholder={isEdit ? 'Leave blank to keep' : 'Min. 8 characters'}
                  required={!isEdit}
                />
                <EmployeePasswordField
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value)
                    if (error) setError('')
                  }}
                  show={showConfirmPassword}
                  onToggleShow={() => setShowConfirmPassword((v) => !v)}
                  placeholder="Repeat password"
                  required={!isEdit || Boolean(form.login_password)}
                />
              </div>
            </EmployeeModalSection>

            {/* ── Section 4: Security & Attendance Verification Rules ── */}
            <EmployeeModalSection icon={ShieldCheck} title="Verification & Security Rules" tone="emerald">
              <div className="grid gap-3 sm:grid-cols-3">
                <EmployeeRuleToggle
                  icon={LocateFixed}
                  title="GPS Location Check"
                  description="Require live GPS location when checking in/out."
                  checked={access.gpsRestriction}
                  onChange={() => setAccess((current) => ({ ...current, gpsRestriction: !current.gpsRestriction }))}
                />
                <EmployeeRuleToggle
                  icon={Wifi}
                  title="Office IP Restriction"
                  description="Require allowed office Wi-Fi / IP range."
                  checked={access.ipRestriction}
                  onChange={() => setAccess((current) => ({ ...current, ipRestriction: !current.ipRestriction }))}
                />
                <EmployeeRuleToggle
                  icon={Camera}
                  title="Live Selfie Verification"
                  description="Require live face detection selfie photo."
                  checked={access.faceVerification}
                  onChange={() => setAccess((current) => ({ ...current, faceVerification: !current.faceVerification }))}
                />
              </div>
            </EmployeeModalSection>

            {error && <ErrorText text={error} />}
          </div>

          {/* ── Sticky Modal Footer ── */}
          <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <button
              className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-sm"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            {!isEdit && (
              <button
                className="h-10 rounded-xl border border-emerald-500/60 bg-emerald-50/50 px-4 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300 sm:text-sm"
                type="submit"
                disabled={saving}
                onClick={() => setSaveMode('another')}
              >
                Save & Add Another
              </button>
            )}
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 sm:text-sm"
              disabled={saving}
              type="submit"
              onClick={() => setSaveMode('close')}
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {isEdit ? 'Update Employee' : 'Save Employee'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function EmployeeModalSection({ icon: Icon, title, tone = 'emerald', children }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-400',
    violet: 'bg-violet-50 text-violet-600 ring-1 ring-violet-500/20 dark:bg-violet-950/50 dark:text-violet-400',
    sky: 'bg-sky-50 text-sky-600 ring-1 ring-sky-500/20 dark:bg-sky-950/50 dark:text-sky-400',
  }

  return (
    <section className="rounded-2xl border border-slate-200/85 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3.5 flex items-center gap-2.5 border-b border-slate-100 pb-2.5 dark:border-slate-800/80">
        <span className={clsx('grid h-7 w-7 place-items-center rounded-lg', tones[tone])}>
          <Icon size={15} />
        </span>
        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{title}</h4>
      </div>
      {children}
    </section>
  )
}

function EmployeeLabel({ children, required = false }) {
  return (
    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
      {children}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  )
}

function EmployeeInputShell({ icon: Icon, label, required, help, rightSlot, children }) {
  return (
    <div>
      {label && <EmployeeLabel required={required}>{label}</EmployeeLabel>}
      <div className="relative mt-1.5">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={15}
          />
        )}
        {children}
        {rightSlot}
      </div>
      {help && <p className="mt-1 text-[11px] text-slate-400">{help}</p>}
    </div>
  )
}

const INPUT_BASE_CLS =
  'h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white'

function EmployeeTextField({ icon, label, value, onChange, type = 'text', placeholder = '', required = false, help }) {
  return (
    <EmployeeInputShell icon={icon} label={label} required={required} help={help}>
      <input
        className={clsx(INPUT_BASE_CLS, icon && 'pl-9')}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </EmployeeInputShell>
  )
}

function EmployeePasswordField({ label, value, onChange, show, onToggleShow, placeholder = '', required = false }) {
  return (
    <EmployeeInputShell
      icon={KeyRound}
      label={label}
      required={required}
      rightSlot={
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      }
    >
      <input
        className={clsx(INPUT_BASE_CLS, 'pl-9 pr-9')}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </EmployeeInputShell>
  )
}

function EmployeeSelectField({ icon, label, value, onChange, required = false, children }) {
  return (
    <EmployeeInputShell icon={icon} label={label} required={required}>
      <select
        className={clsx(INPUT_BASE_CLS, 'font-medium', icon && 'pl-9')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        {children}
      </select>
    </EmployeeInputShell>
  )
}

function EmployeeRuleToggle({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div
      onClick={onChange}
      className={clsx(
        'flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 transition',
        checked
          ? 'border-emerald-500/40 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-950/20'
          : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60 dark:border-slate-800 dark:bg-slate-800/30',
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <div className={clsx(
          'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg',
          checked
            ? 'bg-emerald-500 text-white'
            : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        )}>
          <Icon size={14} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{title}</p>
          {description && (
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <Toggle checked={checked} onChange={onChange} />
      </div>
    </div>
  )
}
