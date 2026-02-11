import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
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
import { useInternalBackHandler } from "../hooks/useInternalBackHandler";
import { Buffer } from "buffer";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import VoterDetailView from "../components/VoterDetailView";
import VoterCategoryScreen from "./VoterCategoryScreen";
import { AgeGroupStats, ColorCodeStats, Voter } from "../types/Voter";
import { useDebounce } from "../hooks/useDebounce";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import {
  getAgeStats,
  getBoothStats,
  getCasteStats,
  getColorCodes,
  getGenderStats,
  getSurnames,
  getVoterById,
  getVoters,
  getVotersByCategory,
} from "../api/voterApi";
import FormDropdown from "../components/FormDropdown";
import Subcategory from "../components/SubCategory";
import { useToast } from "../components/ToastProvider";
import { VOTER_CATEGORIES } from "../constants/voterCategories";
import { setEpicScanHandler } from "../utils/epicScannerListener";
import { exportVotersPdf } from "../api/exportVotersApi";
import { AppTheme } from "../theme";

type AgeMode = "none" | "lt" | "gt" | "between";
type ScreenView = "categories" | "subcategories" | "list" | "detail";
type SubFilterType = "color" | "age" | "gender" | "caste" | "surname" | "booth";

const PAGE_SIZE = 50;

