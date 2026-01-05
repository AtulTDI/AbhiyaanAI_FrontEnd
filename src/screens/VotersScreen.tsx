import React, { useEffect, useMemo, useState } from "react";
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
import VoterDetailView from "../components/VoterDetailView";
import { Voter } from "../types/Voter";
import { useDebounce } from "../hooks/useDebounce";
import { getVoterById, getVoters } from "../api/voterApi";
import { AppTheme } from "../theme";
import { getGender } from "../utils/common";

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
  const [view, setView] = useState<ScreenView>("list");
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
  const [voterCount, setVoterCount] = useState<number>(0);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchVoters();
  }, [debouncedSearch, gender, ageMode, ageValue, minAge, maxAge, page]);

  const totalPages = Math.ceil(voterCount / PAGE_SIZE);

  const fetchVoters = async () => {
    try {
      const response = await getVoters(page, 8, search ?? "");
      setVoterCount(response?.data?.totalRecords);
      setVoters(response?.data?.data);
    } catch (err) {}
  };

  const fetchVoter = async (id) => {
    try {
      const response = await getVoterById(id);
      setSelectedVoter(response.data);
      setView("detail");
    } catch (err) {}
  };

  const clearFilters = () => {
    setGender("All");
    setAgeMode("none");
    setAgeValue("");
    setMinAge("");
    setMaxAge("");
    setPage(1);
  };

  /* ---------------- LOADER ---------------- */
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loaderText}>Loading voters…</Text>
      </View>
    );
  }

  /* ================= DETAIL VIEW ================= */
  if (view === "detail" && selectedVoter) {
    return (
      <VoterDetailView
        voter={selectedVoter}
        onBack={() => {
          setSelectedVoter(null);
          setView("list");
        }}
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
          placeholder="Search voter"
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
        <Text style={styles.filterTitle}>Filters</Text>
        <Divider style={styles.filterDivider} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtersRow}>
            <Text style={styles.filterSectionLabel}>Gender</Text>
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
                {g}
              </Chip>
            ))}

            <View style={styles.verticalDivider} />

            <Text style={styles.filterSectionLabel}>Age</Text>
            {[
              { key: "lt", label: "<" },
              { key: "gt", label: ">" },
              { key: "between", label: "Between" },
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
                label="Age"
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
                  label="Min"
                  value={minAge}
                  onChangeText={setMinAge}
                  keyboardType="numeric"
                  style={styles.compactAgeInput}
                  dense
                />
                <TextInput
                  mode="outlined"
                  label="Max"
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
              Clear
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
        scrollEnabled={true}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              fetchVoter(item.id);
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
                    Age {item.age} • {item.address}
                  </Text>
                </View>

                <View style={styles.genderBadge}>
                  <Text style={styles.genderText}>
                    {getGender(item.gender)}
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
            Page {page} of {totalPages}
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

    /* Detail */
    detailCard: {
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      backgroundColor: theme.colors.white,
    },
    detailName: {
      fontWeight: "700",
      color: theme.colors.primary,
    },
    detailRow: {
      marginTop: 8,
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
  });
