# SRV School — Backend Server

REST API for the SRV School Management System, built with **Node.js**, **Express 5**, and **MySQL 2**.

---

## 🗂️ Folder Structure

```
server/
├── db/
│   └── pool.js            # MySQL connection pool
├── middleware/            # Auth middleware (JWT verification)
├── models/                # DB query functions (per entity)
├── routes/
│   ├── auth.js            # Login / logout / token refresh
│   ├── admin.js           # Admin-only endpoints
│   ├── faculty.js         # Faculty endpoints
│   ├── parent.js          # Parent endpoints
│   ├── public.js          # Public (no-auth) endpoints
│   ├── tasks.js           # Task management
│   ├── performance.js     # Academic performance
│   ├── enquiry.js         # Enquiry / admissions
│   └── timetable.js       # Timetable management
├── services/              # Business logic services
├── utils/                 # Helper utilities
├── scripts/               # One-off / seed scripts
├── server.js              # Express app setup & middleware
├── index.js               # Entry point (starts server)
└── .env                   # Environment variables (never commit)
```

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MySQL](https://dev.mysql.com/downloads/) v8.0 or higher
- npm v9+

---

## 🚀 Local / Self-Hosted Setup

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Create the MySQL database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE srv_school CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

Import an existing dump (if available):

```bash
mysql -u root -p srv_school < srv_school_dump.sql
```

### 3. Configure environment variables

Create a `.env` file in this folder:

```env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=srv_school
JWT_SECRET=replace_with_a_very_long_random_secret_at_least_32_chars
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

> **Generate a secure JWT secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

### 4. Run the server

**Development** (auto-reload with nodemon):

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The API will be available at `http://localhost:5001`.

---

## 🌐 API Routes

| Prefix | File | Description |
|--------|------|-------------|
| `/api/auth` | `routes/auth.js` | Login, token management |
| `/api/admin` | `routes/admin.js` | Admin dashboard data, user management |
| `/api/faculty` | `routes/faculty.js` | Attendance, homework, behaviour, timetable |
| `/api/parent` | `routes/parent.js` | Child data, homework PDF submission |
| `/api/public` | `routes/public.js` | Public info (no auth required) |
| `/api/tasks` | `routes/tasks.js` | Task tracking |
| `/api/performance` | `routes/performance.js` | Academic performance records |
| `/api/enquiry` | `routes/enquiry.js` | School enquiry / admissions |
| `/api/timetable` | `routes/timetable.js` | Timetable CRUD |

---

## 🔒 CORS Configuration

All allowed origins are defined in `server.js` → `allowedOrigins` array.

**For local development** the following origins are pre-allowed:
- `http://localhost:3000`
- `http://localhost:3001` (Admin)
- `http://localhost:3002`
- `http://localhost:3003` (Portal)

**For self-hosting on a LAN or custom domain**, add your IP/domain:

```js
// server.js — allowedOrigins array
'http://192.168.1.10:3001',   // Admin portal
'http://192.168.1.10:3003',   // Faculty / Parent portal
```

Or set `CORS_ORIGIN` in `.env` for a single extra origin.

---

## 🔒 Security Features

- **Helmet** — sets secure HTTP headers
- **Rate Limiting** — 300 requests per 15 minutes (global)
- **JWT Authentication** — stateless, role-based (`admin` / `faculty` / `parent`)
- **bcryptjs** — password hashing
- **HPP** — HTTP parameter pollution protection
- **Request body size limit** — JSON capped at 10 KB; PDF uploads capped at 15 MB

---

## 🗄️ Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | `5001` | No | Server listen port |
| `DB_HOST` | `localhost` | Yes | MySQL hostname |
| `DB_PORT` | `3306` | No | MySQL port |
| `DB_USER` | `root` | Yes | MySQL username |
| `DB_PASS` | *(empty)* | Yes | MySQL password |
| `DB_NAME` | `srv_school` | Yes | MySQL database name |
| `JWT_SECRET` | — | **Yes** | JWT signing secret (min 32 chars) |
| `NODE_ENV` | `development` | No | `development` or `production` |
| `CORS_ORIGIN` | — | No | Additional allowed CORS origin |

---

## 🔁 Running with PM2 (Recommended for Production)

Keep the server running after you close the terminal and auto-restart on crashes:

```bash
npm install -g pm2

# Start
pm2 start index.js --name srv-backend

# Save to auto-start on system reboot
pm2 startup
pm2 save

# Useful commands
pm2 status
pm2 logs srv-backend
pm2 restart srv-backend
pm2 stop srv-backend
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `MySQL connection failed` | Check `.env` DB vars. Ensure MySQL is running (`mysql.server start` / `net start mysql`). |
| `Port 5001 already in use` | Change `PORT` in `.env` or run `npx kill-port 5001`. |
| CORS errors from frontend | Add the frontend origin to `allowedOrigins` in `server.js`. |
| JWT `invalid signature` | Ensure `JWT_SECRET` is the same in all `.env` files and hasn't changed since tokens were issued. |
| `nodemon: command not found` | Run `npm install` to install dev dependencies. |
