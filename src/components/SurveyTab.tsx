import React, { useEffect, useState } from "react";
import { View, StyleSheet, useWindowDimensions, Pressable } from "react-native";
import {
  Text,
  TextInput,
  Chip,
  ActivityIndicator,
  useTheme,
} from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useToast } from "./ToastProvider";
import {
  extractErrorMessage,
  formatForDisplay,
  toUtcIsoDate,
} from "../utils/common";
import {
  getSurveyByVoterId,
  addSurvey,
  getSupportTypes,
  updateSurvey,
} from "../api/voterSurveyApi";
import {
  addVoterDemands,
  deleteVoterDemand,
  getDemandCategories,
  getDemandsByCategory,
  getVoterDemands,
} from "../api/voterDemandApi";
import FormDropdown from "./FormDropdown";
import { VoterDemandItem, VoterSurveyRequest } from "../types/Voter";
import { AppTheme } from "../theme";
import { FixedLabel } from "./FixedLabel";

/* ================= TYPES ================= */

type Props = {
  voterId?: string;
};

const DEFAULT_SURVEY_DATA: VoterSurveyRequest = {
  supportType: 0,
  supportStrength: 0,
  caste: "",
  newAddress: "",
  society: "",
  flatNumber: "",
  email: "",
  secondaryMobileNumber: "",
  dateOfBirth: "",
  demands: [],
  needsFollowUp: false,
  specialVisitDate: "",
  specialVisitRemarks: "",
  voterDied: false,
  remarks: "",
  isVoted: false,
};

const SUPPORT_STRENGTH_OPTIONS = [
  { label: "Unknown", value: 0 },
  { label: "Strong", value: 1 },
  { label: "Moderate", value: 2 },
  { label: "Weak", value: 3 },
];

/* ================= COMPONENT ================= */

