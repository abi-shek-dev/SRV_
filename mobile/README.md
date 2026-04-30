# 📱 SRV Mobile — React Native Android App

The official Android mobile app for SRV School, built with **Expo**. A native replica of the web portal supporting both **Parent** and **Faculty** roles.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | React Navigation (native-stack + bottom-tabs) |
| HTTP | Axios |
| Storage | AsyncStorage (auth token) |
| Icons | @expo/vector-icons (Ionicons) |
| File Picker | expo-document-picker |
| Image Picker | expo-image-picker |

## App Details

```
Package: com.srv.school
Bundle:  Expo SDK 54 / React Native 0.81
Target:  Android (Play Store ready)
```

## Folder Structure

```
mobile/
├── App.js                        # Root — NavigationContainer + AuthProvider
├── src/
│   ├── config/
│   │   ├── api.js                # API_URL (switch for local/production)
│   │   └── theme.js              # Design tokens matching the web portal
│   ├── context/
│   │   └── AuthContext.js        # Login, logout, token management
│   ├── navigation/
│   │   ├── ParentNavigator.js    # Bottom tab nav for Parent role
│   │   └── FacultyNavigator.js   # Bottom tab nav for Faculty role
│   └── screens/
│       ├── auth/
│       │   └── LoginScreen.js
│       ├── parent/
│       │   ├── ParentDashboard.js
│       │   ├── HomeworkScreen.js
│       │   ├── AttendanceScreen.js
│       │   ├── BehaviorScreen.js
│       │   └── MoreScreen.js     # Fees, Events, Polls, Memories, Feedback
│       └── faculty/
│           ├── FacultyDashboard.js
│           ├── StudentsScreen.js
│           ├── FacultyHomeworkScreen.js
│           ├── FacultyAttendanceScreen.js
│           └── FacultyMoreScreen.js
└── app.json                      # Expo config (package name, permissions)
```

## Running for Development

```bash
cd mobile
npm install
npx expo start          # scan QR code with Expo Go app
```

### Testing on Physical Device (USB)
```bash
# Forward backend port via USB
adb reverse tcp:5000 tcp:5000
npx expo start
# Press 'a' for Android
```

### Testing on Android Emulator
```bash
# Update api.js → API_URL = 'http://10.0.2.2:5000'
npx expo start
# Press 'a' to open on emulator
```

## API Configuration

Edit `src/config/api.js` to switch environments:

```js
// Local development (USB debugging)
const API_URL = 'http://localhost:5000';

// Local development (WiFi / emulator)
const API_URL = 'http://10.0.2.2:5000';          // emulator
const API_URL = 'http://192.168.x.x:5000';       // WiFi (your PC IP)

// Production
const API_URL = 'https://your-backend.onrender.com';
```

## Building for Play Store

```bash
npm install -g eas-cli
eas login
eas build --platform android
```

## Design

The app uses a **light theme** matching the web portal:

| Token | Value |
|---|---|
| Background | `#f8fafc` |
| Surface (cards) | `#ffffff` |
| Primary text | `#0f172a` |
| Parent accent | Emerald `#059669` |
| Faculty accent | Amber `#f59e0b` |

## Permissions

- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` — PDF homework submission
- `CAMERA` — photo capture for memories
- `INTERNET` — API calls
