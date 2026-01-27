import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppTheme } from "../theme";

type Props = {
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
};

export default function VoterCategoryCard({
  title,
  description,
  icon,
  onPress,
}: Props) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={26}
          color={theme.colors.primary}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      flex: 1,
      flexDirection: "row",
      gap: 12,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      backgroundColor: theme.colors.white,
      marginBottom: 14,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.primarySurface,
    },
    title: {
      fontWeight: "700",
      color: theme.colors.primary,
      marginBottom: 2,
    },
    desc: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
  });
