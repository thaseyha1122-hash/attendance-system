import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Moon,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import CountryFlag from '../components/shared/CountryFlag'
import { authService } from '../services/api'

const REMEMBER_USERNAME_KEY = 'attendance_remembered_username'

const COPY = {
  en: {
    subtitle: 'Attendance & Sales System',
    heroLine1: 'Track Attendance.',
    heroLine2: 'Boost Performance.',
    heroDesc: 'Smart attendance management, facial verification, and live outdoor sales tracking built for modern teams.',
    statTeam: 'Team',
    statAttendance: 'Attendance',
    statSecure: 'Biometric',
    statAccess: 'Face & GPS',
    statLive: 'Live',
    statGps: 'Route Map',
    checkInLabel: 'Check In Verified',
    locationVerified: 'Office Radius • 18m',
    fieldVisitLabel: 'Outdoor Visit Active',
    features: [
      [ShieldCheck, 'Secure & Safe', 'Role-based & IP protected'],
      [Lock, 'Private & Audited', 'Encrypted activity trail'],
      [BarChart2, 'Smart Reports', 'Monthly & payroll analytics'],
    ],
    welcomeBack: 'Welcome back',
    signInPrompt: 'Sign in with your username or work email to continue',
    usernameLabel: 'Username or Email',
    usernamePlaceholder: 'Enter username or email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    capsLockOn: 'Caps Lock is ON',
    rememberMe: 'Remember username',
    forgotPassword: 'Forgot password?',
    signInBtn: 'Sign In',
    signingInBtn: 'Signing in...',
    orText: 'secure access',
    adminNote: 'Need an account? Contact your HR or System Administrator.',
    forgotTitle: 'Reset your password',
    forgotSubtitle: 'Enter your work email to receive a reset link, or contact your administrator for an immediate password reset.',
    workEmailLabel: 'Work Email Address',
    workEmailPlaceholder: 'name@company.com',
    sendResetBtn: 'Send Reset Link',
    sendingResetBtn: 'Sending link...',
    backToLogin: 'Back to Sign In',
    resetSentTitle: 'Check your email',
    resetSentMessage: 'If an account matches that email, a password reset link has been sent. You can also ask your HR Admin to reset your password directly from Users & Roles.',
  },
  km: {
    subtitle: 'ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងផ្នែកលក់',
    heroLine1: 'តាមដានវត្តមាន។',
    heroLine2: 'បង្កើនប្រសិទ្ធភាពការងារ។',
    heroDesc: 'ប្រព័ន្ធគ្រប់គ្រងវត្តមានឆ្លាតវៃ ផ្ទៀងផ្ទាត់ផ្ទៃមុខ និងតាមដានទីតាំងផ្នែកលក់ផ្ទាល់សម្រាប់ក្រុមការងារទំនើប។',
    statTeam: 'ក្រុមការងារ',
    statAttendance: 'វត្តមានបុគ្គលិក',
    statSecure: 'សុវត្ថិភាព',
    statAccess: 'ស្កេនមុខ & GPS',
    statLive: 'ផ្ទាល់',
    statGps: 'ផែនទីផ្លូវធ្វើដំណើរ',
    checkInLabel: 'បានផ្ទៀងផ្ទាត់ការចូលធ្វើការ',
    locationVerified: 'ក្នុងរង្វង់ការិយាល័យ • 18m',
    fieldVisitLabel: 'កំពុងចុះជួបអតិថិជន',
    features: [
      [ShieldCheck, 'សុវត្ថិភាពខ្ពស់', 'ការពារដោយសិទ្ធិ និង IP'],
      [Lock, 'ឯកជនភាព & កំណត់ត្រា', 'រក្សាទុកប្រវត្តិសកម្មភាព'],
      [BarChart2, 'របាយការណ៍ឆ្លាតវៃ', 'វិភាគប្រចាំខែ និងប្រាក់ខែ'],
    ],
    welcomeBack: 'សូមស្វាគមន៍មកវិញ',
    signInPrompt: 'សូមបញ្ចូលឈ្មោះគណនី ឬអ៊ីមែលរបស់អ្នកដើម្បីបន្ត',
    usernameLabel: 'ឈ្មោះគណនី ឬ អ៊ីមែល',
    usernamePlaceholder: 'បញ្ចូលឈ្មោះគណនី ឬអ៊ីមែល',
    passwordLabel: 'ពាក្យសម្ងាត់',
    passwordPlaceholder: 'បញ្ចូលពាក្យសម្ងាត់របស់អ្នក',
    capsLockOn: 'កំពុងបើក Caps Lock',
    rememberMe: 'ចងចាំឈ្មោះគណនី',
    forgotPassword: 'ភ្លេចពាក្យសម្ងាត់?',
    signInBtn: 'ចូលប្រើប្រាស់',
    signingInBtn: 'កំពុងចូលប្រើ...',
    orText: 'សុវត្ថិភាពគណនី',
    adminNote: 'មិនទាន់មានគណនីមែនទេ? សូមទាក់ទងផ្នែក HR ឬអ្នកគ្រប់គ្រងប្រព័ន្ធ។',
    forgotTitle: 'កំណត់ពាក្យសម្ងាត់ឡើងវិញ',
    forgotSubtitle: 'បញ្ចូលអ៊ីមែលការងាររបស់អ្នកដើម្បីទទួលតំណភ្ជាប់កំណត់ឡើងវិញ ឬទាក់ទងអ្នកគ្រប់គ្រងប្រព័ន្ធ (HR/Admin)។',
    workEmailLabel: 'អាសយដ្ឋានអ៊ីមែលការងារ',
    workEmailPlaceholder: 'name@company.com',
    sendResetBtn: 'ផ្ញើតំណកំណត់ឡើងវិញ',
    sendingResetBtn: 'កំពុងផ្ញើ...',
    backToLogin: 'ត្រឡប់ទៅការចូលប្រើ',
    resetSentTitle: 'សូមពិនិត្យអ៊ីមែលរបស់អ្នក',
    resetSentMessage: 'ប្រសិនបើមានគណនីត្រូវនឹងអ៊ីមែលនេះ តំណកំណត់ពាក្យសម្ងាត់ត្រូវបានផ្ញើ។ អ្នកក៏អាចស្នើសុំឱ្យ HR Admin កំណត់ពាក្យសម្ងាត់ថ្មីជូនដោយផ្ទាល់ផងដែរ។',
  },
}

