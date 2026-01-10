import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  useWindowDimensions,
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
import { getVoterById, getVoters } from "../api/voterApi";
import { AppTheme } from "../theme";

type AgeMode = "none" | "lt" | "gt" | "between";
type ScreenView = "list" | "detail";

const PAGE_SIZE = 8;

/* ---------------- SCREEN ---------------- */
export default function VotersScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();

  const isWeb = width >= 768;
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
      fetchVoters();
    }, [fetchVoters])
  );

  const totalPages = Math.ceil(voterCount / PAGE_SIZE);

  /* ---------------- FETCH SINGLE VOTER ---------------- */
  const fetchVoter = async (id: string) => {
    try {
      const res = await getVoterById(id);
      setSelectedVoter(res.data);
      setView("detail");
    } catch {}
  };

  const clearFilters = () => {
    setGender("All");
    setAgeMode("none");
    setAgeValue("");
    setMinAge("");
    setMaxAge("");
    setPage(1);
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

  /* ---------------- LOADER ---------------- */
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

  /* ================= DETAIL VIEW ================= */
  if (view === "detail" && selectedVoter) {
    return (
      <VoterDetailView
        voter={selectedVoter}
        onBack={goBackFromDetail}
        onOpenVoter={openVoterDetail}
      />
    );
  }

  /* ================= LIST VIEW ================= */
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleLarge" style={styles.heading}>
        {t("voter.plural")}
      </Text>

      {/* Search */}
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

      {/* Filters */}
      <View style={styles.filterPanel}>
        <Text style={styles.filterTitle}>{t("voter.filters")}</Text>
        <Divider style={styles.filterDivider} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtersRow}>
            <Text style={styles.filterSectionLabel}>{t("voter.gender")}</Text>

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

            <Text style={styles.filterSectionLabel}>{t("voter.age")}</Text>

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
                label={t("voter.ageLabel")}
                value={ageValue}
                onChangeText={setAgeValue}
                keyboardType="numeric"
                style={styles.compactAgeInput}
                dense
              />
            )}

            {ageMode === "between" && (
              <>
                <TextInput
                  mode="outlined"
                  label={t("voter.minAge")}
                  value={minAge}
                  onChangeText={setMinAge}
                  keyboardType="numeric"
                  style={styles.compactAgeInput}
                  dense
                />
                <TextInput
                  mode="outlined"
                  label={t("voter.maxAge")}
                  value={maxAge}
                  onChangeText={setMaxAge}
                  keyboardType="numeric"
                  style={styles.compactAgeInput}
                  dense
                />
              </>
            )}

            <View style={styles.verticalDivider} />
            <Chip icon="close" onPress={clearFilters} style={styles.clearChip}>
              {t("voter.clear")}
            </Chip>
          </View>
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={voters}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        renderItem={({ item }) => (
          <Pressable
            onPress={async () => {
              const res = await getVoterById(item.id);
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
                    {" "}
                    {t(`voter.gender${item.gender}`)}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <IconButton
            icon="chevron-left"
            disabled={page === 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          />
          <Text style={styles.pageText}>
            {t("voter.pageInfo", {
              current: page,
              total: totalPages,
            })}
          </Text>
          <IconButton
            icon="chevron-right"
            disabled={page === totalPages}
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </View>
      )}
    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
    },
    heading: {
      fontWeight: "700",
      marginBottom: 8,
      color: theme.colors.primary,
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
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
    },
    filterTitle: {
      fontWeight: "600",
      color: theme.colors.textTertiary,
    },
    filterDivider: {
      marginVertical: 8,
    },
    filtersRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    filterSectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textSecondary,
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
      width: 80,
      backgroundColor: theme.colors.white,
    },
    clearChip: {
      backgroundColor: theme.colors.white,
      borderWidth: 1,
      borderColor: theme.colors.borderGray,
    },
    row: {
      gap: 16,
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
    pagination: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    pageText: {
      marginHorizontal: 8,
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
