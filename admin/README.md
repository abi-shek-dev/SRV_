# SRV School — Admin Portal

The administration panel for SRV School Management System, built with **React 19**, **Vite 6**, and **Tailwind CSS 4**.

---

## 🗂️ Folder Structure

```
admin/
├── public/                # Static assets
├── src/
│   ├── assets/            # Images, icons
│   ├── components/        # Shared UI components
│   ├── config/            # API config, constants
│   ├── portal/
│   │   ├── AdminDashboard.js   # Main admin panel (students, faculty, reports)
│   │   ├── AdminLogin.js       # Admin login page
│   │   ├── EnquiryPage.js      # Enquiry / admissions management
│   │   ├── FacultyDashboard.js # Faculty view (admin perspective)
│   │   ├── FacultyProgress.js  # Faculty progress reports
│   │   ├── ParentDashboard.js  # Parent view (admin perspective)
│   │   └── Login.js            # Shared login
│   ├── App.js             # Route definitions
│   ├── main.js            # React entry point
│   └── index.css          # Global styles
├── index.html
├── vite.config.js
└── .env                   # Environment variables (never commit)
```

---

## ✨ Features

- **Secure admin login** with JWT authentication
- **Student management** — add, edit, view, delete student profiles
- **Faculty management** — manage faculty records and roles
- **Attendance overview** — class-wise attendance tracking
- **Behaviour management** — log and review student behaviour incidents
- **Homework management** — create and assign homework
- **Timetable builder** — schedule classes and sessions
- **Cafeteria menu management** — manage daily/weekly menus
- **Enquiry management** — track school admissions enquiries
- **Report card generation** — download academic PDFs via jsPDF
- **Charts & analytics** — powered by Recharts and Chart.js
- **Responsive UI** — works on desktop and tablet

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm v9+
- Backend server running (see `../server/README.md`)

---

## 🚀 Local / Self-Hosted Setup

### 1. Install dependencies

```bash
cd admin
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

The portal opens at **http://localhost:3001**

From another device on the same network: **http://your-server-ip:3001**

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
serve -s dist -l 3001
```

### 3. Or serve with Nginx

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;  # or your server IP

    root /path/to/srv/admin/dist;
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

## 🔒 Admin Login

Default credentials are managed in the database. Use the backend's admin seeding script or insert directly via MySQL:

```sql
-- Example: update admin password (bcrypt hash)
UPDATE users SET password = '<bcrypt_hash>' WHERE role = 'admin';
```

---

## 🗄️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Full URL to the backend API, e.g. `http://192.168.1.10:5001` |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank page after build | Make sure `VITE_API_URL` is set correctly before building. Rebuild after changing `.env`. |
| Login fails / 401 errors | Verify the backend server is running and reachable at `VITE_API_URL`. |
| CORS error in browser console | Add `http://your-server-ip:3001` to `allowedOrigins` in `server/server.js`. |
| `vite: command not found` | Run `npm install` first. |
| Port 3001 already in use | Change the port in `package.json` → `"dev": "vite --port=XXXX --host=0.0.0.0"`. |
