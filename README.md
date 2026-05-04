# SRV School Management System

A full-stack school management platform built with **React + Vite** (web portals), **React Native / Expo** (mobile app), and **Node.js + Express + MySQL** (backend API).

---

## 📁 Project Structure

```
srv/
├── server/       # Express + MySQL REST API (backend)
├── admin/        # Admin portal — React + Vite (port 3001)
├── portal/       # Faculty & Parent portal — React + Vite (port 3003)
├── mobile/       # Faculty & Parent mobile app — Expo / React Native
└── frontend/     # Public school website — React + Vite (port 3000)
```

---

## 🧩 Features Overview

### 🖥️ Admin Portal (`/admin`)
- Secure admin login with JWT authentication
- Manage students, faculty, classes, and academic years
- Attendance overview and behaviour tracking
- Homework assignment management
- Timetable builder
- Cafeteria menu management
- Enquiry management system
- PDF report card generation
- Analytics dashboards with charts (Recharts / Chart.js)

### 🌐 Portal (`/portal`) — Faculty & Parent
**Faculty:**
- Dashboard with class overview
- Mark & manage student attendance
- Create and manage homework assignments
- Record student behaviour incidents
- View timetable and academic records

**Parent:**
- Dashboard with child's overview
- View attendance records
- View homework and submit PDF assignments
- Download academic report cards (PDF)
- View behaviour reports
- Cafeteria menu viewer

### 📱 Mobile App (`/mobile`) — Expo / React Native
- Faculty and Parent login (JWT-based)
- Faculty: attendance marking, homework, student list, more tools
- Parent: attendance, homework submission, behaviour, more info
- Push notification support (expo-notifications)
- File picker and PDF submission (expo-document-picker)
- Persistent auth via AsyncStorage

### 🌍 Public Website (`/frontend`)
- School's public-facing marketing website
- Pages: Home, About, Academics, Admission, Facilities, Gallery, News, Contact, Skill Development, Co-Curricular
- Smooth scroll (Lenis), animations (Motion / Framer Motion)
- Interactive dome-style photo gallery
- Stats & CTA banners, responsive Navbar and Footer
- Env-aware API base URL (auto-switches between local and production backend)

### ⚙️ Backend Server (`/server`)
- RESTful API built with Express 5 + MySQL 2
- Role-based JWT authentication (admin / faculty / parent)
- Rate limiting, Helmet security headers, CORS management
- Routes: `auth`, `admin`, `faculty`, `parent`, `public`, `tasks`, `performance`, `enquiry`, `timetable`
- Hourly cleanup of expired homework PDF BLOBs
- MySQL connection pooling with configurable timezone

---

## 🛠️ Prerequisites

