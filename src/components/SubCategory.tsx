import React from "react";
import { View, FlatList, Pressable, StyleSheet } from "react-native";
import {
  Text,
  ActivityIndicator,
  useTheme,
  IconButton,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
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
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { isWeb } = usePlatformInfo();
  const styles = createStyles(theme);

  const numColumns = isWeb ? 2 : 1;

  if (loading) {
    return (
      <View style={styles.loaderOverlay}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        numColumns={numColumns}
        columnWrapperStyle={isWeb ? styles.row : undefined}
        contentContainerStyle={{
          paddingBottom: type === "surname" ? 100 : 16,
        }}
        keyExtractor={(item, index) => index.toString()}
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
                      color={
                        isColor ? theme.colors.white : theme.colors.primary
                      }
                      style={{ marginRight: 10 }}
                    />
                  )}

                  <View style={styles.textContainer}>
                    <Text
                      style={[
                        styles.label,
                        {
                          color: isColor
                            ? theme.colors.white
                            : theme.colors.primary,
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.label}
                    </Text>

                    {item.description ? (
                      <Text
                        style={[
                          styles.description,
                          {
                            color: isColor
                              ? theme.colors.white
                              : theme.colors.textSecondary,
                          },
                        ]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* COUNT BADGE */}
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
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="info-outline"
                size={36}
                color={theme.colors.borderGray}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyText}>{t("dashboard.noData")}</Text>
            </View>
          ) : null
        }
      />

      {/* PAGINATION */}
      {type === "surname" && totalRecords > 0 && (
        <View style={styles.floatingBar}>
          <Text style={styles.stickyCountText}>
            {t("voter.showingSurnames", {
              start: startRecord,
              end: endRecord,
              total: totalRecords,
            })}
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
              {t("voter.pageInfo", {
                current: page,
                total: totalPages,
              })}
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

    loaderOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255,255,255,0.6)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
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
      width: "48%",
    },

    cardContent: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
    },

    left: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },

    textContainer: {
      flex: 1,
      paddingRight: 8
    },

    label: {
      fontSize: 16,
      fontWeight: "600",
      flexShrink: 1,
    },

    description: {
      fontSize: 13,
      marginTop: 2,
      lineHeight: 16,
      flexShrink: 1,
    },

    countBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      minWidth: 50,
      alignItems: "center",
      flexShrink: 0,
      marginLeft: 8,
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

    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 30,
    },
    emptyText: {
      marginTop: 6,
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });
