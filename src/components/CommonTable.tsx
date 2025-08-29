import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Menu, useTheme, ActivityIndicator } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { AppTheme } from "../theme";
import { Table, Row } from "react-native-table-component";

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
  const { width: screenWidth } = useWindowDimensions();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [menuVisible, setMenuVisible] = useState(false);
  const [wrapperWidth, setWrapperWidth] = useState(0);
  const isWeb = Platform.OS === "web";

  const SCROLL_THRESHOLD = 900;
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
            flex: columns?.length > 7 ? 0.3 : 0.1,
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

  const totalFlex = enhancedColumns.reduce((sum, col) => sum + col.flex, 0);

  const widthArr = enhancedColumns.map((col) => {
    if (isWeb) {
      return (col.flex / totalFlex) * screenWidth;
    } else {
      if (col?.smallColumn) {
        return 80;
      }
      return Math.max(col.flex * 150, 200);
    }
  });

  const enableHorizontalScroll = wrapperWidth < SCROLL_THRESHOLD || columns.length > 7;

  return (
    <View style={styles.container}>
      <View
        style={styles.tableWrapper}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setWrapperWidth(width);
        }}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" />
          </View>
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
            <ScrollView
              style={styles.scrollArea}
              horizontal={!isWeb || enableHorizontalScroll}
              showsHorizontalScrollIndicator={true}
            >
              <Table borderStyle={{ borderWidth: 0 }}>
                <Row
                  data={tableHead}
                  style={styles.headerRow}
                  textStyle={[styles.headerCell, { color: colors.white }]}
                  widthArr={widthArr}
                />

                {tableData.map((rowData, rowIndex) => (
                  <Row
                    key={rowIndex}
                    data={rowData}
                    style={[styles.dataRow]}
                    textStyle={styles.dataCell}
                    widthArr={widthArr}
                  />
                ))}
              </Table>
            </ScrollView>

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
                {startIndex + 1}-{Math.min(endIndex, data.length)} of{" "}
                {data.length}
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
                    color={
                      page >= totalPages - 1 ? colors.borderGray : colors.black
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, width: "100%", paddingTop: 8 },
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
    scrollArea: {
      flexGrow: 1,
    },
    headerRow: {
      backgroundColor: theme.colors.primary,
      height: 46,
    },
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
      ...(Platform.OS === "web" ? { flexShrink: 1, flexWrap: "nowrap" } : {}),
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.borderGray,
    },
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
      paddingVertical: 40,
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
    rowsPerPageWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
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
      paddingVertical: 4,
    },
  });
