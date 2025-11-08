import fs from "fs";

const APP_ENV = process.env.APP_ENV || "development";
const BRAND = process.env.BRAND || "abhiyan";

// ---------- 1️⃣  API RESOLVERS ----------
const resolveApi = () => {
  switch (APP_ENV) {
    case "uat":
      return process.env.UAT_API;
    case "demo":
      return process.env.DEMO_API;
    case "production":
      return process.env.PROD_API;
    default:
      return process.env.DEV_API;
  }
};

const resolveAltApi = () => {
  switch (APP_ENV) {
    case "uat":
      return process.env.UAT_ALT_API;
    case "demo":
      return process.env.DEMO_ALT_API;
    case "production":
      return process.env.PROD_ALT_API;
    default:
      return process.env.DEV_ALT_API;
  }
};

// ---------- 2️⃣  LOAD BRAND CONFIG ----------
const brandFile = `./branding/${BRAND}.json`;
const brandConfig = fs.existsSync(brandFile)
  ? JSON.parse(fs.readFileSync(brandFile, "utf-8"))
  : {
      name: "AbhiyanAI",
      slug: "abhiyanai",
      package: "com.abhiyanai.app",
      icon: "./assets/abhiyan/icon.png",
      splash: "./assets/abhiyan/splash-icon.png",
      adaptiveIcon: "./assets/abhiyan/adaptive-icon.png",
      backgroundColor: "#ffffff",
    };

// ---------- 3️⃣  EXPORT FINAL CONFIG ----------
export default ({ config }) => ({
  ...config,
  expo: {
    ...config.expo,
    name: brandConfig.name,
    slug: brandConfig.slug,
    version: "1.0.0",
    orientation: "default",
    icon: brandConfig.icon,
    userInterfaceStyle: "light",
    newArchEnabled: true,
    assetBundlePatterns: ["**/*"],

    splash: {
      image: brandConfig.splash,
      resizeMode: "contain",
      backgroundColor: brandConfig.backgroundColor || "#ffffff",
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: brandConfig.package,
    },

    android: {
      adaptiveIcon: {
        foregroundImage: brandConfig.adaptiveIcon,
        backgroundColor: brandConfig.backgroundColor || "#ffffff",
      },
      edgeToEdgeEnabled: false,
      package: brandConfig.package,
      usesCleartextTraffic: true,
    },

    web: {
      favicon: brandConfig.favIcon,
      themeColor: brandConfig.backgroundColor || "#FFFFFF",
      manifest: {
        name: brandConfig.name,
        short_name: brandConfig.name,
        background_color: brandConfig.backgroundColor || "#FFFFFF",
        theme_color: brandConfig.backgroundColor || "#FFFFFF",
        icons: [
          {
            src: brandConfig.pwaSmallIcon,
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: brandConfig.pwaLargeIcon,
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    },

    extra: {
      ENV: APP_ENV,
      BRAND,
      API: resolveApi(),
      ALT_API: resolveAltApi(),
    },
  },
});
