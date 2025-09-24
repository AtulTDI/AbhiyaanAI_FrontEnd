import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import i18n from "../../i18n";
import { AppTheme } from "../theme";
import { useTheme } from "react-native-paper";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "mr", label: "मराठी" },
];

export default function LanguageSelector() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const [currentLang, setCurrentLang] = React.useState(i18n.language);

  const switchLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setCurrentLang(code);
  };

  return (
    <View style={styles.container}>
      {languages.map(({ code, label }) => (
        <TouchableOpacity key={code} onPress={() => switchLanguage(code)}>
          <Text
            style={[
              styles.languageText,
              currentLang === code && styles.selectedLanguage,
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      alignItems: "center",
      paddingVertical: 8,
    },
    offeredText: {
      fontSize: 14,
      color: theme.colors.darkerGrayText,
      marginRight: 6,
    },
    languageText: {
      fontSize: 14,
      color: theme.colors.primary,
      textDecorationLine: "underline",
    },
    selectedLanguage: {
      fontWeight: "700",
      color: theme.colors.primary,
    },
  });
