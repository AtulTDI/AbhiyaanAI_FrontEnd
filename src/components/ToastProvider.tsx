import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { StyleSheet, Animated, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { AppTheme } from "../theme";

type ToastType = "success" | "error" | "warning" | "info";

type ToastContextType = {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

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
      setMessage(msg);
      setType(toastType);
      setVisible(true);

      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 60,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
      });
    },
    []
  );

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
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
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
      top: -20,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      maxWidth: 360,
      minWidth: 200,
      elevation: 5,
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      zIndex: 9999,
    },
    toastContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    toastText: {
      flexShrink: 1,
      flex: 1,
      fontSize: 14,
    },
  });
