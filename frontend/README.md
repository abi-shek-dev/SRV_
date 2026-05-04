# SRV School — Public Website Frontend

The public-facing website for **SRV School**, built with **React 19** and **Vite**. This is the school's main marketing and information site — it is separate from the staff/admin portals which live in the `admin/` and `portal/` directories.

---

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets served as-is (favicon, etc.)
├── src/
│   ├── assets/             # Images, videos, and media (gitignored — add locally)
│   ├── components/         # Reusable UI components
│   │   ├── DomeGallery.js  # Interactive 3D dome-style gallery
│   │   ├── Footer.js       # Site-wide footer
│   │   ├── GradualBlur.js  # Scroll-based gradual blur effect
│   │   ├── Layout.js       # Root layout wrapper (Navbar + Footer + Outlet)
│   │   ├── Navbar.js       # Responsive navigation bar
│   │   ├── PageHero.js     # Reusable hero banner for inner pages
│   │   ├── ProtectedRoute.js # Auth guard (for legacy portal routes)
│   │   ├── ScrollToTop.js  # Scrolls to top on route change
│   │   └── StatsCtaBanner.js # Stats strip + call-to-action banner
│   ├── config/
│   │   ├── api.js          # Centralized API base URL (env-aware)
│   │   ├── galleryImages.js # Gallery image manifest
│   │   ├── pageImages.js   # Per-page hero/banner image config
│   │   └── siteContact.js  # School contact details config
│   ├── pages/              # One file per route
│   │   ├── Home.js
│   │   ├── About.js
│   │   ├── Academics.js
│   │   ├── Admission.js
│   │   ├── CoCurricular.js
│   │   ├── Facilities.js
│   │   ├── Gallery.js
│   │   ├── News.js
│   │   ├── SkillDevelopment.js
│   │   └── Contact.js
│   ├── portal/             # Legacy portal pages (now redirects to admin app)
│   ├── App.js              # Route definitions
│   ├── main.js             # React app entry point
│   └── index.css           # Global styles & Tailwind base
├── .env.example            # Environment variable template
├── index.html              # HTML entry point
├── vite.config.js          # Vite + React + Tailwind config
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Backend API base URL (no trailing slash)
VITE_API_URL=http://localhost:5001

# Gemini API key (only needed for AI features)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Add local assets

The `src/assets/` folder is **gitignored** to keep the repo lightweight (images and videos can be large). Place your local media files here before running the dev server. The expected structure is:

```
src/assets/
├── home/          # Hero images and videos for the Home page
├── fav_logo/      # Favicon and logo variants
├── Gallery/       # Gallery images
└── Skill Development/
    └── Activity logo/   # Club/activity logos
```

### 4. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:3000** (or the next available port on your network if `0.0.0.0` binding is active).

---

## 🛣️ Routes

| Path             | Page              | Description                          |
|------------------|-------------------|--------------------------------------|
| `/`              | Home              | Landing page with hero & highlights  |
| `/about`         | About             | School history, mission, and team    |
| `/academics`     | Academics         | Curriculum and academic programs     |
| `/admission`     | Admission         | Admission process and requirements   |
| `/skills`        | Skill Development | Extra skill & activity programs      |
| `/co-curricular` | Co-Curricular     | Clubs, sports, and events            |
| `/facilities`    | Facilities        | Campus infrastructure and amenities  |
| `/gallery`       | Gallery           | Photo & video gallery                |
| `/news`          | News              | Latest school news and announcements |
| `/contact`       | Contact           | Contact form and school details      |
| `/portal/*`      | —                 | Redirects to `/` (moved to admin app)|

---

## 🧰 Tech Stack

| Tool                     | Purpose                                   |
|--------------------------|-------------------------------------------|
| React 19                 | UI library                                |
| Vite 6                   | Build tool & dev server                   |
| React Router DOM 7       | Client-side routing                       |
| Tailwind CSS v4          | Utility-first CSS framework               |
| Motion (Framer Motion)   | Animations and transitions                |
| Lenis                    | Smooth scroll                             |
| Axios                    | HTTP client for API calls                 |
| Lucide React             | Icon set                                  |
| SweetAlert2              | Styled alert/modal dialogs                |
| jsPDF + html2canvas      | PDF generation (e.g. report cards)        |
| Recharts                 | Data charts and visualizations            |
| @google/genai            | Gemini AI integration                     |