export default function SurveyTab({ voterId }: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();
  const { width } = useWindowDimensions();

  const isWide = width >= 1024;

  const [data, setData] = useState<VoterSurveyRequest>();
  const [loading, setLoading] = useState(true);
  const [dobOpen, setDobOpen] = useState(false);
  const [specialVisitOpen, setSpecialVisitOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [supportTypes, setSupportTypes] = useState<any[]>([]);
  const [demandCategories, setDemandCategories] = useState<any[]>([]);
  const [demandsByCategory, setDemandsByCategory] = useState<
    Record<string, any[]>
  >({});
  const [openDemands, setOpenDemands] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadSurvey();
    loadSupportTypes();
    loadDemandCategories();
  }, [voterId]);

  const loadSurvey = async () => {
    try {
      const res = await getSurveyByVoterId(voterId);
      if (res.status === 204) {
        setData(DEFAULT_SURVEY_DATA);
        return;
      }
      const demandRes = await getVoterDemands(voterId);
      setData({ ...DEFAULT_SURVEY_DATA, demands: demandRes.data, ...res.data });
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    } finally {
      setLoading(false);
    }
  };

  const loadSupportTypes = async () => {
    try {
      const res = await getSupportTypes();
      setSupportTypes(res.data ?? []);
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    }
  };

  const loadDemandCategories = async () => {
    try {
      const res = await getDemandCategories();
      setDemandCategories(res.data ?? []);
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    }
  };

  const loadDemands = async (categoryId: string) => {
    if (demandsByCategory[categoryId]) return;
    const res = await getDemandsByCategory(categoryId);
    setDemandsByCategory((p) => ({ ...p, [categoryId]: res.data ?? [] }));
  };

  const update = <K extends keyof VoterSurveyRequest>(
    k: K,
    v: VoterSurveyRequest[K]
  ) => setData((d) => ({ ...d, [k]: v }));

  const updateMobile = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    if (digits.length <= 10) update("secondaryMobileNumber", digits);
  };

  /* ================= DEMANDS ================= */

  const addDemand = () => {
    if ((data.demands?.length ?? 0) >= 5) return;
    const newIndex = data.demands?.length ?? 0;
    update("demands", [...(data.demands ?? []), {}]);
    setOpenDemands((p) => ({ ...p, [newIndex]: true }));
  };

  const updateDemand = (index: number, patch: Partial<VoterDemandItem>) => {
    const list = [...(data.demands ?? [])];
    list[index] = { ...list[index], ...patch };
    update("demands", list);
  };

  const removeDemand = async (index: number) => {
    const list = [...(data.demands ?? [])];
    if (list[index].id) {
      await deleteVoterDemand(list[index].id);
    }
    list.splice(index, 1);
    update("demands", list);
  };

  const getDemandTitle = (d: VoterDemandItem, index: number) => {
    if (!d.demandId || !d.categoryId) {
      return `${t("survey.demand")} ${index + 1}`;
    }

    const demand = demandsByCategory[d.categoryId]?.find(
      (x) => x.id === d.demandId
    );

    return demand?.demandEn || `${t("survey.demand")} ${index + 1}`;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { demands, ...surveyPayload } = data;
      data?.id
        ? await updateSurvey(data.id, { voterId, ...surveyPayload })
        : await addSurvey({ voterId, ...surveyPayload });
      await addVoterDemands(voterId, demands);
      showToast(
        t(data?.id ? "survey.updateSuccess" : "survey.addSuccess"),
        "success"
      );
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setData(DEFAULT_SURVEY_DATA);
    showToast(t("survey.resetDone"), "info");
  };

  if (loading) {
    return (
      <View style={{ padding: 24 }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.grid}>
        {/* BASIC */}
        <GridItem isWide={isWide}>
          <Card title={t("voter.surveyBasic")}>
            <Row label={t("voter.colorCode")}>
              <FormDropdown
                label=""
                value={String(data.supportType ?? 0)}
                options={supportTypes.map((s) => ({
                  label: t(`survey.supportType.${s.label}`, s.label),
                  value: String(s.value),
                  colorCode: s.colorCode,
                }))}
                onSelect={(v) => update("supportType", Number(v))}
                noMargin
                customStyle
              />
            </Row>

            <Row label={t("voter.supportStrength")}>
              <FormDropdown
                label=""
                value={String(data.supportStrength ?? 0)}
                options={SUPPORT_STRENGTH_OPTIONS.map((s) => ({
                  label: t(`survey.supportStrength.${s.label}`, s.label),
                  value: String(s.value),
                }))}
                onSelect={(v) => update("supportStrength", Number(v))}
                noMargin
                customStyle
              />
            </Row>

            <InputRow
              label={t("voter.caste")}
              value={data.caste}
              onChange={(v) => update("caste", v)}
              noDivider
            />
          </Card>
        </GridItem>

        {/* ADDRESS */}
        <GridItem isWide={isWide}>
          <Card title={t("voter.surveyAddress")}>
            <InputRow
              label={t("voter.newAddress")}
              multiline
              value={data.newAddress}
              onChange={(v) => update("newAddress", v)}
            />
            <InputRow
              label={t("voter.society")}
              value={data.society}
              onChange={(v) => update("society", v)}
            />
            <InputRow
              label={t("voter.flatNo")}
              value={data.flatNumber}
              onChange={(v) => update("flatNumber", v)}
              noDivider
            />
          </Card>
        </GridItem>

        {/* CONTACT */}
        <GridItem isWide={isWide}>
          <Card title={t("voter.surveyContact")}>
            <InputRow
              label={t("voter.mobile1")}
              value={data.secondaryMobileNumber}
              onChange={updateMobile}
            />
            <InputRow
              label={t("voter.email")}
              value={data.email}
              onChange={(v) => update("email", v)}
            />

            <Row label={t("voter.dob")} noDivider>
              <Pressable
                onPress={() => setDobOpen(true)}
                style={styles.dateField}
              >
                <Text style={styles.dateText}>
                  {data.dateOfBirth
                    ? formatForDisplay(data.dateOfBirth)
                    : t("voter.selectDate")}
                </Text>

                <Ionicons name="calendar-outline" size={16} />
              </Pressable>
            </Row>

            <DatePickerModal
              locale="en"
              mode="single"
              label={t("voter.selectDate")}
              saveLabel={t("save")}
              visible={dobOpen}
              date={data.dateOfBirth ? new Date(data.dateOfBirth) : new Date()}
              onDismiss={() => setDobOpen(false)}
              onConfirm={({ date }) => {
                setDobOpen(false);
                if (date) {
                  update("dateOfBirth", toUtcIsoDate(date));
                }
              }}
            />
          </Card>
        </GridItem>

        {/* STATUS */}
        <GridItem isWide={isWide}>
          <Card title={t("voter.surveyStatus")}>
            <BooleanRow
              label={t("voter.deceased")}
              value={data.voterDied}
              onChange={(v) => update("voterDied", v)}
            />
            <BooleanRow
              label={t("voter.voted")}
              value={data.isVoted}
              onChange={(v) => update("isVoted", v)}
            />
            <BooleanRow
              label={t("voter.needsFollowUp")}
              value={data.needsFollowUp}
              onChange={(v) => update("needsFollowUp", v)}
              noDivider
            />
          </Card>
        </GridItem>

        {/* ADDITIONAL INFO */}
        <FullGridItem>
          <Card title={t("voter.additionalInfo")}>
            <InputRow
              label={t("voter.remarks")}
              multiline
              value={data.remarks}
              onChange={(v) => update("remarks", v)}
            />

            <Row label={t("voter.specialVisitDate")}>
              <Pressable
                onPress={() => setSpecialVisitOpen(true)}
                style={styles.dateField}
              >
                <Text style={styles.dateText}>
                  {data.specialVisitDate
                    ? formatForDisplay(data.specialVisitDate)
                    : t("voter.selectDate")}
                </Text>
                <Ionicons name="calendar-outline" size={16} />
              </Pressable>
            </Row>

            <InputRow
              label={t("voter.specialVisitRemarks")}
              multiline
              value={data.specialVisitRemarks}
              onChange={(v) => update("specialVisitRemarks", v)}
              noDivider
            />
            <DatePickerModal
              locale="en"
              mode="single"
              visible={specialVisitOpen}
              date={
                data.specialVisitDate
                  ? new Date(data.specialVisitDate)
                  : new Date()
              }
              onDismiss={() => setSpecialVisitOpen(false)}
              onConfirm={({ date }) => {
                setSpecialVisitOpen(false);
                if (date) {
                  update("specialVisitDate", toUtcIsoDate(date));
                }
              }}
            />
          </Card>
        </FullGridItem>

        {/* DEMANDS */}
        <FullGridItem>
          <Card title={t("voter.demands")}>
            {(data.demands ?? []).map((d, i) => {
              const isOpen = openDemands[i];

              return (
                <View key={i} style={styles.demandCard}>
                  {/* HEADER */}
                  <Pressable
                    style={styles.demandHeader}
                    onPress={() =>
                      setOpenDemands((p) => ({ ...p, [i]: !p[i] }))
                    }
                  >
                    <Text style={styles.demandTitle} numberOfLines={1}>
                      {isOpen ? getDemandTitle(d, i) : getDemandTitle(d, i)}
                    </Text>

                    <View style={styles.demandHeaderActions}>
                      <Ionicons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                      />
                      <Pressable onPress={() => removeDemand(i)} hitSlop={10}>
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={theme.colors.error}
                        />
                      </Pressable>
                    </View>
                  </Pressable>

                  {/* BODY */}
                  {isOpen && (
                    <>
                      <View style={styles.demandRow}>
                        <View style={styles.demandCol}>
                          <FixedLabel label={t("survey.demandCategory")} />
                          <FormDropdown
                            placeholder={t("placeholder.selectCategory")}
                            value={String(d.categoryId ?? "")}
                            options={demandCategories.map((c) => ({
                              label: c.nameEn,
                              value: c.id,
                            }))}
                            onSelect={(v) => {
                              updateDemand(i, {
                                categoryId: v,
                                demandId: undefined,
                              });
                              if (v) loadDemands(v);
                            }}
                          />
                        </View>

                        <View style={styles.demandCol}>
                          <FixedLabel label={t("survey.demand")} />
                          <FormDropdown
                            placeholder={t("placeholder.selectDemand")}
                            value={String(d.demandId ?? "")}
                            options={(
                              demandsByCategory[d.categoryId] ?? []
                            ).map((x) => ({
                              label: x.demandEn,
                              value: x.id,
                            }))}
                            onSelect={(v) => updateDemand(i, { demandId: v })}
                            disabled={!d.categoryId}
                          />
                        </View>
                      </View>

                      <TextInput
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        placeholder={t("survey.demandDescription")}
                        placeholderTextColor={theme.colors.placeholder}
                        value={d.description}
                        style={{
                          fontSize: 14,
                          backgroundColor: theme.colors.white,
                        }}
                        onChangeText={(v) =>
                          updateDemand(i, { description: v })
                        }
                      />
                    </>
                  )}
                </View>
              );
            })}

            {(data.demands?.length ?? 0) < 5 && (
              <Pressable onPress={addDemand} style={styles.addDemandBtn}>
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.addDemandText}>
                  {t("survey.addDemand")}
                </Text>
              </Pressable>
            )}
          </Card>
        </FullGridItem>
      </View>

      {/* SAVE BAR */}
      <View style={styles.saveBar}>
        <View style={styles.saveRow}>
          <Pressable onPress={handleReset} style={styles.resetButton}>
            <Ionicons
              name="refresh-outline"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.resetText}>{t("reset")}</Text>
          </Pressable>

          <Pressable onPress={handleSave} style={styles.saveButton}>
            <Ionicons name="save-outline" size={18} color="white" />
            <Text style={styles.saveText}>{t("save")}</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

/* ================= HELPERS ================= */

function GridItem({ isWide, children }: any) {
  return (
    <View
      style={{
        flexBasis: isWide ? "50%" : "100%",
        padding: 8,
        alignSelf: "stretch",
      }}
    >
      {children}
    </View>
  );
}

function FullGridItem({ children }: any) {
  return <View style={{ flexBasis: "100%", padding: 8 }}>{children}</View>;
}

function Card({ title, children }: any) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, children, noDivider }: any) {
  const theme = useTheme<AppTheme>();
  return (
    <View
      style={[
        rowStyles.row,
        noDivider
          ? { borderBottomWidth: 0 }
          : { borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
      ]}
    >
      <Text style={rowStyles.label}>{label}</Text>
      <View style={rowStyles.value}>{children}</View>
    </View>
  );
}

function InputRow({ label, onChange, multiline, noDivider, ...props }: any) {
  const theme = useTheme<AppTheme>();
  return (
    <Row label={label} noDivider={noDivider}>
      <TextInput
        {...props}
        dense
        mode="outlined"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        onChangeText={onChange}
        style={{
          height: multiline ? 72 : 44,
          fontSize: 14,
          backgroundColor: theme.colors.white,
        }}
      />
    </Row>
  );
}

function BooleanRow({ label, value, noDivider, onChange }: any) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  return (
    <Row label={label} noDivider={noDivider}>
      <View style={rowStyles.inlineWrap}>
        {[true, false].map((v) => (
          <Chip
            key={String(v)}
            compact
            selected={value === v}
            onPress={() => onChange(v)}
            style={{
              backgroundColor:
                value === v
                  ? theme.colors.softOrange
                  : theme.colors.paperBackground,
            }}
          >
            {v ? t("yes") : t("no")}
          </Chip>
        ))}
      </View>
    </Row>
  );
}

