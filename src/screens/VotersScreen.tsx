import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Platform } from "react-native";
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
import VoterCategoryScreen from "./VoterCategoryScreen";
import { AgeGroupStats, ColorCodeStats, Voter } from "../types/Voter";
import { useDebounce } from "../hooks/useDebounce";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import {
  getAgeStats,
  getColorCodes,
  getSurnames,
  getVoterById,
  getVoters,
} from "../api/voterApi";
import FormDropdown from "../components/FormDropdown";
import Subcategory from "../components/SubCategory";
import { VOTER_CATEGORIES } from "../constants/voterCategories";
import { AppTheme } from "../theme";

type AgeMode = "none" | "lt" | "gt" | "between";
type ScreenView = "categories" | "subcategories" | "list" | "detail";
type SubFilterType = "color" | "age" | "surname";

const PAGE_SIZE = 50;

/* ---------------- SCREEN ---------------- */
export default function VotersScreen() {
  const { isWeb } = usePlatformInfo();
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme, { isWeb });

  const numColumns = isWeb ? 2 : 1;

  const [view, setView] = useState<ScreenView>("categories");
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<"All" | "Male" | "Female">("All");

  const [ageMode, setAgeMode] = useState<AgeMode>("none");
  const [ageValue, setAgeValue] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  const [page, setPage] = useState(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const flatListRef = React.useRef<FlatList<Voter>>(null);
  const [pageLoading, setPageLoading] = useState(false);

  const [voters, setVoters] = useState<Voter[]>([]);
  const [voterCount, setVoterCount] = useState(0);
  const [voterStack, setVoterStack] = useState<Voter[]>([]);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchBy, setSearchBy] = useState<"fullname" | "epicid" | "address">(
    "fullname",
  );
  const [selectedSubFilter, setSelectedSubFilter] = useState<{
    type: SubFilterType | null;
    value: string | null;
  }>({ type: null, value: null });

  const [subFilterItems, setSubFilterItems] = useState<any[]>([]);
  const [subFilterLoading, setSubFilterLoading] = useState(false);
  const [subPage, setSubPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [subTotalRecords, setSubTotalRecords] = useState(0);
  const SUB_PAGE_SIZE = 20;
  const subStartRecord =
    subTotalRecords === 0 ? 0 : (subPage - 1) * SUB_PAGE_SIZE + 1;
  const subEndRecord = Math.min(subPage * SUB_PAGE_SIZE, subTotalRecords);

  const SEARCH_OPTIONS = [
    { label: t("name"), value: "fullname" },
    { label: t("voter.labelEpicId"), value: "epicid" },
    { label: t("voter.labelAddress"), value: "address" },
  ];

  const selectedCategoryObj = VOTER_CATEGORIES.find(
    (c) => c.id === selectedCategory,
  );

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
    if (view === "list") {
      try {
        setPageLoading(true);
        let ageParam: string | undefined;

        if (ageMode === "between" && debouncedMinAge && debouncedMaxAge) {
          ageParam = `${debouncedMinAge}-${debouncedMaxAge}`;
        } else if (
          (ageMode === "lt" || ageMode === "gt") &&
          debouncedAgeValue
        ) {
          ageParam = `${ageMode === "lt" ? "<" : ">"}${debouncedAgeValue}`;
        }

        const res = await getVoters(
          page,
          PAGE_SIZE,
          debouncedSearch ?? "",
          ageParam
            ? ageParam
            : selectedSubFilter.type === "age"
              ? (selectedSubFilter.value ?? undefined)
              : undefined,
          gender === "All" ? undefined : gender,
          searchBy,
          selectedCategory,
          selectedSubFilter.type === "color"
            ? (selectedSubFilter.value ?? undefined)
            : undefined,
          selectedSubFilter.type === "surname"
            ? (selectedSubFilter.value ?? undefined)
            : undefined,
        );

        setVoterCount(res?.data?.totalRecords ?? 0);
        setVoters(res?.data?.data ?? []);
      } catch {
      } finally {
        setPageLoading(false);
      }
    }
  }, [
    page,
    debouncedSearch,
    debouncedAgeValue,
    debouncedMinAge,
    debouncedMaxAge,
    gender,
    searchBy,
    selectedCategory,
    selectedSubFilter.value,
  ]);

  const fetchSubFilters = async (type: SubFilterType) => {
    setSubFilterLoading(true);
    try {
      let data: any[] = [];

      if (type === "color") {
        const res = await getColorCodes();
        const stats: ColorCodeStats = res.data;

        data = Object.entries(stats).map(([key, value]) => ({
          label: t(`dashboard.voter.support.${key}`),
          value: value.color,
          color: value.color,
          count: value.count,
          metaKey: key,
        }));
      }

      if (type === "age") {
        const res = await getAgeStats();
        const stats: AgeGroupStats = res.data;

        data = [
          {
            label: "18 – 25",
            value: "18-25",
            count: stats.age18To25,
            icon: "calendar-range",
          },
          {
            label: "26 – 35",
            value: "26-35",
            count: stats.age26To35,
            icon: "calendar-range",
          },
          {
            label: "36 – 45",
            value: "36-45",
            count: stats.age36To45,
            icon: "calendar-range",
          },
          {
            label: "46 – 60",
            value: "46-60",
            count: stats.age46To60,
            icon: "calendar-range",
          },
          {
            label: "60+",
            value: ">60",
            count: stats.age60Plus,
            icon: "calendar-range",
          },
        ];
      }

      if (type === "surname") {
        const res = await getSurnames(subPage, SUB_PAGE_SIZE);
        const result = res.data;

        setSubTotalPages(result.totalPages);
        setSubTotalRecords(result.totalRecords);

        data = result.data.map((s) => ({
          label: s.surname,
          value: s.surname,
          count: s.count,
          icon: "account",
        }));
      }

      setSubFilterItems(data);
    } finally {
      setSubFilterLoading(false);
    }
  };

  useEffect(() => {
    if (view === "subcategories" && selectedSubFilter.type) {
      fetchSubFilters(selectedSubFilter.type);
    }
  }, [view, selectedSubFilter.type, subPage]);

  useEffect(() => {
    if (view === "list") {
      fetchVoters();
    }
  }, [view, fetchVoters]);

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [page]);

  /* ---------------- FOCUS EFFECT ---------------- */
  useFocusEffect(
    useCallback(() => {
      setVoterStack([]);
      setSelectedVoter(null);
      if (selectedCategory === null) {
        setView("categories");
      }
    }, [fetchVoters]),
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
        selectedVoter ? [...prev, selectedVoter] : prev,
      );

      setSelectedVoter(voter);
      setView("detail");
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setPage(1);

    if (categoryId === 9) {
      setSelectedSubFilter({ type: "color", value: null });
      setView("subcategories");
      return;
    }

    if (categoryId === 10) {
      setSelectedSubFilter({ type: "age", value: null });
      setView("subcategories");
      return;
    }

    if (categoryId === 8) {
      setSelectedSubFilter({ type: "surname", value: null });
      setSubPage(1);
      setView("subcategories");
      return;
    }

    setView("list");
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

  if (view === "categories") {
    return <VoterCategoryScreen onSelectCategory={handleCategorySelect} />;
  }

  if (view === "subcategories" && selectedSubFilter.type) {
    const titleMap = {
      color: "Select Color Code",
      age: "Select Age Group",
      surname: "Select Surname",
    };

    return (
      <Subcategory
        title={titleMap[selectedSubFilter.type]}
        items={subFilterItems}
        loading={subFilterLoading}
        type={selectedSubFilter.type}
        page={subPage}
        totalPages={subTotalPages}
        totalRecords={subTotalRecords}
        onPageChange={setSubPage}
        startRecord={subStartRecord}
        endRecord={subEndRecord}
        onBack={() => {
          setSelectedSubFilter({ type: null, value: null });
          setView("categories");
        }}
        onSelect={(value) => {
          setSelectedSubFilter((prev) => ({ ...prev, value }));
          setView("list");
        }}
      />
    );
  }

  return (
    <View style={styles.screenContainer}>
      <View style={{ position: "relative", flex: 1 }}>
        {pageLoading && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(255,255,255,0.6)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={voters}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          contentContainerStyle={styles.container}
          style={{ flex: 1 }}
          ListHeaderComponent={
            <>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <IconButton
                  icon="arrow-left"
                  iconColor={theme.colors.primary}
                  onPress={() => {
                    if (selectedSubFilter.type && selectedSubFilter.value) {
                      setSelectedSubFilter((prev) => ({
                        ...prev,
                        value: null,
                      }));
                      setSubPage(1);
                      setView("subcategories");
                      return;
                    }

                    setSelectedCategory(null);
                    setView("categories");
                  }}
                />
                <Text variant="titleLarge" style={styles.heading}>
                  {selectedCategoryObj
                    ? t(selectedCategoryObj.title)
                    : t("voter.plural")}
                </Text>
              </View>

              <View style={styles.searchContainer}>
                <View style={styles.mergedSearchWrapper}>
                  <TextInput
                    mode="outlined"
                    placeholder={t("voter.searchPlaceholder")}
                    value={search}
                    onChangeText={(text) => {
                      setSearch(text);
                      setPage(1);
                    }}
                    style={styles.mergedSearchInput}
                    contentStyle={{ paddingRight: 140 }}
                  />

                  <View style={styles.dropdownInsideInput}>
                    <FormDropdown
                      value={searchBy}
                      options={SEARCH_OPTIONS}
                      onSelect={(val) => setSearchBy(val as any)}
                      noMargin
                      customOutline
                      showSearch={false}
                      showClearIcon={false}
                    />
                  </View>
                </View>
              </View>

              {/* COLLAPSIBLE FILTER PANEL */}
              {/* <View style={styles.filterPanel}>
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
                      <View style={styles.filterRow}>
                        <Text style={styles.filterSectionLabel}>
                          {t("voter.gender")}
                        </Text>

                        {["All", "Male", "Female"].map((g) => (
                          <Chip
                            key={g}
                            selected={gender === g}
                            showSelectedCheck={false}
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
                            showSelectedCheck={false}
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
                      <>
                        <View style={styles.filterRow}>
                          <Text style={styles.filterSectionLabel}>
                            {t("voter.gender")}
                          </Text>

                          {["All", "Male", "Female"].map((g) => (
                            <Chip
                              key={g}
                              selected={gender === g}
                              showSelectedCheck={false}
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
                              showSelectedCheck={false}
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
              </View> */}
            </>
          }
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

      {voterCount > 0 && (
        <View style={styles.floatingBar}>
          <Text style={styles.stickyCountText}>
            {voterCount > 0
              ? `Showing ${startRecord}–${endRecord} of ${voterCount} voters`
              : "No voters found"}
          </Text>

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
    mergedSearchWrapper: {
      width: "100%",
      position: "relative",
    },
    mergedSearchInput: {
      backgroundColor: theme.colors.white,
      borderRadius: 12,
    },
    dropdownInsideInput: {
      position: "absolute",
      right: 8,
      top: 6,
      width: 130,
      height: 36,
    },
  });
