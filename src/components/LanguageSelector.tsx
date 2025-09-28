import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  Platform,
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
  const [position, setPosition] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-8)).current;

  const selectBoxRef = useRef<View | null>(null);

  useEffect(() => {
    if (dropdownOpen && selectBoxRef.current) {
      if (Platform.OS === "web") {
        const domNode = (selectBoxRef.current as any);
        if (domNode && domNode.getBoundingClientRect) {
          const rect = domNode.getBoundingClientRect();
          setPosition({
            x: rect.left,
            y: rect.top,
            w: rect.width,
            h: rect.height,
          });
        }
      } else {
        selectBoxRef.current.measureInWindow((x, y, w, h) => {
          setPosition({ x, y, w, h });
        });
      }
    }
  }, [dropdownOpen]);

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
        ref={selectBoxRef}
        style={styles.selectBox}
        onPress={() => setDropdownOpen(!dropdownOpen)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.selectedText,
            { color: dropdownOpen ? theme.colors.textPrimary : theme.colors.primaryDark },
          ]}
        >
          {currentLabel}
        </Text>
        <Text style={styles.arrow}>{dropdownOpen ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      <Modal
        visible={dropdownOpen}
        transparent
        animationType="none"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
          <View style={styles.overlay}>
            {position && (
              <Animated.View
                style={[
                  styles.dropdown,
                  {
                    top: position.y + position.h + 4,
                    left: position.x,
                    width: position.w,
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
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    wrapper: { width: 120 },
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
    },
    arrow: {
      fontSize: 11,
      color: theme.colors.primaryDark,
    },
    overlay: {
      flex: 1,
      backgroundColor: "transparent",
    },
    dropdown: {
      position: "absolute",
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