/* ---------------- SCREEN ---------------- */
export default function VotersScreen() {
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const { t, i18n } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { showToast } = useToast();
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
  const [footerVertical, setFooterVertical] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const SUB_PAGE_SIZE = 20;
  const subStartRecord =
    subTotalRecords === 0 ? 0 : (subPage - 1) * SUB_PAGE_SIZE + 1;
  const subEndRecord = Math.min(subPage * SUB_PAGE_SIZE, subTotalRecords);
  const isFocused = useIsFocused();
  const wasFocused = React.useRef(true);
  const skipResetRef = React.useRef(false);

  const SEARCH_OPTIONS = [
    { label: t("name"), value: "fullname" },
    { label: t("voter.labelEpicId"), value: "epicid" },
    { label: t("voter.labelAddress"), value: "address" },
  ];

  const selectedCategoryObj = VOTER_CATEGORIES.find(
    (c) => c.id === selectedCategory,
  );
  const canHandleInternalBack =
    view === "detail" || view === "list" || view === "subcategories";

  const handleInternalBack = () => {
    if (transitionLoading || loading) return;

    if (view === "detail") {
      goBackFromDetail();
      return;
    }

    if (view === "list") {
      if (selectedSubFilter.type && selectedSubFilter.value) {
        setSelectedSubFilter((prev) => ({ ...prev, value: null }));
        setSubPage(1);
        setView("subcategories");
        return;
      }

      setSelectedCategory(null);
      clearFilters();
      setView("categories");
      return;
    }

    if (view === "subcategories") {
      setSelectedSubFilter({ type: null, value: null });
      setSubFilterItems([]);
      setView("categories");
      return;
    }
  };

  useInternalBackHandler(canHandleInternalBack, handleInternalBack);

  /* ---------------- DEBOUNCED VALUES ---------------- */
  const debouncedSearch = useDebounce(search, 500);
  const debouncedAgeValue = useDebounce(ageValue, 500);
  const debouncedMinAge = useDebounce(minAge, 500);
  const debouncedMaxAge = useDebounce(maxAge, 500);
  const navigation = useNavigation<any>();

  const delay = (ms: number): Promise<void> =>
    new Promise<void>((resolve) => {
      setTimeout(() => resolve(), ms);
    });

  /* ---------------- INITIAL LOADER ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setEpicScanHandler((epicId: string) => {
      setSearchBy("epicid");
      setSearch(epicId);
      setPage(1);
      setView("list");
    });
  }, []);

  useEffect(() => {
    if (isFocused && !wasFocused.current) {
      if (skipResetRef.current) {
        skipResetRef.current = false;
      } else {
        setView("categories");
        setSelectedCategory(null);
        setSelectedSubFilter({ type: null, value: null });
        setSelectedVoter(null);
        setVoterStack([]);

        setSearch("");
        setGender("All");
        setAgeMode("none");
        setAgeValue("");
        setMinAge("");
        setMaxAge("");
        setShowFilters(false);

        setPage(1);
        setSubPage(1);
      }
    }

    wasFocused.current = isFocused;
  }, [isFocused]);

  /* ---------------- FETCH VOTERS ---------------- */
  const fetchVoters = useCallback(async () => {
    let res;

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

        if (selectedCategory === 15) {
          res = await getVoters(
            page,
            PAGE_SIZE,
            debouncedSearch ?? "",
            ageParam,
            gender === "All" ? undefined : gender,
            searchBy,
          );
        } else {
          res = await getVotersByCategory(
            page,
            PAGE_SIZE,
            debouncedSearch ?? "",
            selectedSubFilter.type === "age"
              ? (selectedSubFilter.value ?? undefined)
              : undefined,
            selectedSubFilter.type === "gender"
              ? (selectedSubFilter.value ?? undefined)
              : undefined,
            searchBy,
            selectedCategory,
            selectedSubFilter.type === "color"
              ? (selectedSubFilter.value ?? undefined)
              : undefined,
            selectedSubFilter.type === "surname"
              ? (selectedSubFilter.value ?? undefined)
              : undefined,
            selectedSubFilter.type === "caste"
              ? (selectedSubFilter.value ?? undefined)
              : undefined,
            selectedSubFilter.type === "booth"
              ? (selectedSubFilter.value ?? undefined)
              : undefined,
          );
        }

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

      if (type === "gender") {
        const res = await getGenderStats();
        const result = res.data;

        data = Object.entries(result).map(([key, count]) => ({
          label: t(`dashboard.voter.${key}`),
          value: key,
          count: count as number,
          icon:
            key === "male"
              ? "gender-male"
              : key === "female"
                ? "gender-female"
                : "gender-transgender",
        }));
      }

      if (type === "caste") {
        const res = await getCasteStats();
        const result = res.data;

        data = result.map((item: any) => ({
          label: t(`survey.castes.${item.casteNameEn}`),
          value: item.casteId,
          count: item.count,
          icon: "account-group",
        }));
      }

      if (type === "booth") {
        const res = await getBoothStats();
        const result = res.data;

        data = result.map((item: any) => ({
          label: item.listArea,
          value: item.listArea,
          description: item.address,
          count: item.count,
          icon: "map-marker",
        }));
      }

      if (type === "age") {
        const res = await getAgeStats();
        const stats: AgeGroupStats = res.data;

        data = [
          {
            label: t("dashboard.voter.ageGroups.18_25"),
            value: "18-25",
            count: stats.age18To25,
            icon: "calendar-range",
          },
          {
            label: t("dashboard.voter.ageGroups.26_35"),
            value: "26-35",
            count: stats.age26To35,
            icon: "calendar-range",
          },
          {
            label: t("dashboard.voter.ageGroups.36_45"),
            value: "36-45",
            count: stats.age36To45,
            icon: "calendar-range",
          },
          {
            label: t("dashboard.voter.ageGroups.46_60"),
            value: "46-60",
            count: stats.age46To60,
            icon: "calendar-range",
          },
          {
            label: t("dashboard.voter.ageGroups.60_plus"),
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
  }, [view, selectedSubFilter.type, subPage, i18n.language]);

  useEffect(() => {
    if (view === "list") {
      fetchVoters();
    }
  }, [view, fetchVoters]);

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [page]);

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

    if (categoryId === 11) {
      setSelectedSubFilter({ type: "gender", value: null });
      setView("subcategories");
      return;
    }

    if (categoryId === 12) {
      setSelectedSubFilter({ type: "caste", value: null });
      setView("subcategories");
      return;
    }

    if (categoryId === 13) {
      setSelectedSubFilter({ type: "booth", value: null });
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
      color: t("voter.selectColorCode"),
      age: t("voter.selectAgeGroup"),
      surname: t("voter.selectSurname"),
      gender: t("voter.selectGender"),
      caste: t("voter.selectCaste"),
      booth: t("voter.selectBooth"),
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
          setSubFilterItems([]);
          setView("categories");
        }}
        onSelect={(value) => {
          setSelectedSubFilter((prev) => ({ ...prev, value }));
          setView("list");
        }}
      />
    );
  }

  const downloadPdf = async (fileData: any, fileName: string) => {
    try {
      if (isWeb && !isMobileWeb) {
        const blob = new Blob([fileData], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      }

      const fileUri = FileSystem.cacheDirectory + fileName;

      let base64: string;
      if (typeof fileData === "string") {
        base64 = fileData;
      } else {
        base64 = Buffer.from(fileData).toString("base64");
      }

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: "application/pdf",
        dialogTitle: "Open voter list",
      });
    } catch (err) {
      console.error("PDF download/open failed", err);
      showToast(t("voter.downloadFailed"), "error");
    }
  };

  const formatPart = (text?: string | number | null) => {
    if (!text) return null;

    const cleaned = text
      .toString()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^\w]/g, "");

    if (!cleaned) return null;

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  const resolveColorName = () => {
    if (selectedSubFilter.type !== "color" || !selectedSubFilter.value)
      return null;

    const item = subFilterItems.find(
      (i) => i.value === selectedSubFilter.value,
    );

    if (!item) return null;

    if (item.label) return formatPart(item.label);

    if (item.metaKey) return formatPart(item.metaKey);

    return null;
  };

  const generateFileName = () => {
    const isLikelyId = (val: string) => /^[0-9a-fA-F-]{8,}$/.test(val);

    const categoryNameMap: Record<number, string> = {
      0: "All_Voters",
      1: "Star_Voters",
      2: "Verified_Voters",
      3: "Unverified_Voters",
      4: "Deceased_Voters",
      5: "Voted_Voters",
      6: "Not_Voted_Voters",
      7: "Needs_Followup_Voters",
      8: "Voters_By_Support_Color",
      9: "Voters_By_Caste",
      10: "Voters_By_Age",
      11: "Voters_By_Gender",
      12: "Voters_By_Booth",
      13: "Voters_By_Surname",
    };

    const val = selectedSubFilter.value?.toString();

    if (selectedSubFilter.type === "surname" && val) {
      const part = formatPart(val);
      if (part) return `Voters_Surname_${part}.pdf`;
    }

    if (selectedSubFilter.type === "age" && val) {
      const part = formatPart(val);
      if (part) return `Voters_Age_${part}.pdf`;
    }

    if (selectedSubFilter.type === "gender" && val) {
      const part = formatPart(val);
      if (part) return `Voters_Gender_${part}.pdf`;
    }

    if (selectedSubFilter.type === "color") {
      const colorName = resolveColorName();
      if (colorName) return `Voters_Support_${colorName}.pdf`;
    }

    if (selectedSubFilter.type === "caste" && val && !isLikelyId(val)) {
      const part = formatPart(val);
      if (part) return `Voters_Caste_${part}.pdf`;
    }

    if (selectedSubFilter.type === "booth" && val) {
      const part = formatPart(val);
      if (part) return `Voters_Booth_${part}.pdf`;
    }

    if (selectedCategory === 15) {
      if (ageMode === "between" && minAge && maxAge) {
        return `Voters_Age_${minAge}_${maxAge}.pdf`;
      }

      if ((ageMode === "lt" || ageMode === "gt") && ageValue) {
        return `Voters_Age_${ageMode === "lt" ? "Below" : "Above"}_${ageValue}.pdf`;
      }

      if (gender !== "All") {
        const part = formatPart(gender);
        if (part) return `Voters_Gender_${part}.pdf`;
      }
    }

    if (selectedCategory && categoryNameMap[selectedCategory]) {
      return `${categoryNameMap[selectedCategory]}.pdf`;
    }

    return "Voters_List.pdf";
  };

  const handleDownloadVoters = async () => {
    try {
      setDownloading(true);

      let ageParam: string | undefined;

      if (ageMode === "between" && debouncedMinAge && debouncedMaxAge) {
        ageParam = `${debouncedMinAge}-${debouncedMaxAge}`;
      } else if ((ageMode === "lt" || ageMode === "gt") && debouncedAgeValue) {
        ageParam = `${ageMode === "lt" ? "<" : ">"}${debouncedAgeValue}`;
      }

      const response = await exportVotersPdf(
        selectedCategory ?? 0,
        selectedSubFilter.type === "surname"
          ? (selectedSubFilter.value ?? undefined)
          : undefined,
        selectedSubFilter.type === "color"
          ? (selectedSubFilter.value ?? undefined)
          : undefined,
        selectedSubFilter.type === "age"
          ? (selectedSubFilter.value ?? undefined)
          : ageParam,
        selectedSubFilter.type === "gender"
          ? (selectedSubFilter.value ?? undefined)
          : gender !== "All"
            ? gender
            : undefined,
        selectedSubFilter.type === "caste"
          ? (selectedSubFilter.value ?? undefined)
          : undefined,
        selectedSubFilter.type === "booth"
          ? (selectedSubFilter.value ?? undefined)
          : undefined,
      );

      const fileName = generateFileName();

      await downloadPdf(response.data, fileName);
      showToast(t("voter.downloadSuccess"), "success");
    } catch (err) {
      console.error("PDF export failed", err);
      showToast(t("voter.downloadFailed"), "error");
    } finally {
      setDownloading(false);
    }
  };

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
              <View style={styles.headerRow}>
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
                      clearFilters();
                      setView("categories");
                    }}
                  />
                  <Text variant="titleLarge" style={styles.heading}>
                    {selectedCategoryObj
                      ? t(selectedCategoryObj.title)
                      : t("voter.plural")}
                  </Text>
                </View>

                {/* ⬇️ DOWNLOAD BUTTON */}
                {selectedCategory !== 15 && (
                  <IconButton
                    icon={downloading ? "progress-clock" : "download"}
                    iconColor={theme.colors.primary}
                    size={22}
                    style={styles.iconBackground}
                    disabled={downloading}
                    onPress={handleDownloadVoters}
                  />
                )}
              </View>

              <View style={styles.searchContainer}>
                <View style={styles.mergedSearchWrapper}>
                  <TextInput
                    mode="outlined"
                    placeholder={t("voter.searchPlaceholder")}
                    placeholderTextColor={theme.colors.placeholder}
                    value={search}
                    onChangeText={(text) => {
                      setSearch(text);
                      setPage(1);
                    }}
                    style={styles.mergedSearchInput}
                    contentStyle={{ paddingRight: 180 }}
                  />

                  {/* 🔳 QR SCAN BUTTON */}
                  {(!isWeb || isMobileWeb) && (
                    <IconButton
                      icon="qrcode-scan"
                      size={22}
                      style={{ position: "absolute", right: 140, top: 6 }}
                      iconColor={theme.colors.primary}
                      onPress={() => {
                        skipResetRef.current = true;
                        navigation.navigate("EpicScanner");
                      }}
                    />
                  )}

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
              {selectedCategory === 15 && (
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
                                  ageMode === m.key &&
                                    styles.filterChipSelected,
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
              )}
            </>
          }
          ListEmptyComponent={
            !pageLoading ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="info-outline"
                  size={36}
                  color={theme.colors.borderGray}
                  style={{ marginBottom: 8 }}
                />
                <Text style={styles.emptyText}>{t("voter.noData")}</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={async () => {
                openVoterDetail(item.id);
              }}
              onHoverIn={() => isWeb && !isMobileWeb && setHoveredId(item.id)}
              onHoverOut={() => isWeb && !isMobileWeb && setHoveredId(null)}
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
        <View
          style={[
            styles.floatingBar,
            footerVertical && styles.floatingBarVertical,
          ]}
        >
          <Text
            style={styles.stickyCountText}
            numberOfLines={1}
            ellipsizeMode="clip"
            onLayout={(e) => {
              const textWidth = e.nativeEvent.layout.width;
              if (textWidth > 180 && !footerVertical) setFooterVertical(true);
              if (textWidth <= 180 && footerVertical) setFooterVertical(false);
            }}
          >
            {t("voter.showingRecords", {
              start: startRecord,
              end: endRecord,
              total: voterCount,
            })}
          </Text>

          <View
            style={[
              styles.stickyPager,
              footerVertical && styles.stickyPagerVertical,
            ]}
          >
            <IconButton
              size={18}
              icon="chevron-left"
              disabled={page === 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              style={{ margin: 0 }}
              contentStyle={{ margin: 0 }}
            />

            <Text style={styles.pageText}>
              {t("voter.pageInfo", { current: page, total: totalPages })}
            </Text>

            <IconButton
              size={18}
              icon="chevron-right"
              disabled={page === totalPages}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ margin: 0 }}
              contentStyle={{ margin: 0 }}
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
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    iconBackground: {
      backgroundColor: theme.colors.primary + "25",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.primary + "40",
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
    floatingBarVertical: {
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
    },
    stickyPagerVertical: {
      justifyContent: "center",
    },
    stickyPager: {
      flexDirection: "row",
      alignItems: "center",
      gap: 0,
    },
    pagerIcon: {
      margin: 0,
      padding: 0,
    },
    stickyCountText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginRight: 6,
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
      marginHorizontal: 2,
      fontWeight: "500",
      color: theme.colors.primary,
      fontSize: 13,
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
