# 🏫 SRV Matriculation School — School Management System

A full-stack, production-ready school management platform with a **web admin panel**, a **parent & faculty portal**, and a native **Android mobile app** — all powered by a shared **Node.js + MySQL backend**.

---

## 📐 Architecture

```
srv/
├── server/      → Node.js + Express + MySQL REST API
├── admin/       → React web app — School Administrator
├── portal/      → React web app — Parent & Faculty
└── mobile/      → React Native (Expo) — Android App
```

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Admin Panel │   │    Portal    │   │  Mobile App  │
│  (port 3001) │   │  (port 3003) │   │  Expo / APK  │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       └──────────────────┴──────────────────┘
                          │
                 ┌────────▼────────┐
                 │  Express API    │
                 │  (port 5000)    │
                 └────────┬────────┘
                          │
                 ┌────────▼────────┐
                 │   MySQL DB      │
                 └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+
- XAMPP (or any MySQL server) running locally

### 1. Clone the repo
```bash
git clone https://github.com/abi-shek-dev/SRV_.git
cd SRV_
```

### 2. Set up the database
```bash
# Open phpMyAdmin or MySQL CLI
# Create database: srv_school
# Import: server/db/schema.sql
```

### 3. Configure the backend
```bash
cd server
cp .env.example .env    # fill in DB credentials and JWT_SECRET
npm install
npm run dev             # starts on port 5000
```

### 4. Start the Admin Panel
```bash
cd admin
npm install
npm run dev             # http://localhost:3001
```

### 5. Start the Portal (Parent + Faculty)
```bash
cd portal
npm install
npm run dev             # http://localhost:3003
```

### 6. Start the Mobile App
```bash
cd mobile
npm install
npx expo start          # scan QR with Expo Go
```

---

## 📦 Modules

### 🖥️ [server/](./server/README.md) — Backend API
- Express 5 REST API with JWT authentication
- MySQL 2 connection pool
- Role-based access: Admin / Faculty / Parent
- Rate limiting and Helmet security headers
- Routes: `/api/auth`, `/api/admin`, `/api/faculty`, `/api/parent`, `/api/public`

### 🎛️ [admin/](./admin/README.md) — Admin Dashboard
- Complete school administration interface
- Manage students, faculty, fees, announcements, events, polls, memories
- Academic performance reports and charts
- Runs at `http://localhost:3001`

### 🏫 [portal/](./portal/README.md) — Parent & Faculty Portal
- **Parent**: View child's attendance, homework, fees, behavior, events
- **Faculty**: Submit attendance, create homework, log behavior, post announcements
- Shared login page with role selector
- Runs at `http://localhost:3003`

### 📱 [mobile/](./mobile/README.md) — Android Mobile App
- React Native (Expo SDK 54) replica of the portal
- Parent and Faculty roles with bottom tab navigation
- PDF homework submission, attendance tracking, behavior logs
- Light theme matching the web portal (emerald + amber accents)
- Ready for Google Play Store via `eas build`

---

## 👤 Login Credentials

| Role | ID Format | Password |
|---|---|---|
| Admin | (set in DB) | Set during setup |
| Faculty | `FAC26001` | Set by admin |
| Parent | `SRV26001` | Child's DOB `DDMMYYYY` |

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5, MySQL 2 |
| Web Frontend | React 19, Vite, Tailwind CSS v4 |
| Mobile | React Native, Expo SDK 54 |
| Auth | JWT + bcryptjs |
| File Storage | Cloudinary |
| Security | Helmet, CORS, Rate Limiting |

---

## 📁 Branch

Active development branch: **`xe54z`**

---

## 📄 License

Private — SRV Matriculation School. All rights reserved.