/* ================= STYLES ================= */

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    width: 170,
    fontSize: 14,
    color: "#888",
  },
  value: { flex: 1 },
  inlineWrap: { flexDirection: "row", gap: 8 },
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "stretch",
      marginHorizontal: -8,
    },

    card: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      backgroundColor: theme.colors.paperBackground,
    },

    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 10,
      color: theme.colors.textTertiary,
    },

    dateField: {
      height: 44,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: 6,
      paddingHorizontal: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.colors.white,
    },

    dateText: {
      fontSize: 14,
    },

    demandCard: {
      marginBottom: 16,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      backgroundColor: theme.colors.white,
    },

    addDemandBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginVertical: 8,
    },

    addDemandText: {
      color: theme.colors.primary,
      fontWeight: "600",
    },

    demandHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    demandHeaderActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    demandTitle: {
      fontSize: 14,
      fontWeight: "600",
    },

    demandRow: {
      flexDirection: "row",
      gap: 12,
      marginVertical: 12,
    },

    demandCol: {
      flex: 1,
    },

    removeDemand: {
      alignSelf: "flex-end",
      marginTop: 6,
    },

    saveBar: {
      marginTop: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
      backgroundColor: theme.colors.white,
    },

    saveRow: {
      flexDirection: "row",
      gap: 12,
    },

    resetButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },

    resetText: {
      color: theme.colors.primary,
      fontWeight: "600",
    },

    saveButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },

    saveText: {
      color: theme.colors.white,
      fontWeight: "600",
    },
  });
