# UI/UX Design Guide & Improvement Roadmap

This document outlines the design system, UI architecture, and actionable frontend improvement roadmap for **Shadow Attendance (SalesTrack)**.

---

## 1. Design System Foundations

### Tech Stack
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons:** `lucide-react`
- **Animations:** `framer-motion`
- **Charts & Analytics:** `recharts`
- **Maps:** `@react-google-maps/api`

### Color Palette & Surfaces
| Semantic Role | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| **App Background** | `#f7f9fc` (`bg-[#f7f9fc]`) | `slate-950` (`#020617`) | Main canvas behind cards |
| **Sidebar Surface** | `#071927` | `#071927` | Persistent dark navy navigation sidebar |
| **Card / Panel Surface** | `white` | `slate-900` (`#0f172a`) | Primary containers, modals, tables |
| **Card Border** | `slate-200/80` | `slate-800/80` | Subtle separation without heavy lines |
| **Primary Brand Accent** | `emerald-600` (`#059669`) | `emerald-500` (`#10b981`) | Primary buttons, active states, check-in actions |
| **Warning / Check-Out** | `amber-500` (`#f59e0b`) | `amber-400` (`#fbbf24`) | Check-out actions, late indicators, pending states |
| **Danger / Absent** | `rose-600` (`#e11d48`) | `rose-400` (`#fb7185`) | Absent badges, delete actions, error notices |
| **Info / Leave** | `sky-600` (`#0284c7`) | `sky-400` (`#38bdf8`) | On-leave status, office staff tags, links |

### Typography & Bilingual Support (English & Khmer)
- **Google Fonts Loaded (`frontend/index.html`):** `Plus Jakarta Sans`, `Inter`, `Kantumruy Pro`, and `Battambang`
- **English Font Stack (`--font-en-sans`):** `"Plus Jakarta Sans", "Inter", "Kantumruy Pro", "Battambang", "Noto Sans Khmer", "Khmer OS Siemreap", ui-sans-serif, system-ui, sans-serif`
- **Khmer Font Stack (`--font-km-sans` / `.lang-km`):** `"Kantumruy Pro", "Battambang", "Noto Sans Khmer", "Khmer OS Siemreap", "Khmer OS", "Plus Jakarta Sans", "Inter", sans-serif`
- **Khmer Line-Height & Clipping Rules:** Khmer script requires extra vertical breathing room (`line-height: 1.5` on headings, `1.65` on body/labels/buttons, `letter-spacing: 0`) and slightly enlarged micro-text (`text-xs`, `text-[11px]`) with vertical padding on `.truncate` elements to prevent clipping of upper/lower vowels (ស្រៈលើ / ស្រៈក្រោម / ជើងអក្សរ).

### Border Radius & Elevation Standards
- **Cards & Panels:** `rounded-2xl` with `shadow-sm` and `border border-slate-200/80 dark:border-slate-800`
- **Modals & Dialogs:** `rounded-2xl` with `shadow-2xl` and `backdrop-blur-sm` overlay
- **Inputs & Buttons:** `rounded-xl` (`h-11` standard height for touch friendliness)
- **Status Pills & Badges:** `rounded-full px-3 py-1 text-xs font-semibold` with explicit dark-mode variants

---

## 2. UI Improvement Roadmap

### Phase 1: App Shell, Header & Navigation (`frontend/src/App.jsx`)
1. **Mini Icon-Rail Sidebar Mode (Desktop)**
   - **Current:** Collapsing the sidebar hides it completely (`lg:-translate-x-full`).
   - **Improvement:** Collapse into a `w-20` (80px) icon-only rail with hover tooltips and active pill indicators so desktop users can switch pages in one click.
2. **Global Quick Search / Command Palette (`Ctrl + K`)**
   - Add a search trigger in the sticky header to quickly jump to any page (*Payroll History*, *Employee Monthly Report*, *Late Rules*, *Branches*) or search employees.
3. **Header Breadcrumbs & Live Duty Pill**
   - Display contextual breadcrumbs (`Reports / Employee Monthly Report`) alongside a live attendance status badge (`Working • 03h 14m` or `Not Checked In`) in the top bar.
4. **Refined Profile Dropdown Menu**
   - Replace oversized `text-lg` menu items with a compact, structured user menu (`text-sm font-medium`), role badge, quick link to **Profile**, **My Attendance**, and **Logout**.

---

### Phase 2: Dashboard & Visual Hierarchy (`frontend/src/pages/DashboardPage.jsx`)
1. **Hero Attendance Control Card**
   - **Current:** Displays hardcoded placeholder text (`"Inside Office Radius"` / `"42m from office"`).
   - **Improvement:** Connect to real attendance/branch data or live GPS check, and unify the **Live Digital Clock**, **Check-In/Out Circle Button**, and **Today's Check-In/Out Timeline** into a balanced 2-column or hero layout.
2. **Interactive KPI Summary Cards**
   - Make the 5 top summary cards (*Present Today*, *Late Today*, *Absent Today*, *On Leave*, *Missing Check Out*) interactive filter triggers that filter the **Today's Attendance Table** on click.
3. **Outdoor Sales Daily Activity Stepper**
   - Enhance `OutdoorSaleLabels` with a visual progress bar (`Step 1 of 5`) and clear active/completed/locked card states for field sales staff.
4. **Page & Modal Motion (`framer-motion`)**
   - Add smooth fade/slide page transitions (`initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`) and modal scale transitions.

---

### Phase 3: Mobile & Field Staff Experience (`frontend/src/components/layout/MobileNav.jsx`)
1. **Quick-Action Bottom Sheet for Field Staff**
   - Add a quick-action launcher on mobile for outdoor sales activities (*Start Place Visit*, *Record Meal*, *Hotel Stay*, *Route Map*) so mobile staff rarely need the top-left hamburger drawer.
2. **Responsive Card View for Data Tables**
   - On screens `< 768px` (or via a **Table / Grid toggle**), render wide tables (`EmployeesPage`, `AttendanceHistoryPage`, `PermissionRequestsPage`) as touch-friendly stacked cards instead of requiring `1320px` horizontal scrolling.

---

### Phase 4: Shared Components & Micro-Interactions (`frontend/src/components/shared/UI.jsx`)
1. **Dark-Mode Ready `StatusPill`**
   - Add dark mode classes to every status variant (e.g., `bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/50`).
2. **Non-Blocking Toast Notifications**
   - Replace browser `window.alert()` calls with a floating Toast notification component (`success`, `warning`, `error`, `info`) with auto-dismiss.
3. **Sticky Table Headers & Action Columns**
   - Keep the right-most `Actions` column and top `thead` sticky on wide data tables so edit/delete buttons remain visible while scrolling.

---

## 3. Key Frontend Files Reference

- **App Shell & Navigation:** `frontend/src/App.jsx`
- **Global Styles & Khmer Print Rules:** `frontend/src/index.css`
- **Mobile Bottom Navigation:** `frontend/src/components/layout/MobileNav.jsx`
- **Shared UI Primitives:** `frontend/src/components/shared/UI.jsx`
- **Dashboards (Admin & Employee):** `frontend/src/pages/DashboardPage.jsx`
- **Check-In / Check-Out Modal:** `frontend/src/components/attendance/AttendanceActionModal.jsx`
- **Employee Directory:** `frontend/src/pages/EmployeesPage.jsx`
- **Login Screen:** `frontend/src/pages/LoginPage.jsx`
