const APP_ENV = process.env.APP_ENV || "development";

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
      "assetBundlePatterns": ["**/*"],

      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },

      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.abhiyaanai.app"
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
        API:
          APP_ENV === "production" ? process.env.PROD_API : process.env.DEV_API,
        ALT_API:
          APP_ENV === "production"
            ? process.env.PROD_ALT_API
            : process.env.DEV_ALT_API,
      },
    },
  };
};
