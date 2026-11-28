# Shadow Attendance

Full-stack employee attendance and outdoor sales tracking system built with Laravel 12, React (Vite + Tailwind CSS), and MySQL.

## Tech Stack

- **Backend:** Laravel 12, PHP 8.2+, Laravel Sanctum API authentication
- **Frontend:** React, Vite, Tailwind CSS
- **Database:** MySQL
- **Storage:** Cloudflare R2 (`r2`, default) or local `public` disk
- **Integrations:** Google Maps API, Telegram Bot notifications, client-side face detection (`@vladmandic/human`)

## Prerequisites

- **PHP 8.2+** (system `php`, MAMP, Laragon, or XAMPP)
- **Composer**
- **Node.js (v20+) & npm**
- **MySQL**

> If `php` or `mysql` is not in your system `PATH`, use the full binary path from your stack (for example, MAMP `C:\MAMP\bin\php\php8.x.x\php.exe` / `/Applications/MAMP/bin/php/php8.x.x/bin/php` or XAMPP `C:\xampp\php\php.exe`).

## First-Time Setup (After `git clone`)

### 1. Clone the repository

```powershell
git clone <your-repo-url>
cd attendance-system
```

### 2. Create the environment file

This project uses a **single `.env` file at the project root** for both Laravel and Vite (`VITE_*` variables):

```powershell
copy .env.example .env
```

Edit `.env` before running migrations:

- **Database:** Check `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` (default database name is `attendance_system_db`).
- **Initial Admin Logins:** Set `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (these accounts are created automatically by the migration).
- **Local Image Storage (optional):** Add `ATTENDANCE_IMAGES_DISK=public` if you do not have Cloudflare R2 credentials yet.
- **API Proxy:** Leave `VITE_API_URL` empty in local development so Vite proxies `/api` requests to `http://127.0.0.1:8000`.

### 3. Install dependencies & initialize backend

From `backend/`:

```powershell
cd backend
composer install
php artisan key:generate
php artisan storage:link
```

From `frontend/`:

```powershell
cd ..\frontend
npm install
cd ..
```

### 4. Create the database & run migrations

Start **MySQL** (MAMP, XAMPP, or local MySQL service), create the database, then run migrations and seeders:

```sql
CREATE DATABASE IF NOT EXISTS attendance_system_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```powershell
cd backend
php artisan migrate --seed
```

To wipe and re-seed from scratch later:

```powershell
cd backend
php artisan migrate:fresh --seed
```

### 5. Run the app

Open two terminals from the project root:

**Terminal 1 — Backend API:**

```powershell
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

**Terminal 2 — Frontend UI:**

```powershell
cd frontend
npm run dev -- --host 0.0.0.0 --port 5174
```

Open **`http://localhost:5174`** in your browser and sign in with the `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` (or `ADMIN_EMAIL` / `ADMIN_PASSWORD`) from your `.env`.

- **Frontend:** `http://localhost:5174` (or `https://localhost:5174` after generating local SSL certificates below)
- **Backend API:** `http://127.0.0.1:8000/api`

### Optional: Phone / LAN HTTPS Testing

Camera and GPS require HTTPS on non-localhost addresses (such as your PC's LAN IP):

1. Set `DEV_LAN_IP=<YOUR_PC_IP>` and add `<YOUR_PC_IP>,<YOUR_PC_IP>:5174` to `SANCTUM_STATEFUL_DOMAINS` in `.env`.
2. Run `.\scripts\setup-dev-https.ps1` (creates `frontend/cert.pem` and `frontend/key.pem`) and allow port `5174` in your firewall if needed.
3. Open `https://<YOUR_PC_IP>:5174` on your phone on the same Wi-Fi.

## Project Structure

```text
attendance-system/
  .env.example              Unified root env template (backend + frontend)
  .htaccess                 Apache/cPanel root routing & security rules
  index.php                 Root entry point (routes /api to Laravel, UI to frontend/dist)
  backend/                  Laravel 12 REST API
    app/Http/Controllers/   API controllers
    app/Models/             Eloquent models
    app/Repositories/       Query repositories
    app/Services/           Attendance, GPS, upload, schedule, Telegram services
    database/migrations/    MySQL migrations
    database/seeders/       Database seeders
    routes/api.php          API routes
  frontend/                 React + Vite + Tailwind UI
    src/pages/              Application pages
    src/components/         UI modals, settings, and shared components
    src/services/api.js     Axios API client
  database/schema.sql       Reference MySQL schema
  deploy/                   Hostinger deployment configs and guide
  docs/                     API, deployment, and structure docs
  scripts/                  Dev HTTPS setup and maintenance SQL scripts
```

## Main Features

- Sanctum token authentication with role-based permissions (Super Admin, Admin, Manager, Employee)
- Office & outdoor attendance check-in/check-out with selfie capture, face verification, GPS radius checks, and IP/branch restrictions
- Work schedules, late rules, late deduction rules, and bonus rules
- Outdoor sales tracking: customer visits, place visits, meal records, hotel stays, and GPS route history
- Permission requests with configurable types, limits, and attachments
- Employee monthly reports, admin attendance reports, CSV export, and payroll history
- Telegram notifications and login security alerts
- Attendance edit audit logs and Super Admin user activity logs

## Image Storage

`backend/config/filesystems.php` defaults to Cloudflare R2 (`ATTENDANCE_IMAGES_DISK=r2`).

- For local disk storage, set `ATTENDANCE_IMAGES_DISK=public` in `.env` (requires `php artisan storage:link` inside `backend/`).
- For Cloudflare R2, configure `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, and `R2_PUBLIC_URL` in `.env`, then verify with:

```powershell
cd backend
php artisan r2:test --image
```

## Useful Commands

**Backend (`backend/`):**

```powershell
php artisan route:list
php artisan config:clear
php artisan migrate
```

**Frontend (`frontend/`):**

```powershell
npm run lint
npm run build
```

## Deployment (Single-Folder cPanel / VPS)

You can deploy the whole repository in a single folder (`public_html/` on cPanel or your VPS web root) using the root [index.php](index.php) and [.htaccess](.htaccess):

1. Build the frontend (`cd frontend && npm ci && npm run build`) so `frontend/dist/` exists.
2. Install backend dependencies (`cd backend && composer install --no-dev --optimize-autoloader`), run `php artisan migrate --force`, and `php artisan storage:link`.
3. Configure `.env` at the project root (leave `VITE_API_URL` empty when frontend and backend share the same domain).
4. **Apache / cPanel:** Point the domain root to the project root — [.htaccess](.htaccess) blocks `.env`/`.git`/`backend/` direct access and routes `/api/*` to Laravel via [index.php](index.php) while serving `frontend/dist/` for the UI.
5. **Nginx (VPS):** Point `root` to `frontend/dist` for `/` and proxy `/api`, `/sanctum`, `/up` to `index.php` (or point `root` to the project root and pass `/api` + non-file routes to `index.php`).
6. **Docs:** See [docs/API.md](docs/API.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), and [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).
