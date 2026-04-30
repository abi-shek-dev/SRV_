# 🖥️ SRV Server — Backend API

The Node.js + Express + MySQL backend powering all SRV School portals and the mobile app.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express 5 |
| Database | MySQL 2 (connection pool) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Security | Helmet, CORS, express-rate-limit |
| Dev | nodemon |

## Folder Structure

```
server/
├── db/               # MySQL pool config & schema.sql
├── middleware/       # auth.js (protect, facultyOrAdmin), loginLimiter.js
├── models/           # ORM-style model helpers (Student, Attendance, Homework, etc.)
├── routes/           # Express route handlers
│   ├── auth.js       # Login / logout
│   ├── admin.js      # Admin CRUD
│   ├── faculty.js    # Faculty endpoints
│   ├── parent.js     # Parent endpoints
│   └── public.js     # Public enquiry / info
├── utils/            # Shared helpers (homework matching, poll service, etc.)
├── scripts/          # One-off maintenance scripts
├── server.js         # App setup (CORS, middleware, routes)
└── index.js          # Entry point — connects DB then starts server
```

## Environment Variables

Create a `.env` file in this folder:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=srv_school
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://yourdomain.com
```

## Running Locally

```bash
cd server
npm install
npm run dev       # starts with nodemon on the PORT in .env
```

## API Routes

| Prefix | Purpose |
|---|---|
| `POST /api/auth/login` | Login for all roles |
| `/api/admin/*` | Admin management (students, faculty, fees, etc.) |
| `/api/faculty/*` | Faculty operations (attendance, homework, behavior) |
| `/api/parent/*` | Parent views (student info, homework, fees, events) |
| `/api/public/*` | Public enquiry form |

## Notes

- **Dates** are stored as plain `YYYY-MM-DD` strings in MySQL to avoid UTC timezone shifts.
- Passwords are hashed with `bcryptjs` (10 rounds).
- Rate limiter allows 500 requests per 15 minutes per IP.
