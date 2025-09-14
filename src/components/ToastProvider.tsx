import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { StyleSheet, Animated, View, Dimensions, Platform } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { registerToastTrigger } from "../services/toastService";
import { AppTheme } from "../theme";

type ToastType = "success" | "error" | "warning" | "info";

type ToastContextType = {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const { width: screenWidth } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("info");
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-100)).current;

  const showToast = useCallback(
    (msg: string, toastType: ToastType = "info", duration = 3000) => {
      if (!msg?.trim()) return;

      setMessage(msg);
      setType(toastType);
      setVisible(true);

      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 60,
          duration: 300,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.delay(duration),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start(() => {
        setVisible(false);
        setMessage("");
      });
    },
    []
  );

  // 🔗 Register for global access
  registerToastTrigger(showToast);

  const getIcon = (toastType: ToastType) => {
    const iconColor = iconColors[toastType];
    switch (toastType) {
      case "success":
        return <Ionicons name="checkmark-circle" size={20} color={iconColor} />;
      case "error":
        return (
          <MaterialIcons name="error-outline" size={20} color={iconColor} />
        );
      case "warning":
        return (
          <MaterialIcons name="warning-amber" size={20} color={iconColor} />
        );
      case "info":
      default:
        return <FontAwesome name="info-circle" size={20} color={iconColor} />;
    }
  };

  const backgroundColors = {
    success: colors.successBackground,
    error: colors.errorBackground,
    warning: colors.warningBackground,
    info: colors.infoBackground,
  };

  const iconColors = {
    success: colors.successIcon,
    error: colors.errorIcon,
    warning: colors.warningIcon,
    info: colors.infoIcon,
  };

  const textColors = {
    success: colors.successIcon,
    error: colors.errorIcon,
    warning: colors.warningIcon,
    info: colors.infoIcon,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <View style={[StyleSheet.absoluteFill, { pointerEvents: "box-none" }]}>
          <Animated.View
            style={[
              styles.toast,
              {
                backgroundColor: backgroundColors[type],
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.toastContent}>
              {getIcon(type)}
              <Text style={[styles.toastText, { color: textColors[type] }]}>
                {message}
              </Text>
            </View>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    toast: {
      alignSelf: "center",
      position: "absolute",
      top: isWeb ? 20 : 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      maxWidth: isWeb ? 400 : screenWidth * 0.9,
      width: "auto",
      elevation: 5,
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      zIndex: 9999,
    },
    toastContent: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "nowrap",
      gap: 10,
    },
    toastText: {
      flexGrow: 1,
      fontSize: 14,
    },
  });
