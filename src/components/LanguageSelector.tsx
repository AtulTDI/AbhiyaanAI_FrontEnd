import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
} from "react-native";
import { useTheme } from "react-native-paper";
import i18n from "../../i18n";
import { AppTheme } from "../theme";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "mr", label: "मराठी" },
];

export default function LanguageSelector() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (dropdownOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -8,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [dropdownOpen]);

  const switchLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setCurrentLang(code);
    setDropdownOpen(false);
  };

  const currentLabel = languages.find((l) => l.code === currentLang)?.label;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setDropdownOpen(!dropdownOpen)}
        activeOpacity={0.8}
      >
        <Text style={styles.selectedText}>{currentLabel}</Text>
        <Text style={styles.arrow}>{dropdownOpen ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {dropdownOpen && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <FlatList
            data={languages}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  currentLang === item.code && styles.selectedItem,
                ]}
                onPress={() => switchLanguage(item.code)}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.itemText,
                    currentLang === item.code && styles.selectedItemText,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    wrapper: {
      width: 120,
      position: "relative",
    },
    selectBox: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.primaryDark,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: theme.colors.white,
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      cursor: "pointer",
    },
    selectedText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textPrimary,
    },
    arrow: {
      fontSize: 11,
      color: theme.colors.primaryDark,
    },
    dropdown: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: 4,
      borderWidth: 1,
      borderColor: theme.colors.primaryDark,
      borderRadius: 6,
      backgroundColor: theme.colors.white,
      maxHeight: 120,
      overflow: "hidden",
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      zIndex: 1000,
    },
    dropdownItem: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomColor: theme.colors.mutedBorder,
      borderBottomWidth: 1,
      cursor: "pointer",
    },
    selectedItem: {
      backgroundColor: theme.colors.primaryLight,
    },
    itemText: {
      fontSize: 13,
      color: theme.colors.textPrimary,
    },
    selectedItemText: {
      fontWeight: "700",
      color: theme.colors.primaryDark,
    },
  });