export default function LoginPage({
  dark,
  onToggleDark,
  onLogin,
  branding = {},
  language = 'en',
  onChangeLanguage,
}) {
  const savedUsername = typeof window !== 'undefined' ? localStorage.getItem(REMEMBER_USERNAME_KEY) || '' : ''
  const [username, setUsername] = useState(savedUsername)
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(Boolean(savedUsername) || true)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Forgot password view state
  const [mode, setMode] = useState('login') // 'login' | 'forgot'
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState('')

  const lang = language === 'km' ? 'km' : 'en'
  const copy = COPY[lang]
  const companyName = branding?.company_name?.trim() || 'SalesTrack'
  const companyLogoUrl = branding?.company_logo_url || ''

  const handleKeyEvents = (event) => {
    if (typeof event.getModifierState === 'function') {
      setCapsLock(event.getModifierState('CapsLock'))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const cleanUsername = username.trim()
    if (!cleanUsername || !password) return

    setLoading(true)
    setError('')
    try {
      const response = await authService.login({ username: cleanUsername, password })
      if (rememberMe) {
        localStorage.setItem(REMEMBER_USERNAME_KEY, cleanUsername)
      } else {
        localStorage.removeItem(REMEMBER_USERNAME_KEY)
      }
      onLogin(response.user)
    } catch (exception) {
      const fieldError = exception.response?.data?.errors?.username?.[0] || exception.response?.data?.errors?.password?.[0]
      setError(fieldError || exception.response?.data?.message || 'Login failed. Check your username and password.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (event) => {
    event.preventDefault()
    const cleanEmail = resetEmail.trim()
    if (!cleanEmail) return

    setResetLoading(true)
    setResetError('')
    try {
      await authService.forgotPassword(cleanEmail)
      setResetSent(true)
    } catch (exception) {
      // Even if mail transport isn't configured locally, show helpful guidance or validation message
      const msg = exception.response?.data?.errors?.email?.[0] || exception.response?.data?.message
      if (exception.response?.status === 422 && msg) {
        setResetError(msg)
      } else {
        setResetSent(true)
      }
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className={clsx(dark && 'dark', lang === 'km' && 'lang-km')} data-no-translate>
      <div className="grid min-h-screen bg-slate-100 text-slate-900 dark:bg-[#061320] dark:text-slate-100 lg:grid-cols-[1.08fr_1fr]">

        {/* ── Left Branding & Interactive Showcase Panel (Desktop) ── */}
        <section className="relative hidden overflow-hidden bg-[#071827] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
          {/* Ambient radial glow background */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-10 right-0 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Top Brand Identity */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt={companyName}
                  className="h-12 w-12 rounded-2xl border border-white/15 object-cover shadow-lg shadow-black/40"
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-950/60 ring-1 ring-white/20">
                  <Activity size={23} className="text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white">
                  {companyName === 'SalesTrack' ? (
                    <>Sales<span className="text-emerald-400">Track</span></>
                  ) : (
                    companyName
                  )}
                </h1>
                <p className="text-xs text-slate-400">{copy.subtitle}</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Sparkles size={13} className="text-emerald-400" />
              Enterprise Portal
            </span>
          </div>

          {/* Center Hero + Live Preview Cards */}
          <div className="relative z-10 my-auto py-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-[2.75rem]">
                {copy.heroLine1}
              </h2>
              <h2 className="mt-1 bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent xl:text-[2.75rem]">
                {copy.heroLine2}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300/85">
                {copy.heroDesc}
              </p>
            </motion.div>

            {/* Stat Pills */}
            <div className="mt-7 grid max-w-lg grid-cols-3 gap-3">
              {[
                [Users, copy.statTeam, copy.statAttendance],
                [ShieldCheck, copy.statSecure, copy.statAccess],
                [MapPin, copy.statLive, copy.statGps],
              ].map(([Icon, value, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 backdrop-blur-sm transition hover:border-emerald-500/30 hover:bg-white/[0.07]"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-white">{value}</p>
                    <p className="truncate text-[11px] text-slate-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Visual Card Showcase */}
            <div className="relative mt-8 h-60 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-[#06121e] p-5 shadow-2xl">
              {/* Subtle Map Grid Lines */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
                viewBox="0 0 500 240"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M-20 180 C 90 160, 140 70, 260 95 C 360 115, 420 50, 520 40"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                />
                <circle cx="145" cy="112" r="28" fill="#10b981" fillOpacity="0.12" />
                <circle cx="145" cy="112" r="6" fill="#10b981" />
                <circle cx="355" cy="86" r="22" fill="#38bdf8" fillOpacity="0.12" />
                <circle cx="355" cy="86" r="5" fill="#38bdf8" />
              </svg>

              {/* Floating Card 1: Live Attendance Verified */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="relative z-10 flex w-fit items-center gap-3.5 rounded-2xl border border-white/12 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur-md"
              >
                <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-extrabold text-white">
                  SA
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">{copy.checkInLabel}</p>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      08:00 AM
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin size={11} className="text-emerald-400" />
                    {copy.locationVerified}
                  </p>
                </div>
                <CheckCircle2 className="ml-1 text-emerald-400" size={18} />
              </motion.div>

              {/* Floating Card 2: Field Sales GPS Status */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.28, duration: 0.4 }}
                className="absolute bottom-5 right-5 z-10 flex items-center gap-3 rounded-2xl border border-white/12 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur-md"
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
                  <MapPin size={17} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Phnom Penh • Route #04</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    {copy.fieldVisitLabel}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom Features Footer */}
          <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {copy.features.map(([Icon, title, text]) => (
              <div key={title} className="flex items-start gap-2.5">
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Right Form Panel ── */}
        <section className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-8">

          {/* Top Bar Controls (Language Switcher + Theme Toggle) */}
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
            {onChangeLanguage && (
              <div className="inline-flex h-10 items-center rounded-xl border border-slate-200/90 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-[#0d2235]">
                <button
                  type="button"
                  onClick={() => onChangeLanguage('en')}
                  className={clsx(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition',
                    lang === 'en'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
                  )}
                >
                  <CountryFlag code="en" />
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => onChangeLanguage('km')}
                  className={clsx(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition',
                    lang === 'km'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
                  )}
                >
                  <CountryFlag code="km" />
                  ខ្មែរ
                </button>
              </div>
            )}

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-[#0d2235] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={onToggleDark}
              aria-label="Toggle theme"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>

          {/* Main Login / Reset Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-[430px] rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-white/10 dark:bg-[#0d2235] dark:shadow-black/50 sm:p-9"
          >
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.div
                  key="login-view"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Card Header */}
                  <div className="mb-7 flex flex-col items-center text-center">
                    {companyLogoUrl ? (
                      <img
                        src={companyLogoUrl}
                        alt={companyName}
                        className="mb-4 h-14 w-14 rounded-2xl border border-slate-200 object-cover shadow-md dark:border-white/10"
                      />
                    ) : (
                      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30 dark:shadow-emerald-950/60">
                        <Activity size={27} className="text-white" />
                      </div>
                    )}
                    <span className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 lg:hidden">
                      {companyName}
                    </span>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {copy.welcomeBack}
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                      {copy.signInPrompt}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    {/* Username or Email */}
                    <div>
                      <label
                        htmlFor="login-username"
                        className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                      >
                        {copy.usernameLabel}
                      </label>
                      <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 transition-all focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-emerald-500/60 dark:focus-within:bg-white/[0.07]">
                        <UserRound
                          className="shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-500 dark:text-slate-500"
                          size={18}
                        />
                        <input
                          id="login-username"
                          className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value)
                            if (error) setError('')
                          }}
                          type="text"
                          autoComplete="username"
                          autoFocus={!savedUsername}
                          placeholder={copy.usernamePlaceholder}
                          required
                        />
                        {username && (
                          <button
                            type="button"
                            onClick={() => setUsername('')}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
                            aria-label="Clear username"
                            tabIndex={-1}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label
                          htmlFor="login-password"
                          className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                        >
                          {copy.passwordLabel}
                        </label>
                        {capsLock && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            <KeyRound size={11} />
                            {copy.capsLockOn}
                          </span>
                        )}
                      </div>
                      <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 transition-all focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-emerald-500/60 dark:focus-within:bg-white/[0.07]">
                        <Lock
                          className="shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-500 dark:text-slate-500"
                          size={18}
                        />
                        <input
                          id="login-password"
                          className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            if (error) setError('')
                          }}
                          onKeyUp={handleKeyEvents}
                          onKeyDown={handleKeyEvents}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          autoFocus={Boolean(savedUsername)}
                          placeholder={copy.passwordPlaceholder}
                          required
                        />
                        <button
                          type="button"
                          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-200"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    {/* Remember + Forgot Password */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5 text-sm">
                      <label className="flex cursor-pointer select-none items-center gap-2.5 font-medium text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        {copy.rememberMe}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(username.includes('@') ? username : '')
                          setResetSent(false)
                          setResetError('')
                          setMode('forgot')
                        }}
                        className="font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        {copy.forgotPassword}
                      </button>
                    </div>

                    {/* Error Alert Banner */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300"
                          role="alert"
                        >
                          <AlertCircle size={17} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                          <span className="flex-1">{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <button
                      className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-emerald-950/60"
                      disabled={loading}
                      type="submit"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={19} className="animate-spin" />
                          {copy.signingInBtn}
                        </>
                      ) : (
                        <>
                          <LogIn size={19} />
                          {copy.signInBtn}
                        </>
                      )}
                    </button>
                  </form>

                  {/* Footer Divider */}
                  <div className="my-5 flex items-center gap-3">
                    <div className="flex-1 border-t border-slate-200 dark:border-white/10" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {copy.orText}
                    </span>
                    <div className="flex-1 border-t border-slate-200 dark:border-white/10" />
                  </div>

                  <p className="text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {copy.adminNote}
                  </p>
                </motion.div>
              ) : (
                /* ── Forgot Password View ── */
                <motion.div
                  key="forgot-view"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    <ArrowLeft size={15} />
                    {copy.backToLogin}
                  </button>

                  <div className="mb-6">
                    <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                      <KeyRound size={24} />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {copy.forgotTitle}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {copy.forgotSubtitle}
                    </p>
                  </div>

                  {resetSent ? (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/30">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" size={20} />
                          <div>
                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                              {copy.resetSentTitle}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-300/80">
                              {copy.resetSentMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                      >
                        <ArrowLeft size={17} />
                        {copy.backToLogin}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="reset-email"
                          className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                        >
                          {copy.workEmailLabel}
                        </label>
                        <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 transition-all focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-emerald-500/60">
                          <Mail className="shrink-0 text-slate-400 group-focus-within:text-emerald-500" size={18} />
                          <input
                            id="reset-email"
                            type="email"
                            required
                            autoFocus
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder={copy.workEmailPlaceholder}
                            className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                          />
                        </div>
                      </div>

                      {resetError && (
                        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300">
                          <AlertCircle size={15} className="mt-0.5 shrink-0" />
                          <span>{resetError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60"
                      >
                        {resetLoading ? (
                          <>
                            <Loader2 size={17} className="animate-spin" />
                            {copy.sendingResetBtn}
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            {copy.sendResetBtn}
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Mobile Features Row (shown below card on phones/tablets) */}
          <div className="mt-7 grid w-full max-w-[430px] grid-cols-3 gap-2.5 lg:hidden">
            {copy.features.map(([Icon, title, text]) => (
              <div
                key={title}
                className="flex flex-col items-center rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-center backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03]"
              >
                <Icon className="mb-1.5 text-emerald-500" size={18} />
                <p className="text-xs font-bold text-slate-800 dark:text-emerald-400">{title}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-slate-500 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