Make sure these are installed on your personal server / machine:

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | v18+ | Run backend + build frontends |
| [npm](https://npmjs.com/) | v9+ | Package manager |
| [MySQL](https://dev.mysql.com/downloads/) | v8.0+ | Database |
| [Git](https://git-scm.com/) | any | Clone repo |
| [Expo CLI](https://docs.expo.dev/get-started/installation/) | latest | (mobile only) |

---

## 🚀 Self-Hosted Deployment Guide

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-org/srv.git
cd srv
```

---

### Step 2 — Set Up MySQL Database

1. Start MySQL and log in:
   ```bash
   mysql -u root -p
   ```

2. Create the database:
   ```sql
   CREATE DATABASE srv_school CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```

3. *(Optional)* If you have a SQL dump, import it:
   ```bash
   mysql -u root -p srv_school < srv_school_dump.sql
   ```

---

### Step 3 — Configure & Run the Backend Server

#### 3.1 — Install dependencies

```bash
cd server
npm install
```

#### 3.2 — Create the `.env` file

```bash
# server/.env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=srv_school
JWT_SECRET=replace_with_a_very_long_random_secret_at_least_32_chars
NODE_ENV=production
CORS_ORIGIN=http://your-server-ip-or-domain:3001
```

> **Tip:** Generate a strong JWT secret with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

> **CORS:** Add all origins that will call the API. Edit `server/server.js` → `allowedOrigins` array to include your domain(s) or IP(s):
> ```js
> 'http://192.168.1.10:3001',   // Admin portal
> 'http://192.168.1.10:3003',   // Faculty/Parent portal
> ```

#### 3.3 — Start the server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The API will be available at `http://localhost:5001` (or the `PORT` you set).

---

### Step 4 — Configure & Run the Admin Portal

#### 4.1 — Install dependencies

```bash
cd ../admin
npm install
```

#### 4.2 — Create the `.env` file

```bash
# admin/.env
VITE_API_URL=http://your-server-ip-or-domain:5001
```

Replace `your-server-ip-or-domain` with your machine's LAN IP (e.g. `192.168.1.10`) or your domain name.

#### 4.3 — Run in development mode

```bash
npm run dev
```

Access at: `http://localhost:3001`  
Or from another device on the same network: `http://your-server-ip:3001`

#### 4.4 — Build for production (serve as static files)

```bash
npm run build
```

Serve the `dist/` folder with any static file server, for example using **serve**:

```bash
npm install -g serve
serve -s dist -l 3001
```

Or with **Nginx** (see [Nginx section](#-optional-nginx-reverse-proxy) below).

---

### Step 5 — Configure & Run the Portal (Faculty & Parent)

#### 5.1 — Install dependencies

```bash
cd ../portal
npm install
```

#### 5.2 — Create the `.env` file

```bash
# portal/.env
VITE_API_URL=http://your-server-ip-or-domain:5001
```

#### 5.3 — Run in development mode

```bash
npm run dev
```

Access at: `http://localhost:3003`

#### 5.4 — Build for production

```bash
npm run build
serve -s dist -l 3003
```

---

### Step 6 — Configure & Run the Mobile App

The mobile app uses **Expo** and connects to your backend server via the device's network.

#### 6.1 — Install dependencies

```bash
cd ../mobile
npm install
```

#### 6.2 — Set the API URL

Open `mobile/src/config/api.js` and update the `API_URL` to point to your server:

```js
// Option A: Same machine (USB debugging via adb reverse)
const API_URL = 'http://localhost:5001';

// Option B: Physical device on the same Wi-Fi network
const API_URL = 'http://192.168.1.10:5001';  // ← your PC/server's LAN IP

// Option C: Android emulator
const API_URL = 'http://10.0.2.2:5001';
```

> **Find your LAN IP:**
> - Windows: run `ipconfig` → look for IPv4 Address
> - Linux/macOS: run `ip a` or `ifconfig`

#### 6.3 — Start the Expo development server

```bash
npx expo start
```

Then:
- Press **`a`** to open on Android emulator
- Press **`i`** to open on iOS simulator  
- Scan the **QR code** in Expo Go app on your physical device

#### 6.4 — USB Debugging (Android — recommended for local server)

Enable USB debugging on your Android device, connect via USB, then:

```bash
adb reverse tcp:5001 tcp:5001
```

This forwards your phone's `localhost:5001` to your PC's port 5001, so the app can reach your local server without needing to know the LAN IP.

#### 6.5 — Build a standalone APK (optional)

Install EAS CLI and build:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

Or build locally (requires Android SDK):

```bash
npx expo run:android --variant release
```

---

### Step 7 — Configure & Run the Public Website (Frontend)

#### 7.1 — Install dependencies

```bash
cd ../frontend
npm install
```

#### 7.2 — Add local assets

The `src/assets/` folder is **gitignored**. Place your local images and videos there before starting:

```
src/assets/
├── home/                        # Hero images and videos
├── fav_logo/                    # Logos and favicon variants
├── Gallery/                     # Gallery media
└── Skill Development/
    └── Activity logo/           # Club/activity logos
```

#### 7.3 — Create the `.env` file

```bash
# frontend/.env
VITE_API_URL=http://your-server-ip-or-domain:5001
GEMINI_API_KEY=your_gemini_api_key_here   # only if using AI features
```

#### 7.4 — Run in development mode

```bash
npm run dev
```

Access at: `http://localhost:3000`  
Or from another device on the same network: `http://your-server-ip:3000`

#### 7.5 — Build for production (serve as static files)

```bash
npm run build
```

Then serve the `dist/` folder:

```bash
npx serve dist -l 3000
```

Or with **Nginx** (see the [Nginx section](#-optional-nginx-reverse-proxy) below).

> **Important:** `VITE_API_URL` is baked into the bundle at build time. Always set it correctly in `.env` **before** running `npm run build`.

---

## 🔒 Running All Services Together

Open **5 separate terminal windows/tabs** and run each:

| Terminal | Command | Default Port |
|----------|---------|-------------|
| 1 — Server | `cd server && npm start` | `5001` |
| 2 — Admin | `cd admin && npm run dev` | `3001` |
| 3 — Portal | `cd portal && npm run dev` | `3003` |
| 4 — Mobile | `cd mobile && npx expo start` | Expo CLI |
| 5 — Frontend | `cd frontend && npm run dev` | `3000` |

---

## 🌐 Optional: Nginx Reverse Proxy

If you want clean URLs and a single entry point, configure **Nginx** as a reverse proxy on your server:

```nginx
# /etc/nginx/sites-available/srv-school

server {
    listen 80;
    server_name your-domain.com;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Admin Portal (serve built dist/)
    location /admin/ {
        root /path/to/srv/admin/dist;
        try_files $uri $uri/ /admin/index.html;
    }

    # Faculty & Parent Portal (serve built dist/)
    location /portal/ {
        root /path/to/srv/portal/dist;
        try_files $uri $uri/ /portal/index.html;
    }

    # Public Website Frontend (serve built dist/)
    location / {
        root /path/to/srv/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the config and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/srv-school /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔁 Optional: Keep Server Running with PM2

Use **PM2** to keep the Node.js backend running in the background and auto-restart on crashes:

```bash
npm install -g pm2

# Start server
pm2 start server/index.js --name srv-backend

# Auto-start on system reboot
pm2 startup
pm2 save

# Check status
pm2 status

# View logs
pm2 logs srv-backend
```

---

## 🗂️ Environment Variables Reference

### `server/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5001` | API server port |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL username |
| `DB_PASS` | *(empty)* | MySQL password |
| `DB_NAME` | `srv_school` | MySQL database name |
| `JWT_SECRET` | — | Secret for signing JWT tokens (required) |
| `NODE_ENV` | `development` | `development` or `production` |
| `CORS_ORIGIN` | — | Additional allowed CORS origin |

### `admin/.env` and `portal/.env`

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full URL of the backend API (e.g. `http://192.168.1.10:5001`) |

### `frontend/.env`

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full URL of the backend API (e.g. `http://192.168.1.10:5001`) |
| `GEMINI_API_KEY` | Google Gemini API key (only required if AI features are used) |

---

## 🚦 Going Live — Switching localhost to Production URLs

When deploying to a live/production server, you must replace all `localhost` references with your real server IP or domain. Below is a complete checklist of every file that needs updating.

> **Tip:** Find your server's public IP with `curl ifconfig.me` (Linux) or check your router/VPS dashboard.

---

### 1. Backend Server — CORS allowed origins

**File:** `server/server.js` → Lines 27–30

```js
// Replace each localhost entry with your live domain/IP
'http://localhost:3000',   →   'https://your-frontend-domain.com'
'http://localhost:3001',   →   'https://your-admin-domain.com'
'http://localhost:3002',   →   (remove or replace if unused)
'http://localhost:3003',   →   'https://your-portal-domain.com'
```

Or add your production origins alongside the existing localhost ones so both work.

---

### 2. Backend Server — `.env` file

**File:** `server/.env`

```env
# If MySQL runs on a different machine (e.g. a separate DB server)
DB_HOST=localhost   →   DB_HOST=your-db-server-ip

# Add your production frontend origins (comma-separated or set multiple in server.js)
CORS_ORIGIN=https://your-frontend-domain.com
```

> If MySQL is on the **same machine** as the server, `DB_HOST=localhost` is correct — no change needed.

---

### 3. Frontend Public Website — Portal Login Button

**File:** `frontend/src/components/Navbar.js` → Lines **164** and **266**

```js
// Desktop nav button (line 164)
href="http://localhost:3003/login"   →   href="https://your-portal-domain.com/login"

// Mobile nav drawer (line 266)
href="http://localhost:3003/login"   →   href="https://your-portal-domain.com/login"
```

---

### 4. Frontend Public Website — API base URL

**File:** `frontend/src/config/api.js`

```js
// Current (auto-switches between local and Vercel fallback):
const API_URL = import.meta.env.VITE_API_URL
  || (window.location.hostname === 'localhost'
      ? 'http://localhost:5001'
      : 'https://srv-backend-psi.vercel.app');   // ← update this fallback URL
```

**Recommended:** Set `VITE_API_URL` in `frontend/.env` instead of relying on the fallback:

```env
VITE_API_URL=https://your-backend-domain.com
```

Then rebuild: `npm run build`

---

### 5. Admin Portal — API base URL

**File:** `admin/src/config/api.js`

```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
//                                                ^^^^^^^^^^^^^^^^^^^^^^^^^^
//                              This fallback is fine for dev.
//                              For production, set VITE_API_URL in admin/.env
```

**`admin/.env`:**

```env
VITE_API_URL=https://your-backend-domain.com
```

Then rebuild: `npm run build`

---

### 6. Faculty & Parent Portal — API base URL

**File:** `portal/src/config/api.js`

```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
```

**`portal/.env`:**

```env
VITE_API_URL=https://your-backend-domain.com
```

Then rebuild: `npm run build`

---

### 7. Mobile App — API base URL

**File:** `mobile/src/config/api.js` → Line **4**

```js
// Change this to your live server's public IP or domain
const API_URL = 'http://localhost:5001';   →   const API_URL = 'https://your-backend-domain.com';
```

> The mobile app does **not** use `VITE_API_URL` — the URL is hardcoded directly in this file.

---

### Quick Reference Checklist

| # | File | What to Change | Change to |
|---|------|---------------|-----------|
| 1 | `server/server.js` lines 27–30 | `localhost:3000–3003` in CORS list | Your live frontend/admin/portal domain(s) |
| 2 | `server/.env` | `CORS_ORIGIN=` | Your live frontend origin(s) |
| 3 | `frontend/src/components/Navbar.js` lines 164 & 266 | `http://localhost:3003/login` | `https://your-portal-domain.com/login` |
| 4 | `frontend/.env` | `VITE_API_URL=` | `https://your-backend-domain.com` |
| 5 | `admin/.env` | `VITE_API_URL=` | `https://your-backend-domain.com` |
| 6 | `portal/.env` | `VITE_API_URL=` | `https://your-backend-domain.com` |
| 7 | `mobile/src/config/api.js` line 4 | `http://localhost:5001` | `https://your-backend-domain.com` |

> After updating `.env` files for the web portals, always run `npm run build` in that folder to bake the new URL into the production bundle.

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `MySQL connection failed` | Check `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` in `server/.env`. Ensure MySQL service is running. |
| CORS errors in browser | Add your frontend's origin to `allowedOrigins` in `server/server.js` and `CORS_ORIGIN` in `server/.env`. |
| Mobile app can't reach server | Use the machine's LAN IP (not `localhost`) in `mobile/src/config/api.js`. Make sure both devices are on the same Wi-Fi, or use `adb reverse`. |
| Port already in use | Change the `PORT` in `.env` or kill the process using it: `npx kill-port 5001`. |
| `vite: command not found` | Run `npm install` inside the respective folder before running `npm run dev`. |
| Expo QR code not scanning | Make sure your phone and PC are on the same network. Try switching Expo tunnel mode: `npx expo start --tunnel`. |

---

## 📄 License

This project is private and proprietary to SRV School. All rights reserved.
