# 🏫 SRV Portal — Parent & Faculty Web App

The unified web portal serving both **Parent** and **Faculty** roles. Parents can track their child's progress; faculty can manage homework, attendance, and behavior.

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

## Runs on

```
http://localhost:3003
```

## Features

### 👨‍👩‍👧 Parent Portal
- View child's profile, attendance %, and fees status
- Download and submit homework (PDF upload)
- Track behavior scores
- View school announcements, events, and cafeteria menu
- Participate in polls
- Browse school memories (photos/videos)

### 👨‍🏫 Faculty Portal
- Dashboard with class stats
- Create and manage homework assignments
- Submit daily attendance (P / A / L)
- Log behavior scores
- Post announcements
- View student profiles with academic history

## Folder Structure

```
portal/
├── src/
│   ├── portal/       # Parent + Faculty page components
│   │   ├── ParentDashboard.js
│   │   ├── FacultyDashboard.js
│   │   ├── Homework.js
│   │   ├── Attendance.js
│   │   └── ...
│   ├── components/   # Shared UI components
│   └── main.jsx
└── vite.config.js
```

## Running Locally

```bash
cd portal
npm install
npm run dev       # runs on http://localhost:3003
```

## Login

| Role | ID Format | Default Password |
|---|---|---|
| Parent | `SRV26001` | Child's DOB as `DDMMYYYY` |
| Faculty | `FAC26001` | Set by admin |
