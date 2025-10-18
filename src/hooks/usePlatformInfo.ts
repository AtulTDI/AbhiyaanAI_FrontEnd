import { useWindowDimensions, Platform } from "react-native";

export const usePlatformInfo = () => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const isWeb = Platform.OS === "web";
  const isAndroid = Platform.OS === "android";
  const isIOS = Platform.OS === "ios";

  const isMobileApp = isAndroid || isIOS;

  let isRealMobileWeb = false;
  if (isWeb && typeof navigator !== "undefined") {
    const ua = (navigator.userAgent || navigator.vendor || "").toLowerCase();
    const isIpad = /ipad/.test(ua);
    const isMobile = /android|iphone|ipod|mobile|crios|fxios/.test(ua);
    isRealMobileWeb = isMobile || isIpad;
  }

  const isMobileWeb = isWeb && isRealMobileWeb;
  const isTablet = isWeb && !isRealMobileWeb && screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = isWeb && !isRealMobileWeb && screenWidth >= 1024;

  return {
    screenWidth,
    screenHeight,
    isWeb,
    isAndroid,
    isIOS,
    isMobileApp,
    isMobileWeb,
    isTablet,
    isDesktop,
  };
};