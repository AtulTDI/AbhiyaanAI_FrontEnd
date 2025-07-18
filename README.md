# 🚀 AbhiyaanAI - React Native + Expo App

A cross-platform mobile and web app built with **React Native**, **Expo**, and **TypeScript**. This project supports development on both **macOS** and **Windows** environments.

---

## 📦 Prerequisites

Before setting up the project, ensure the following tools are installed:

### ✅ Node.js & npm

Download and install from: https://nodejs.org  
> Use LTS version (18.x or higher recommended)

Verify installation:

```bash
node -v
npm -v
```

---

### ✅ Git

- **Windows**: https://git-scm.com/download/win  
- **macOS**: Pre-installed or install via [Homebrew](https://brew.sh)

---

### ✅ Expo CLI

Install globally:

```bash
npm install -g expo-cli
```

---

## 🛠️ Project Setup

### ✅ 1. Clone the Repository

```bash
git clone https://github.com/your-username/abhiyaanai.git
```

---

### ✅ 2. Install Dependencies

```bash
npm install
```

---

### ✅ 3. Environment Variables

Create the following environment files in the root:

```bash
# .env.development
EXPO_PUBLIC_API_URL=https://dev.api.abhiyaanai.com

# .env.production
EXPO_PUBLIC_API_URL=https://api.abhiyaanai.com
```

> 🛡️ Only variables prefixed with `EXPO_PUBLIC_` will be available inside the app.

---

## 🔧 Configure `app.config.js`

Create the file if not already present:

```js
// app.config.js
import "dotenv/config";

export default {
  expo: {
    name: "AbhiyaanAI",
    slug: "abhiyaanai",
    version: "1.0.0",
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
    },
  },
};
```

---

## 🧪 Running the App

### 📱 Start the App (Mobile & Web)

```bash
npx expo start
```

Then:

- Press `a` for Android emulator (if set up)
- Press `i` for iOS simulator (macOS only)
- Press `w` for web
- Scan QR with Expo Go on your phone

---

## 🌐 Run Only Web

```bash
npx run web
```

---

## 📁 Folder Structure

```
src/
├── App.tsx
├── app.config.js
├── .env.development
├── .env.production
├── assets/
├── components/
├── constants/
├── navigation/
├── screens/
├── services/
├── types/
└── utils/
```

---

## 💡 Development Notes

- ✅ TypeScript Ready
- ✅ Expo Router / React Navigation supported
- ✅ API layer using `axiosInstance` with interceptors
- ✅ Environment-aware configuration (`.env`)
- ✅ Works on both Web and Mobile
- ❗ iOS Simulator only available on macOS

---

## 📦 Build

For production builds:

```bash
npx expo export
```

Standalone apps:

```bash
npx expo build:android
npx expo build:ios
```

---

## ✅ Compatibility Matrix

| Feature                | macOS | Windows |
|------------------------|-------|---------|
| Android Emulator       | ✅    | ✅      |
| iOS Simulator (Xcode)  | ✅    | ❌      |
| Web Development        | ✅    | ✅      |
| Expo Go Testing        | ✅    | ✅      |

---

## 🧼 Clean Cache (If Needed)

```bash
npx expo start -c
```

---

## 🤝 Contributing

```bash
git checkout -b feature/my-feature
npm run lint
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [NativeBase (UI Library)](https://nativebase.io/)
- [React Native Data Table Alternatives](https://github.com/Gil2015/react-native-table-component)

---

## 🚨 Troubleshooting

- **Metro bundler not starting?** Try:  
  `npx expo start -c`
- **Environment variable not picked?** Ensure `app.config.js` uses `dotenv/config` and variables start with `EXPO_PUBLIC_`.

---

## 🎉 Happy Coding!

Build. Iterate. Deploy.