# SRV School — Faculty & Parent Portal

The unified web portal for **faculty** and **parent** users of the SRV School Management System, built with **React 19**, **Vite 6**, and **Tailwind CSS 4**.

---

## 🗂️ Folder Structure

```
portal/
├── public/                # Static assets
├── src/
│   ├── assets/            # Images, icons
│   ├── components/        # Shared UI components
│   ├── config/            # API config, constants
│   ├── portal/
│   │   ├── Login.js            # Shared login (faculty / parent)
│   │   ├── FacultyDashboard.js # Faculty dashboard & tools
│   │   ├── ParentDashboard.js  # Parent dashboard & tools
│   │   └── NotFound.js         # 404 page
│   ├── App.js             # Route definitions
│   ├── main.js            # React entry point
│   └── index.css          # Global styles
├── index.html
├── vite.config.js
└── .env                   # Environment variables (never commit)
```

---

## ✨ Features

### 👨‍🏫 Faculty
- Dashboard with class and student overview
- Mark and manage student attendance
- Create, assign, and track homework
- Record student behaviour incidents
- View timetable
- Access academic records and performance data
- Cafeteria menu viewer

### 👨‍👩‍👧 Parent
- Dashboard showing child's overview
- View daily/weekly attendance records
- View and download homework assignments
- Submit homework as PDF uploads
- Download academic report cards (PDF via jsPDF)
- View child's behaviour reports
- Cafeteria menu viewer

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm v9+
- Backend server running (see `../server/README.md`)

---

## 🚀 Local / Self-Hosted Setup

### 1. Install dependencies

```bash
cd portal
npm install
```

### 2. Configure environment variables

Create a `.env` file in this folder:

```env
VITE_API_URL=http://localhost:5001
```

For LAN / personal server hosting, replace `localhost` with your server's IP address:

```env
VITE_API_URL=http://192.168.1.10:5001
```

> ⚠️ The variable **must** start with `VITE_` to be accessible inside the Vite app.

### 3. Run in development mode

```bash
npm run dev
```

The portal opens at **http://localhost:3003**

From another device on the same network: **http://your-server-ip:3003**

---

## 🏗️ Build for Production (Self-Hosting as Static Files)

### 1. Build

```bash
npm run build
```

This creates a `dist/` folder with the compiled static files.

### 2. Serve with `serve`

```bash
npm install -g serve
serve -s dist -l 3003
```

### 3. Or serve with Nginx

```nginx
server {
    listen 80;
    server_name portal.yourdomain.com;  # or your server IP

    root /path/to/srv/portal/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔑 Login Roles

The login page (`/login`) is shared. The app detects the user role from the JWT token returned by the backend and redirects accordingly:

| Role | Redirects to |
|------|-------------|
| `faculty` | Faculty Dashboard |
| `parent` | Parent Dashboard |

Credentials are managed in the database. Contact your system administrator to create or reset accounts.

---

## 🗄️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Full URL to the backend API, e.g. `http://192.168.1.10:5001` |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank page after build | Make sure `VITE_API_URL` is set before building. Rebuild after any `.env` change. |
| Login fails / 401 errors | Verify the backend is running and reachable at `VITE_API_URL`. |
| CORS error in browser console | Add `http://your-server-ip:3003` to `allowedOrigins` in `server/server.js`. |
| PDF upload fails | Ensure the backend has the `express.raw` parser configured for `/api/parent/homework`. |
| `vite: command not found` | Run `npm install` first. |
| Port 3003 already in use | Change the port in `package.json` → `"dev": "vite --port=XXXX --host=0.0.0.0"`. |
