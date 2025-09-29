const APP_ENV = process.env.APP_ENV || "development";

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

export default ({ config }) => {
  return {
    ...config,
    expo: {
      ...config.expo,
      name: "AbhiyaanAI",
      slug: "abhiyanai",
      version: "1.0.0",
      orientation: "default",
      icon: "./assets/logo.png",
      userInterfaceStyle: "light",
      newArchEnabled: true,
      assetBundlePatterns: ["**/*"],

      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },

      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.abhiyaanai.app",
      },

      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#ffffff",
        },
        edgeToEdgeEnabled: true,
        package: "com.anonymous.abhiyaan_ai",
        usesCleartextTraffic: true,
      },

      web: {
        favicon: "./assets/logo.png",
        name: "AbhiyaanAI",
      },

      extra: {
        ENV: APP_ENV,
        API: resolveApi(),
        ALT_API: resolveAltApi(),
      },
    },
  };
};
