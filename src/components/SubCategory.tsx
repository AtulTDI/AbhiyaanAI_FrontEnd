import React from "react";
import { View, FlatList, Pressable, StyleSheet } from "react-native";
import {
  Text,
  ActivityIndicator,
  useTheme,
  IconButton,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import { AppTheme } from "../theme";

export default function Subcategory({
  title,
  items,
  loading,
  type,
  page,
  totalPages,
  onPageChange,
  totalRecords,
  startRecord,
  endRecord,
  onSelect,
  onBack,
}: any) {
  const theme = useTheme<AppTheme>();
  const { isWeb } = usePlatformInfo();
  const styles = createStyles(theme);

  const numColumns = isWeb ? 2 : 1;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.white }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={theme.colors.primary}
          onPress={onBack}
        />
        <Text style={styles.heading}>{title}</Text>
      </View>

      {/* LIST */}
      <FlatList
        data={items}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.value}
        columnWrapperStyle={isWeb ? styles.row : undefined}
        contentContainerStyle={{
          paddingBottom: type === "surname" ? 100 : 16,
        }}
        renderItem={({ item }) => {
          const isColor = type === "color";

          return (
            <Pressable
              onPress={() => onSelect(item.value)}
              style={[
                styles.cardShell,
                isWeb && styles.halfCard,
                {
                  backgroundColor: isColor ? item.color : theme.colors.white,
                  borderColor: isColor ? item.color : theme.colors.subtleBorder,
                },
              ]}
            >
              <View style={styles.cardContent}>
                {/* LEFT SIDE */}
                <View style={styles.left}>
                  {!isColor && item.icon && (
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={22}
                      color={theme.colors.primary}
                      style={{ marginRight: 10 }}
                    />
                  )}

                  <Text
                    style={[
                      styles.label,
                      {
                        color: isColor
                          ? theme.colors.white
                          : theme.colors.primary,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>

                {/* RIGHT COUNT */}
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isColor
                        ? "rgba(255,255,255,0.2)"
                        : theme.colors.softOrange + "40",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isColor
                        ? theme.colors.white
                        : theme.colors.darkOrange,
                      fontWeight: "700",
                    }}
                  >
                    {item.count}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      {/* PAGINATION (SURNAME ONLY) */}
      {type === "surname" && totalRecords > 0 && (
        <View style={styles.floatingBar}>
          <Text style={styles.stickyCountText}>
            Showing {startRecord}–{endRecord} of {totalRecords} surnames
          </Text>

          <View style={styles.stickyPager}>
            <IconButton
              size={18}
              style={styles.pagerIcon}
              icon="chevron-left"
              disabled={page === 1}
              onPress={() => onPageChange(page - 1)}
            />

            <Text style={styles.pageText}>
              Page {page} of {totalPages}
            </Text>

            <IconButton
              size={18}
              style={styles.pagerIcon}
              icon="chevron-right"
              disabled={page === totalPages}
              onPress={() => onPageChange(page + 1)}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },

    heading: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.primary,
    },

    row: {
      justifyContent: "space-between",
    },

    cardShell: {
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 12,
      overflow: "hidden",
    },

    halfCard: {
      width: "48%", // 2 per row on web
    },

    cardContent: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    left: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },

    label: {
      fontSize: 16,
      fontWeight: "600",
    },

    countBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      minWidth: 50,
      alignItems: "center",
    },

    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    floatingBar: {
      position: "absolute",
      bottom: 12,
      left: 18,
      right: 18,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: theme.colors.primarySurface,
      borderColor: theme.colors.primaryLight,
      paddingVertical: 12,
      paddingHorizontal: 12,
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },

    stickyPager: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },

    pagerIcon: {
      margin: 0,
      padding: 0,
    },

    stickyCountText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },

    pageText: {
      marginHorizontal: 4,
      fontWeight: "500",
      color: theme.colors.primary,
    },
  });
