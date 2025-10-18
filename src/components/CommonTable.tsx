import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Menu, useTheme, ActivityIndicator } from "react-native-paper";
import { Row } from "react-native-table-component";
import { MaterialIcons } from "@expo/vector-icons";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import { EllipsisCell } from "./EllipsisCell";
import { AppTheme } from "../theme";

type Column<T> = {
  label: string | React.ReactNode;
  key?: keyof T | "actions" | "radio" | string;
  flex: number;
  smallColumn?: boolean;
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
  tableHeight?: string;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (size: number) => void;
};

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

export default function CommonTable<T>({
  data,
  columns,
  keyExtractor = (_, index) => index.toString(),
  emptyText = "No data found",
  emptyIcon,
  loading = false,
  tableWithSelection,
  tableHeight,
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
}: Props<T>) {
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme, { isWeb, isMobileWeb });
  const { colors } = theme;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(10);
  const [menuVisible, setMenuVisible] = useState(false);
  const [wrapperWidth, setWrapperWidth] = useState(0);
  const [visibleTooltip, setVisibleTooltip] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(loading);

  const page = controlledPage ?? internalPage;
  const rowsPerPage = controlledRowsPerPage ?? internalRowsPerPage;
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData =
    controlledPage != null ? data : data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(
    totalCount > 0 ? totalCount / rowsPerPage : data.length / rowsPerPage
  );

  const enhancedColumns: Column<T>[] = [
    ...(!tableWithSelection
      ? [
          {
            key: "__sno__",
            label: t("sno"),
            flex: columns?.length > 7 ? 0.3 : totalCount >= 100 ? 0.2 : 0.1,
            smallColumn: true,
            render: (_: T, index: number) => (
              <Text style={styles.dataCell}>{startIndex + index + 1}</Text>
            ),
          },
        ]
      : []),
    ...columns,
  ];

  const tableHead = enhancedColumns.map((col) =>
    col.renderHeader ? col.renderHeader() : col.label
  );

  const tableData = paginatedData.map((item, index) =>
    enhancedColumns.map((col) => {
      const value = item[col.key as keyof T];
      if (col.render) return col.render(item, index);
      return typeof value === "string" || typeof value === "number"
        ? String(value)
        : "-";
    })
  );

  let enableHorizontalScroll = false;
  const totalFlex = enhancedColumns.reduce((sum, col) => sum + col.flex, 0);
  const containerWidth = screenWidth - 140;

  const widthArr = enhancedColumns.map((col) => {
    if (isWeb && !isMobileWeb) {
      return (col.flex / totalFlex) * screenWidth;
    }

    if ((isWeb || screenWidth < 600 || isMobileWeb) && col?.smallColumn)
      return 80;

    if (screenWidth < 600 || isMobileWeb) {
      return Math.max(col.flex * 150, 200);
    }

    const minWidth = col.smallColumn ? 80 : 100;
    const calculatedWidth = (col.flex / totalFlex) * containerWidth;

    return Math.max(calculatedWidth, minWidth);
  });

  if (isMobileWeb) {
    enableHorizontalScroll = true;
  } else if ((isWeb && !isMobileWeb) || screenWidth < 600) {
    enableHorizontalScroll = wrapperWidth < 900 || columns.length > 7;
  } else {
    const totalTableWidth = widthArr.reduce((sum, w) => sum + w, 0);
    enableHorizontalScroll = totalTableWidth > containerWidth;
  }

  const availableHeight =
    isWeb && !isMobileWeb
      ? tableHeight
        ? tableHeight
        : "calc(100vh - 260px)"
      : screenHeight * 0.66;

  useEffect(() => {
    let timer;
    if (loading) {
      setShowLoading(true);
    } else {
      timer = setTimeout(() => setShowLoading(false), 500);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleRowsPerPageChange = (newSize: number) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newSize);
    } else {
      setInternalRowsPerPage(newSize);
    }
    handlePageChange(0);
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.tableWrapper}
        onLayout={(event) => setWrapperWidth(event.nativeEvent.layout.width)}
      >
        {showLoading ? (
          <>
            <Row
              data={tableHead.map((head, idx) => (
                <View
                  key={idx}
                  style={{ width: widthArr[idx], justifyContent: "center" }}
                >
                  <Text
                    style={[
                      styles.headerCell,
                      { color: colors.white, width: "100%" },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {head}
                  </Text>
                </View>
              ))}
              style={styles.headerRow}
              widthArr={widthArr}
            />

            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loaderText}>{t("loadingData")}</Text>
            </View>
          </>
        ) : data.length === 0 ? (
          <View style={styles.emptyContainer}>
            {emptyIcon ?? (
              <MaterialIcons
                name="info-outline"
                size={40}
                color={colors.borderGray}
              />
            )}
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        ) : (
          <>
            {/* Horizontal scroll container */}
            <ScrollView
              horizontal={enableHorizontalScroll}
              nestedScrollEnabled
              showsHorizontalScrollIndicator={enableHorizontalScroll}
              contentContainerStyle={{
                minWidth: "100%",
                flexGrow: 1,
              }}
              style={[
                styles.scrollArea,
                isMobileWeb ? { overflowX: "auto" } : {},
              ]}
            >
              <View>
                {/* Header Row */}
                <Row
                  data={tableHead.map((head, idx) => (
                    <View
                      key={idx}
                      style={{ width: widthArr[idx], justifyContent: "center" }}
                    >
                      <Text
                        style={[
                          styles.headerCell,
                          { color: colors.white, width: "100%" },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {head}
                      </Text>
                    </View>
                  ))}
                  style={styles.headerRow}
                  widthArr={widthArr}
                />

                {/* Data Rows */}
                <View style={{ minHeight: 200, maxHeight: availableHeight }}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                    {tableData.map((rowData, rowIndex) => (
                      <Row
                        key={rowIndex}
                        data={rowData.map((cell, colIndex) => {
                          const cellKey = `${rowIndex}-${colIndex}`;
                          const cellWidth = widthArr[colIndex];
                          return (
                            <EllipsisCell
                              key={cellKey}
                              cellKey={cellKey}
                              width={cellWidth}
                              value={cell}
                              visibleTooltip={visibleTooltip}
                              setVisibleTooltip={setVisibleTooltip}
                              textStyle={styles.dataCell}
                              tableWithSelection={tableWithSelection}
                            />
                          );
                        })}
                        style={styles.dataRow}
                        widthArr={widthArr}
                      />
                    ))}
                  </ScrollView>
                </View>
              </View>
            </ScrollView>

            {/* Pagination */}
            <View style={styles.divider} />
            <View
              style={[
                styles.paginationContainer,
                isMobileWeb && { paddingVertical: 6, paddingHorizontal: 8 },
              ]}
            >
              {isWeb && !isMobileWeb ? (
                <>
                  <View style={styles.rowsPerPageWrapper}>
                    <Text style={styles.pageText}>{t("rowsPerPage")}:</Text>
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
                          onPress={() => handleRowsPerPageChange(option)}
                          title={`${option}`}
                        />
                      ))}
                    </Menu>
                  </View>

                  <Text style={styles.pageText}>
                    {startIndex + 1}-
                    {Math.min(endIndex, totalCount || data.length)} of{" "}
                    {totalCount || data.length}
                  </Text>

                  <View style={styles.pageNavWrapper}>
                    <TouchableOpacity
                      style={styles.navButton}
                      disabled={page === 0}
                      onPress={() => handlePageChange(Math.max(page - 1, 0))}
                    >
                      <MaterialIcons
                        name="chevron-left"
                        size={22}
                        color={page === 0 ? colors.borderGray : colors.black}
                      />
                      <Text
                        style={[
                          styles.pageText,
                          page === 0 && { color: colors.borderGray },
                        ]}
                      >
                        {t("previous")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.navButton}
                      disabled={page >= totalPages - 1}
                      onPress={() =>
                        handlePageChange(Math.min(page + 1, totalPages - 1))
                      }
                    >
                      <Text
                        style={[
                          styles.pageText,
                          page >= totalPages - 1 && {
                            color: colors.borderGray,
                          },
                        ]}
                      >
                        {t("next")}
                      </Text>
                      <MaterialIcons
                        name="chevron-right"
                        size={22}
                        color={
                          page >= totalPages - 1
                            ? colors.borderGray
                            : colors.black
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.mobilePaginationWrapper}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    disabled={page === 0}
                    onPress={() => handlePageChange(Math.max(page - 1, 0))}
                  >
                    <MaterialIcons
                      name="chevron-left"
                      size={24}
                      color={page === 0 ? colors.borderGray : colors.primary}
                    />
                  </TouchableOpacity>

                  <Text style={styles.pageText}>
                    {startIndex + 1}-
                    {Math.min(endIndex, totalCount || data.length)} /{" "}
                    {totalCount || data.length}
                  </Text>

                  <TouchableOpacity
                    style={styles.iconButton}
                    disabled={page >= totalPages - 1}
                    onPress={() =>
                      handlePageChange(Math.min(page + 1, totalPages - 1))
                    }
                  >
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={
                        page >= totalPages - 1
                          ? colors.borderGray
                          : colors.primary
                      }
                    />
                  </TouchableOpacity>

                  <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                      <TouchableOpacity
                        style={styles.rowsPerPageButton}
                        onPress={() => setMenuVisible(true)}
                      >
                        <Text style={styles.pageText}>{rowsPerPage}</Text>
                        <MaterialIcons
                          name="arrow-drop-down"
                          size={18}
                          color={colors.textTertiary}
                        />
                      </TouchableOpacity>
                    }
                  >
                    {ROWS_PER_PAGE_OPTIONS.map((option) => (
                      <Menu.Item
                        key={option}
                        onPress={() => handleRowsPerPageChange(option)}
                        title={`${option}`}
                      />
                    ))}
                  </Menu>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const createStyles = (
  theme: AppTheme,
  platform: { isWeb: boolean; isMobileWeb: boolean }
) =>
  StyleSheet.create({
    container: { flex: 1, width: "100%", minWidth: "100%", paddingTop: 8 },
    tableWrapper: {
      flex: 1,
      backgroundColor: theme.colors.white,
      borderRadius: 8,
      overflow: "hidden",
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.colors.borderGray,
    },
    scrollArea: { flex: 1 },
    headerRow: { backgroundColor: theme.colors.primary, height: 46 },
    headerCell: {
      fontWeight: "600",
      fontSize: 14,
      textAlign: "left",
      paddingHorizontal: 8,
    },
    dataRow: {
      height: 48,
      borderBottomWidth: 1,
      borderColor: theme.colors.borderGray,
    },
    dataCell: {
      fontSize: 13,
      textAlign: "left",
      color: theme.colors.onSurface,
      paddingHorizontal: 8,
      lineHeight: 20,
      ...(platform.isWeb && !platform.isMobileWeb
        ? {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            wordBreak: "break-word",
          }
        : {}),
    },
    divider: { height: 1, backgroundColor: theme.colors.borderGray },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      paddingVertical: 50,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loaderText: {
      marginTop: 10,
      fontSize: 14,
      color: theme.colors.darkerGrayText,
    },
    emptyText: {
      fontSize: 15,
      fontWeight: "500",
      marginTop: 8,
      color: theme.colors.darkerGrayText,
    },
    paginationContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: theme.colors.white,
    },
    mobilePaginationWrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flex: 1,
      paddingHorizontal: 10,
    },
    iconButton: { padding: 6 },
    rowsPerPageWrapper: { flexDirection: "row", alignItems: "center", gap: 4 },
    rowsPerPageButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: theme.colors.borderGray,
      borderRadius: 6,
      marginHorizontal: 6,
    },
    dropdownTrigger: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: theme.colors.borderGray,
      borderRadius: 6,
      marginLeft: 4,
    },
    pageText: { fontSize: 13, color: theme.colors.darkerGrayText },
    pageNavWrapper: { flexDirection: "row", alignItems: "center", gap: 8 },
    navButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
  });
