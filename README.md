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


=============================================================================


````markdown
# React Native (Expo Prebuild) – Android Build & Debug Guide

## 📌 Prerequisites

Make sure the following are installed and configured:

- **Node.js** (LTS recommended)  
- **npm** or **yarn**
- **Java JDK 17+**  
  ```bash
  java -version
````

* **Android Studio** (with Android SDK, AVD Manager, and platform tools)
* **Gradle** (comes with Android Studio, verify `./gradlew -v`)
* **ADB (Android Debug Bridge)**

  ```bash
  adb version
  ```

---

## 🌍 Environment Setup

We use `.env` files to separate API configs for **development** and **production**.

### `.env.development`

```env
EXPO_PUBLIC_API=http://10.0.2.2:5201
EXPO_PUBLIC_ALT_API=http://10.0.2.2:5202
```

> ✅ `10.0.2.2` is required instead of `localhost` when running inside **Android emulator**.

### `.env.production`

```env
EXPO_PUBLIC_API=https://api.yourdomain.com
EXPO_PUBLIC_ALT_API=https://alt-api.yourdomain.com
```

* Metro/Debug build automatically uses `.env.development`
* Release APK build uses `.env.production`

If using **[react-native-dotenv](https://www.npmjs.com/package/react-native-dotenv)** or Expo’s built-in env loader, variables prefixed with `EXPO_PUBLIC_` will be available in your code via:

```ts
process.env.EXPO_PUBLIC_API
```

---

## 🚀 Running on Emulator (Debug Mode)

1. Start emulator from Android Studio (**Tools > Device Manager**)
   or run:

   ```bash
   emulator -avd <your_avd_name>
   ```

2. Verify device is connected:

   ```bash
   adb devices
   ```

3. Run the app with Metro bundler:

   ```bash
   npx expo start
   ```

   * Press `a` to launch on emulator.
   * Bundler serves JS live.

---

## 🛠️ Building a Debug APK

Build APK without Metro (standalone debug build):

```bash
cd android
./gradlew assembleDebug
```

* APK path:

  ```
  android/app/build/outputs/apk/debug/app-debug.apk
  ```

Install it:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📦 Building a Release APK

1. Generate a **keystore** (first time only):

   ```bash
   keytool -genkeypair -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

   Save it inside:

   ```
   android/app/my-release-key.keystore
   ```

2. Add credentials to `android/gradle.properties`:

   ```properties
   MYAPP_UPLOAD_STORE_FILE=my-release-key.keystore
   MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
   MYAPP_UPLOAD_STORE_PASSWORD=your-password
   MYAPP_UPLOAD_KEY_PASSWORD=your-password
   ```

3. Update `android/app/build.gradle`:

   ```gradle
   signingConfigs {
       release {
           storeFile file(MYAPP_UPLOAD_STORE_FILE)
           storePassword MYAPP_UPLOAD_STORE_PASSWORD
           keyAlias MYAPP_UPLOAD_KEY_ALIAS
           keyPassword MYAPP_UPLOAD_KEY_PASSWORD
       }
   }
   buildTypes {
       release {
           signingConfig signingConfigs.release
           minifyEnabled false
           shrinkResources false
           debuggable false
       }
   }
   ```

4. Build the release APK:

   ```bash
   cd android
   ./gradlew assembleRelease
   ```

5. APK output:

   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

6. Install:

   ```bash
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```

---

## 🐞 Debugging Tips

* **View logs**:

  ```bash
  adb logcat
  ```

  Filter React logs:

  ```bash
  adb logcat *:E ReactNative:V ReactNativeJS:V
  ```

* **Clear Metro cache**:

  ```bash
  npx expo start -c
  ```

* **Clean Gradle build**:

  ```bash
  cd android
  ./gradlew clean
  ```

---

## ⚡ Quick Commands

* Start Metro + run app:

  ```bash
  npx expo start
  ```
* Build debug APK:

  ```bash
  cd android && ./gradlew assembleDebug
  ```
* Build release APK:

  ```bash
  cd android && ./gradlew assembleRelease
  ```
* Install APK:

  ```bash
  adb install -r <path-to-apk>
  ```
* List devices:

  ```bash
  adb devices
  ```

---

## 🎉 Happy Coding!

Build. Iterate. Deploy.

