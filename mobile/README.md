# SRV School — Mobile App

The mobile application for **faculty** and **parent** users of the SRV School Management System, built with **React Native** and **Expo SDK 54**.

---

## 🗂️ Folder Structure

```
mobile/
├── assets/                # App icons, splash screen, images
├── src/
│   ├── components/        # Shared UI components
│   ├── config/
│   │   ├── api.js         # ← Backend API base URL (edit this first!)
│   │   └── theme.js       # Design tokens (colors, fonts, spacing)
│   ├── context/           # React context (auth state, etc.)
│   ├── navigation/        # React Navigation stack & tab config
│   ├── screens/
│   │   ├── auth/          # Login screen
│   │   ├── faculty/       # Faculty-specific screens
│   │   │   ├── FacultyDashboard.js
│   │   │   ├── FacultyAttendanceScreen.js
│   │   │   ├── FacultyHomeworkScreen.js
│   │   │   ├── StudentsScreen.js
│   │   │   └── FacultyMoreScreen.js
│   │   └── parent/        # Parent-specific screens
│   │       ├── ParentDashboard.js
│   │       ├── AttendanceScreen.js
│   │       ├── HomeworkScreen.js
│   │       ├── BehaviorScreen.js
│   │       └── MoreScreen.js
│   └── utils/             # Helper functions
├── App.js                 # Root component
├── index.js               # Expo entry point
└── app.json               # Expo app configuration
```

---

## ✨ Features

### 👨‍🏫 Faculty
- Login with JWT authentication
- Dashboard — class overview & quick stats
- Mark and manage student attendance
- Create and track homework assignments
- View student list with profiles
- Access more tools (behaviour, timetable, etc.)
- Push notification support

### 👨‍👩‍👧 Parent
- Login with JWT authentication
- Dashboard — child's overview & latest updates
- View attendance records
- View homework and submit PDF assignments
- View behaviour reports
- Access more information (cafeteria menu, academic records, etc.)
- Push notification support

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm v9+
- [Expo Go](https://expo.dev/client) app installed on your physical device *(for development)*
- **OR** Android Studio / Xcode for emulator
- Backend server running and accessible (see `../server/README.md`)

---

## 🚀 Local / Self-Hosted Setup

### Step 1 — Install dependencies

```bash
cd mobile
npm install
```

### Step 2 — Set the API URL *(most important step)*

Open `src/config/api.js` and update `API_URL` to point to your backend server:

```js
// ── Option A: Same machine (USB debugging — recommended) ──────────
const API_URL = 'http://localhost:5001';

// ── Option B: Physical device on the same Wi-Fi network ──────────
const API_URL = 'http://192.168.1.10:5001';   // ← your PC/server LAN IP

// ── Option C: Android emulator ───────────────────────────────────
const API_URL = 'http://10.0.2.2:5001';
```

> **How to find your LAN IP:**
> - **Windows:** Open Command Prompt → `ipconfig` → look for **IPv4 Address**
> - **Linux/macOS:** Run `ip a` or `ifconfig`

### Step 3 — Start the Expo development server

```bash
npx expo start
```

Then choose how to run the app:

| Key | Action |
|-----|--------|
| `a` | Open on Android emulator |
| `i` | Open on iOS simulator (macOS only) |
| `w` | Open in web browser |
| Scan QR | Open in **Expo Go** app on your phone |

---

## 📱 Connecting a Physical Android Device (USB — Recommended)

This is the easiest way to use your local backend without configuring network IPs.

1. Enable **Developer Options** and **USB Debugging** on your Android device
2. Connect the device to your PC via USB
3. In a new terminal, run:

   ```bash
   adb reverse tcp:5001 tcp:5001
   ```

4. Keep `API_URL = 'http://localhost:5001'` in `api.js`
5. The device's `localhost` will tunnel to your PC's port 5001

> Verify ADB sees your device: `adb devices`

---

## 📱 Connecting via Wi-Fi (No USB)

1. Find your PC's LAN IP (`ipconfig` on Windows)
2. Set `API_URL` in `api.js` to `http://192.168.x.x:5001`
3. Make sure your phone and PC are on the **same Wi-Fi network**
4. Make sure your PC firewall allows connections on port 5001

---

## 🏗️ Building a Standalone APK

### Option A — EAS Build (Recommended, cloud-based)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

### Option B — Local Build (requires Android SDK)

```bash
npx expo run:android --variant release
```

The APK will be in `android/app/build/outputs/apk/release/`.

### Option C — Expo Export (bare React Native)

```bash
npx expo export
```

---

## 🔔 Push Notifications

Push notifications use `expo-notifications`. For them to work on a physical device:

1. Ensure the device has granted notification permissions
2. The backend must call the Expo Push API with the device's push token
3. Push tokens are stored per-user in the database

---

## 🗄️ Key Configuration Files

| File | Purpose |
|------|---------|
| `src/config/api.js` | Backend API base URL — **change this for your environment** |
| `src/config/theme.js` | Colors, fonts, and spacing tokens used throughout the app |
| `app.json` | Expo app name, icons, permissions, bundle identifiers |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Network request failed` | Check `api.js` URL. Make sure the backend server is running. |
| Can't reach server on phone | Use `adb reverse` for USB, or use your LAN IP for Wi-Fi. |
| QR code not scanning | Phone and PC must be on the same Wi-Fi. Try `npx expo start --tunnel`. |
| Metro bundler cache error | Run `npx expo start --clear` to clear the cache. |
| `Cannot read property of undefined` | Usually a missing API response field — check the backend logs. |
| Expo Go version mismatch | Run `npm install` to ensure SDK 54 packages are aligned. |
| `adb: command not found` | Install Android Studio and add platform-tools to your PATH. |
