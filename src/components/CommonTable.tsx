import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextStyle,
} from "react-native";
import { Menu, useTheme, ActivityIndicator } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { AppTheme } from "../theme";

type Column<T> = {
  label: string | React.ReactNode;
  key?: keyof T | "actions" | "radio" | string;
  flex: number;
  render?: (item: T, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  keyExtractor?: (item: T, index: number) => string;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  loading?: boolean;
  tableWithSelection?: boolean;
};

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20];

export default function CommonTable<T>({
  data,
  columns,
  keyExtractor = (_, index) => index.toString(),
  emptyText = "No data found",
  emptyIcon,
  loading = false,
  tableWithSelection,
}: Props<T>) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [menuVisible, setMenuVisible] = useState(false);

  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const enhancedColumns: Column<T>[] = [
    ...(!tableWithSelection
      ? [
          {
            key: "__sno__",
            label: "S.No.",
            flex: 0.7,
            render: (_: T, index: number) => (
              <Text style={{ color: colors.onSurface }}>
                {startIndex + index + 1}
              </Text>
            ),
          },
        ]
      : []),
    ...columns,
  ];

  const renderHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      {enhancedColumns.map((col) => (
        <View key={String(col.key)} style={[styles.cell, { flex: col.flex }]}>
          {col.renderHeader ? (
            col.renderHeader()
          ) : (
            <Text style={[styles.headerCell, { color: colors.white }]}>
              {col.label}
            </Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item, index }: { item: T; index: number }) => (
    <>
      <View style={styles.dataRow}>
        {enhancedColumns.map((col) => {
          const key = String(col.key);
          const value = item[col.key as keyof T];

          let displayNode: React.ReactNode;

          if (col.render) {
            displayNode = col.render(item, index);
          } else {
            displayNode =
              typeof value === "string" || typeof value === "number"
                ? String(value)
                : "-";
          }

          return (
            <View key={key} style={[styles.cell, { flex: col.flex }]}>
              {typeof displayNode === "string" ? (
                <Text
                  style={{ color: colors.onSurface }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {displayNode}
                </Text>
              ) : (
                displayNode
              )}
            </View>
          );
        })}
      </View>
      {index < paginatedData.length - 1 && <View style={styles.separator} />}
    </>
  );

  const renderPagination = () => (
    <>
      <View style={styles.divider} />
      <View style={styles.paginationContainer}>
        <View style={styles.rowsPerPageWrapper}>
          <Text style={styles.pageText}>Rows per page:</Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <View style={styles.dropdownTrigger}>
                  <Text style={styles.pageText}>{rowsPerPage}</Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={20}
                    color={colors.textTertiary}
                  />
                </View>
              </TouchableOpacity>
            }
          >
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <Menu.Item
                key={option}
                onPress={() => {
                  setRowsPerPage(option);
                  setPage(0);
                  setMenuVisible(false);
                }}
                title={`${option}`}
              />
            ))}
          </Menu>
        </View>

        <Text style={styles.pageText}>
          {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length}
        </Text>

        <View style={styles.pageNavWrapper}>
          <TouchableOpacity
            style={styles.navButton}
            disabled={page === 0}
            onPress={() => setPage((prev) => Math.max(prev - 1, 0))}
          >
            <MaterialIcons
              name="chevron-left"
              size={20}
              color={page === 0 ? colors.borderGray : colors.black}
            />
            <Text
              style={[
                styles.pageText,
                page === 0 && { color: colors.borderGray },
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            disabled={page >= totalPages - 1}
            onPress={() =>
              setPage((prev) => Math.min(prev + 1, totalPages - 1))
            }
          >
            <Text
              style={[
                styles.pageText,
                page >= totalPages - 1 && { color: colors.borderGray },
              ]}
            >
              Next
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={page >= totalPages - 1 ? colors.borderGray : colors.black}
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.tableWrapper}>
          {renderHeader()}
          <FlatList
            data={loading ? [] : paginatedData}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={
              paginatedData.length === 0
                ? {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }
                : { paddingBottom: 8 }
            }
            ListEmptyComponent={
              loading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" />
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  {emptyIcon}
                  <Text style={styles.emptyText}>{emptyText}</Text>
                </View>
              )
            }
            scrollEnabled
            style={{ flexGrow: 1 }}
          />
          {data.length > 0 && renderPagination()}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    tableWrapper: {
      backgroundColor: theme.colors.white,
      borderRadius: 12,
      overflow: "hidden",

      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 6,

      borderWidth: 1,
      borderColor: theme.colors.lightBackground,

      minWidth: 600,
      flex: 1,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 6,
    },
    headerRow: {
      backgroundColor: theme.colors.primary,
      height: 40
    },
    dataRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 6,
      backgroundColor: theme.colors.white,
    },
    headerCell: {
      fontWeight: "bold",
      fontSize: 14,
    },
    cell: {
      fontSize: 13,
      paddingHorizontal: 8,
    } as TextStyle,
    separator: {
      height: 1,
      backgroundColor: theme.colors.mutedBorder,
      marginHorizontal: 6,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.borderGray,
      marginTop: 6,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: "500",
      marginTop: 10,
    },
    paginationContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 12,
    },
    rowsPerPageWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    dropdownTrigger: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: theme.colors.borderGray,
      borderRadius: 4,
      marginLeft: 4,
    },
    pageText: {
      fontSize: 13,
      color: theme.colors.darkerGrayText,
    },
    pageNavWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    navButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
  });
