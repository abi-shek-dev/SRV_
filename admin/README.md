# 🎛️ SRV Admin Panel

The web-based administration dashboard for managing all school data — students, faculty, fees, announcements, events, polls, memories, and more.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM v7 |
| HTTP | Axios |
| Charts | Recharts |
| PDF | jsPDF + html2canvas |
| Animations | Motion |
| Alerts | SweetAlert2 |

## Features

- 🧑‍🎓 **Student Management** — Add, edit, delete students with full profile (family details, fees, SRV ID)
- 👨‍🏫 **Faculty Management** — Manage faculty accounts and class assignments
- 💰 **Fee Management** — Track term-wise fees, mark payments
- 📢 **Announcements** — Post school-wide announcements
- 📅 **Events** — Create and manage school events
- 📊 **Polls** — Create polls for parents
- 🖼️ **Memories** — Upload photos/videos via Cloudinary
- 📈 **Reports** — Academic performance and attendance analytics

## Running Locally

```bash
cd admin
npm install
npm run dev       # runs on http://localhost:3001
```

## Folder Structure

```
admin/
├── src/
│   ├── admin/        # All admin page components
│   ├── components/   # Shared UI components
│   └── main.jsx      # App entry
├── index.html
└── vite.config.js
```

## Environment

The admin panel reads the API URL from the Vite proxy config. For production, set:

```env
VITE_API_URL=https://your-backend-url.com
```