---

## 📦 Available Scripts

| Command         | Description                                  |
|-----------------|----------------------------------------------|
| `npm run dev`   | Start Vite dev server on port 3000           |
| `npm run build` | Build production bundle to `dist/`           |
| `npm run preview` | Preview the production build locally       |
| `npm run clean` | Remove the `dist/` folder                   |

---

## 🖥️ Self-Hosting on a Local Server

This app is a **static SPA** (Single Page Application). Hosting it means:
1. Building a production bundle (`dist/`)
2. Serving those static files with a web server

### Step 1 — Build the production bundle

```bash
cd frontend
npm run build
```

This generates an optimized `dist/` folder containing `index.html` and all static assets.

---

### Option A — Quick test with `serve` (no config needed)

Great for a quick local check or LAN access.

```bash
npx serve dist -l 3000
```

The site will be available at `http://localhost:3000` (and on your LAN via your machine's IP).

> **SPA routing fix:** `serve` handles client-side routing automatically. If you use another static file server, make sure it redirects all 404s to `index.html`.

---

### Option B — Nginx (recommended for production LAN server)

#### 1. Install Nginx

- **Ubuntu/Debian:** `sudo apt install nginx`
- **Windows:** Download from [nginx.org](https://nginx.org/en/download.html) and run `nginx.exe`

#### 2. Copy the build output to the web root

```bash
# Linux example
sudo cp -r dist/* /var/www/html/srv-frontend/
```

#### 3. Create an Nginx site config

Create a file at `/etc/nginx/sites-available/srv-frontend`:

```nginx
server {
    listen 80;
    server_name your-server-ip;   # e.g. 192.168.1.100 or localhost

    root /var/www/html/srv-frontend;
    index index.html;

    # SPA fallback — send all routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: cache static assets
    location ~* \.(js|css|png|jpg|webp|webm|svg|ico|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4. Enable the site and reload Nginx

```bash
sudo ln -s /etc/nginx/sites-available/srv-frontend /etc/nginx/sites-enabled/
sudo nginx -t          # test config
sudo systemctl reload nginx
```

The site will be live at `http://your-server-ip/`.

---

### Option C — Keep the Vite preview server running with PM2

If you don't want to configure Nginx, you can keep the Vite preview server alive as a background process using **PM2**.

```bash
# Install PM2 globally (once)
npm install -g pm2

# Build and start the preview server
npm run build
pm2 start "npx vite preview --port 3000 --host 0.0.0.0" --name srv-frontend

# Auto-start on machine reboot
pm2 save
pm2 startup
```

Access the site at `http://your-server-ip:3000`.

---

### Setting `VITE_API_URL` for your local server

Before building, make sure your `.env` points to your local backend:

```env
VITE_API_URL=http://192.168.1.100:5001   # your server's LAN IP and backend port
```

Then rebuild: `npm run build`

> The API URL is **baked into the bundle at build time**, so always rebuild after changing it.

---

## 🌐 API Configuration

The frontend resolves the backend URL in this priority order:

1. `VITE_API_URL` environment variable (from `.env`)
2. `http://localhost:5001` — when running on localhost
3. `https://srv-backend-psi.vercel.app` — production fallback

This logic lives in `src/config/api.js`.

---

## 🗒️ Notes

- **Assets are gitignored.** The `src/assets/` folder must be populated manually on each machine. See [Add local assets](#3-add-local-assets) above.
- **Portal routes redirect.** Old `/portal/*` paths redirect to `/`. The actual Faculty and Parent dashboards are in the `admin/` app.
- **`.js` files contain JSX.** Vite is configured via `esbuild` to treat all `.js` files under `src/` as JSX.
