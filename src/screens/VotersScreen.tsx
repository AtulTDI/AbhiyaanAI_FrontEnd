import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import {
  Text,
  useTheme,
  Searchbar,
  Chip,
  IconButton,
  TextInput,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import VoterDetailView from "../components/VoterDetailView";
import { Voter } from "../types/Voter";
import { useDebounce } from "../hooks/useDebounce";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import { getVoterById, getVoters } from "../api/voterApi";
import { AppTheme } from "../theme";

type AgeMode = "none" | "lt" | "gt" | "between";
type ScreenView = "list" | "detail";

const PAGE_SIZE = 30;

/* ---------------- SCREEN ---------------- */
export default function VotersScreen() {
  const { isWeb } = usePlatformInfo();
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme, { isWeb });

  const numColumns = isWeb ? 2 : 1;

  const [view, setView] = useState<ScreenView>("detail");
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<"All" | "Male" | "Female">("All");

  const [ageMode, setAgeMode] = useState<AgeMode>("none");
  const [ageValue, setAgeValue] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  const [page, setPage] = useState(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [voters, setVoters] = useState<Voter[]>([]);
  const [voterCount, setVoterCount] = useState(0);
  const [voterStack, setVoterStack] = useState<Voter[]>([]);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  /* ---------------- DEBOUNCED VALUES ---------------- */
  const debouncedSearch = useDebounce(search, 500);
  const debouncedAgeValue = useDebounce(ageValue, 500);
  const debouncedMinAge = useDebounce(minAge, 500);
  const debouncedMaxAge = useDebounce(maxAge, 500);

  const delay = (ms: number): Promise<void> =>
    new Promise<void>((resolve) => {
      setTimeout(() => resolve(), ms);
    });

  /* ---------------- INITIAL LOADER ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  /* ---------------- FETCH VOTERS ---------------- */
  const fetchVoters = useCallback(async () => {
    try {
      let ageParam: string | undefined;

      if (ageMode === "between" && debouncedMinAge && debouncedMaxAge) {
        ageParam = `${debouncedMinAge}-${debouncedMaxAge}`;
      } else if ((ageMode === "lt" || ageMode === "gt") && debouncedAgeValue) {
        ageParam = `${ageMode === "lt" ? "<" : ">"}${debouncedAgeValue}`;
      }

      const res = await getVoters(
        page,
        PAGE_SIZE,
        debouncedSearch ?? "",
        ageParam,
        gender === "All" ? undefined : gender
      );

      setVoterCount(res?.data?.totalRecords ?? 0);
      setVoters(res?.data?.data ?? []);
    } catch {}
  }, [
    page,
    debouncedSearch,
    debouncedAgeValue,
    debouncedMinAge,
    debouncedMaxAge,
    gender,
  ]);

  /* ---------------- FOCUS EFFECT ---------------- */
  useFocusEffect(
    useCallback(() => {
      setVoterStack([]);
      setSelectedVoter(null);
      setView("list");
      fetchVoters();
    }, [fetchVoters])
  );

  const totalPages = Math.ceil(voterCount / PAGE_SIZE);
  const startRecord = voterCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRecord = Math.min(page * PAGE_SIZE, voterCount);

  const clearFilters = () => {
    setGender("All");
    setAgeMode("none");
    setAgeValue("");
    setMinAge("");
    setMaxAge("");
    setPage(1);
    setShowFilters(false);
  };

  const openVoterDetail = async (voterOrId: Voter | string) => {
    try {
      setTransitionLoading(true);

      const [voter] = await Promise.all([
        typeof voterOrId === "string"
          ? getVoterById(voterOrId).then((r) => r.data)
          : Promise.resolve(voterOrId),
        delay(500),
      ]);

      setVoterStack((prev) =>
        selectedVoter ? [...prev, selectedVoter] : prev
      );

      setSelectedVoter(voter);
      setView("detail");
    } finally {
      setTransitionLoading(false);
    }
  };

  const goBackFromDetail = async () => {
    try {
      setTransitionLoading(true);

      await delay(500);

      setVoterStack((prev) => {
        if (prev.length === 0) {
          setSelectedVoter(null);
          setView("list");
          return [];
        }

        const copy = [...prev];
        const last = copy.pop();
        setSelectedVoter(last!);
        return copy;
      });
    } finally {
      setTransitionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loaderText}>{t("voter.loading")}</Text>
      </View>
    );
  }

  if (transitionLoading) {
    return (
      <View style={styles.transitionOverlay}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (view === "detail" && selectedVoter) {
    return (
      <VoterDetailView
        voter={selectedVoter}
        onBack={goBackFromDetail}
        onOpenVoter={openVoterDetail}
      />
    );
  }

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.heading}>
          {t("voter.plural")}
        </Text>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={t("voter.searchPlaceholder")}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setPage(1);
            }}
            style={styles.search}
          />
        </View>

        {/* COLLAPSIBLE FILTER PANEL */}
        <View style={styles.filterPanel}>
          <Pressable
            style={styles.filterHeader}
            onPress={() => setShowFilters((prev) => !prev)}
          >
            <Text style={styles.filterTitle}>{t("voter.filters")}</Text>
            <IconButton
              icon={showFilters ? "chevron-up" : "chevron-down"}
              onPress={() => setShowFilters((prev) => !prev)}
            />
          </Pressable>

          {showFilters && <Divider style={styles.filterDivider} />}

          {showFilters && (
            <View style={styles.filtersContainer}>
              {isWeb ? (
                /* ==================== WEB: EVERYTHING IN ONE LINE ==================== */
                <View style={styles.filterRow}>
                  <Text style={styles.filterSectionLabel}>
                    {t("voter.gender")}
                  </Text>

                  {["All", "Male", "Female"].map((g) => (
                    <Chip
                      key={g}
                      selected={gender === g}
                      onPress={() => {
                        setGender(g as any);
                        setPage(1);
                      }}
                      style={[
                        styles.filterChip,
                        gender === g && styles.filterChipSelected,
                      ]}
                    >
                      {t(`voter.gender${g}`)}
                    </Chip>
                  ))}

                  <View style={styles.verticalDivider} />

                  <Text style={styles.filterSectionLabel}>
                    {t("voter.age")}
                  </Text>

                  {[
                    { key: "lt", label: t("voter.ageLt") },
                    { key: "gt", label: t("voter.ageGt") },
                    { key: "between", label: t("voter.ageBetween") },
                  ].map((m) => (
                    <Chip
                      key={m.key}
                      selected={ageMode === m.key}
                      onPress={() => {
                        setAgeMode(m.key as AgeMode);
                        setAgeValue("");
                        setMinAge("");
                        setMaxAge("");
                        setPage(1);
                      }}
                      style={[
                        styles.filterChip,
                        ageMode === m.key && styles.filterChipSelected,
                      ]}
                    >
                      {m.label}
                    </Chip>
                  ))}

                  {(ageMode === "lt" || ageMode === "gt") && (
                    <TextInput
                      mode="outlined"
                      placeholder={t("voter.age")}
                      placeholderTextColor={theme.colors.placeholder}
                      value={ageValue}
                      onChangeText={setAgeValue}
                      keyboardType="numeric"
                      style={styles.compactAgeInput}
                    />
                  )}

                  {ageMode === "between" && (
                    <>
                      <TextInput
                        mode="outlined"
                        placeholder={t("voter.minAge")}
                        placeholderTextColor={theme.colors.placeholder}
                        value={minAge}
                        onChangeText={setMinAge}
                        keyboardType="numeric"
                        style={styles.compactAgeInput}
                      />
                      <TextInput
                        mode="outlined"
                        placeholder={t("voter.maxAge")}
                        placeholderTextColor={theme.colors.placeholder}
                        value={maxAge}
                        onChangeText={setMaxAge}
                        keyboardType="numeric"
                        style={styles.compactAgeInput}
                      />
                    </>
                  )}

                  <Chip
                    icon="close"
                    onPress={clearFilters}
                    style={styles.clearChip}
                  >
                    {t("voter.clear")}
                  </Chip>
                </View>
              ) : (
                /* ==================== MOBILE ==================== */
                <>
                  <View style={styles.filterRow}>
                    <Text style={styles.filterSectionLabel}>
                      {t("voter.gender")}
                    </Text>

                    {["All", "Male", "Female"].map((g) => (
                      <Chip
                        key={g}
                        selected={gender === g}
                        onPress={() => {
                          setGender(g as any);
                          setPage(1);
                        }}
                        style={[
                          styles.filterChip,
                          gender === g && styles.filterChipSelected,
                        ]}
                      >
                        {t(`voter.gender${g}`)}
                      </Chip>
                    ))}
                  </View>

                  <View style={[styles.filterRow, { marginTop: 8 }]}>
                    <Text style={styles.filterSectionLabel}>
                      {t("voter.age")}
                    </Text>

                    {[
                      { key: "lt", label: t("voter.ageLt") },
                      { key: "gt", label: t("voter.ageGt") },
                      { key: "between", label: t("voter.ageBetween") },
                    ].map((m) => (
                      <Chip
                        key={m.key}
                        selected={ageMode === m.key}
                        onPress={() => {
                          setAgeMode(m.key as AgeMode);
                          setAgeValue("");
                          setMinAge("");
                          setMaxAge("");
                          setPage(1);
                        }}
                        style={[
                          styles.filterChip,
                          ageMode === m.key && styles.filterChipSelected,
                        ]}
                      >
                        {m.label}
                      </Chip>
                    ))}
                  </View>

                  {(ageMode === "lt" || ageMode === "gt") && (
                    <View style={styles.ageInputRow}>
                      <TextInput
                        mode="outlined"
                        label={t("voter.ageLabel")}
                        value={ageValue}
                        onChangeText={setAgeValue}
                        keyboardType="numeric"
                        style={styles.compactAgeInput}
                        dense
                      />
                    </View>
                  )}

                  {ageMode === "between" && (
                    <View style={styles.ageInputRow}>
                      <TextInput
                        mode="outlined"
                        label={t("voter.minAge")}
                        value={minAge}
                        onChangeText={setMinAge}
                        keyboardType="numeric"
                        style={[styles.compactAgeInput, { flex: 1 }]}
                        dense
                      />
                      <TextInput
                        mode="outlined"
                        label={t("voter.maxAge")}
                        value={maxAge}
                        onChangeText={setMaxAge}
                        keyboardType="numeric"
                        style={[styles.compactAgeInput, { flex: 1 }]}
                        dense
                      />
                    </View>
                  )}

                  <View style={styles.clearRow}>
                    <Chip
                      icon="close"
                      onPress={clearFilters}
                      style={styles.clearChip}
                    >
                      {t("voter.clear")}
                    </Chip>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* ================== LIST + STICKY PAGINATION WRAPPER ================== */}
        <View style={styles.listWrapper}>
          <FlatList
            data={voters}
            key={numColumns}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                onPress={async () => {
                  openVoterDetail(item.id);
                }}
                onHoverIn={() => Platform.OS === "web" && setHoveredId(item.id)}
                onHoverOut={() => Platform.OS === "web" && setHoveredId(null)}
                style={styles.cardPressable}
              >
                <View
                  style={[
                    styles.cardShell,
                    hoveredId === item.id && styles.cardHover,
                  ]}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardText}>
                      <Text variant="titleMedium" style={styles.name}>
                        {item.fullName}
                      </Text>
                      <Text style={styles.meta}>
                        {t("voter.ageAddress", {
                          age: item.age,
                          address: item.address,
                        })}
                      </Text>
                    </View>

                    <View style={styles.genderBadge}>
                      <Text style={styles.genderText}>
                        {t(`voter.gender${item.gender}`)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            )}
          />
        </View>
      </ScrollView>

      {voterCount > 0 && (
        <View style={styles.floatingBar}>
          {/* LEFT: COUNT */}
          <Text style={styles.stickyCountText}>
            {voterCount > 0
              ? `Showing ${startRecord}–${endRecord} of ${voterCount} voters`
              : "No voters found"}
          </Text>

          {/* RIGHT: PAGINATION */}
          <View style={styles.stickyPager}>
            <IconButton
              size={18}
              style={styles.pagerIcon}
              icon="chevron-left"
              disabled={page === 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            />

            <Text style={styles.pageText}>
              Page {page} of {totalPages}
            </Text>

            <IconButton
              size={18}
              style={styles.pagerIcon}
              icon="chevron-right"
              disabled={page === totalPages}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </View>
        </View>
      )}
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const createStyles = (theme: AppTheme, platform: { isWeb: boolean }) =>
  StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: theme.colors.white,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.white,
    },
    loaderText: {
      marginTop: 12,
      color: theme.colors.textSecondary,
    },
    container: {
      padding: 16,
      backgroundColor: theme.colors.white,
      flexGrow: 1,
      paddingBottom: 90,
    },
    heading: {
      fontWeight: "700",
      marginBottom: 4,
      color: theme.colors.primary,
    },
    countRow: {
      marginBottom: 8,
      alignItems: "center",
    },
    countText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: 600,
    },
    searchContainer: {
      backgroundColor: theme.colors.paperBackground,
      borderRadius: 14,
      padding: 2,
      marginBottom: 12,
    },
    search: {
      backgroundColor: theme.colors.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
    },
    filterPanel: {
      backgroundColor: theme.colors.paperBackground,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
    },
    filterHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      height: 35,
    },
    filterTitle: {
      fontWeight: "600",
      color: theme.colors.textTertiary,
    },
    filterDivider: {
      marginVertical: 8,
    },
    filtersContainer: {
      width: "100%",
      paddingVertical: 4,
    },
    filterRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    ageInputRow: {
      width: "100%",
      marginTop: 8,
      flexDirection: "row",
      gap: 8,
    },
    clearRow: {
      marginTop: 12,
      flexDirection: "row",
      justifyContent: "flex-start",
    },
    filterSectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      marginRight: 6,
    },
    verticalDivider: {
      width: 1,
      height: 28,
      backgroundColor: theme.colors.divider,
      marginHorizontal: 6,
    },
    filterChip: {
      backgroundColor: theme.colors.white,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
    },
    filterChipSelected: {
      backgroundColor: theme.colors.softOrange,
      borderColor: theme.colors.primaryLight,
    },
    compactAgeInput: {
      width: platform.isWeb ? 80 : "100%",
      backgroundColor: theme.colors.white,
      height: platform.isWeb ? 32 : 44,
      fontSize: platform.isWeb ? 15 : 14,
    },
    clearChip: {
      backgroundColor: theme.colors.white,
      borderWidth: 1,
      borderColor: theme.colors.borderGray,
      borderRadius: 8,
    },
    row: {
      gap: 16,
    },
    listWrapper: {
      position: "relative",
      minHeight: 450,
    },
    listContent: {
      paddingBottom: 80,
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
    cardPressable: {
      flex: 1,
      marginBottom: 12,
      borderRadius: 12,
      cursor: "pointer",
    },
    cardShell: {
      flex: 1,
      backgroundColor: theme.colors.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primaryLight,
      overflow: "hidden",
    },
    cardHover: {
      backgroundColor: theme.colors.softOrange + "40",
      borderLeftColor: theme.colors.primary,
    },
    cardContent: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardText: {
      flex: 1,
      paddingRight: 8,
    },
    name: {
      fontWeight: "600",
      color: theme.colors.primary,
    },
    meta: {
      marginTop: 4,
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    genderBadge: {
      borderWidth: 1,
      borderColor: theme.colors.softOrange,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    genderText: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.colors.darkOrange,
    },
    pageText: {
      marginHorizontal: 4,
      fontWeight: "500",
      color: theme.colors.primary,
    },
    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.white,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
    },
  });
