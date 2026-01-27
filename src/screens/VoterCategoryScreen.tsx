import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import { VOTER_CATEGORIES } from "../constants/voterCategories";
import VoterCategoryCard from "../components/VoterCategoryCard";
import { AppTheme } from "../theme";

type Props = {
  onSelectCategory: (id: number) => void;
};

export default function VoterCategoryScreen({ onSelectCategory }: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { isWeb } = usePlatformInfo();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.heading}>
        {t("voter.selectCategory")}
      </Text>

      <FlatList
        data={VOTER_CATEGORIES}
        key={isWeb ? "web" : "mobile"}
        numColumns={isWeb ? 2 : 1}
        columnWrapperStyle={isWeb ? styles.row : undefined}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <VoterCategoryCard
            title={t(item.title)}
            description={t(item.description)}
            icon={item.icon}
            onPress={() => onSelectCategory(item.id)}
          />
        )}
      />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.white,
    },
    heading: {
      fontWeight: "700",
      color: theme.colors.primary,
      marginBottom: 16,
    },
    row: {
      gap: 16,
    },
  });
