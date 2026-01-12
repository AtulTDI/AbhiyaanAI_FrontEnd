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
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useToast } from "./ToastProvider";
import { extractErrorMessage } from "../utils/common";
import {
  getSurveyByVoterId,
  addSurvey,
  getSupportTypes,
} from "../api/voterSurveyApi";
import { AppTheme } from "../theme";
import FormDropdown from "./FormDropdown";

/* ================= TYPES ================= */

type SurveyData = {
  supportType?: number;
  caste?: string;
  // post?: string;
  // activist?: string;
  newAddress?: string;
  society?: string;
  flatNo?: string;
  email?: string;
  mobile1?: string;
  dateOfBirth?: string;
  demands?: string;
  additionalInfo?: string;
  additionalVerification?: boolean;
  voterDied?: boolean;
  remarks?: boolean;
  // starVoter?: boolean;
  voted?: boolean;
};

type Props = {
  voterId?: string;
};

const DEFAULT_SURVEY_DATA: SurveyData = {
  supportType: 0,
  caste: "",
  // post: "",
  // activist: "",
  newAddress: "",
  society: "",
  flatNo: "",
  email: "",
  mobile1: "",
  dateOfBirth: "",
  demands: "",
  additionalInfo: "",
  additionalVerification: false,
  voterDied: false,
  remarks: false,
  // starVoter: false,
  voted: false,
};

/* ================= COMPONENT ================= */

export default function SurveyTab({ voterId }: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();
  const { width } = useWindowDimensions();

  const isWide = width >= 1024;

  const [data, setData] = useState<SurveyData>({});
  const [loading, setLoading] = useState(true);
  const [dobOpen, setDobOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supportTypes, setSupportTypes] = useState<any[]>([]);

  useEffect(() => {
    loadSurvey();
    getSupportTypesList();
  }, [voterId]);

  const loadSurvey = async () => {
    try {
      const response = await getSurveyByVoterId(voterId);
      if (response.status === 204) {
        setData(DEFAULT_SURVEY_DATA);
        return;
      }
      setData(response.data);
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    } finally {
      setLoading(false);
    }
  };

  const getSupportTypesList = async () => {
    try {
      const response = await getSupportTypes();
      setSupportTypes(response.data ?? []);
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    }
  };

  const update = <K extends keyof SurveyData>(k: K, v: SurveyData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const updateMobile = (key: "mobile1", value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    if (digits.length <= 10) update(key, digits);
  };

  const handleSave = async () => {
    if (!voterId) return;

    try {
      setSaving(true);
      await addSurvey({ voterId, ...data });
      showToast(t("survey.addSuccess"), "success");
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
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("voter.surveyBasic")}</Text>
            <Row label={t("voter.colorCode")}>
              <FormDropdown
                label=""
                value={String(data.supportType ?? 0)}
                options={(supportTypes ?? []).map((s) => ({
                  label: t(`survey.supportType.${s.label}`, s.label),
                  value: String(s.value),
                  colorCode: s.colorCode,
                }))}
                onSelect={(val) => update("supportType", Number(val))}
                noMargin
                customStyle
              />
            </Row>

            <InputRow
              label={t("voter.caste")}
              value={data.caste}
              onChange={(v) => update("caste", v)}
            />
            {/* <InputRow
              label={t("voter.post")}
              value={data.post}
              onChange={(v) => update("post", v)}
            />
            <InputRow
              label={t("voter.activist")}
              value={data.activist}
              onChange={(v) => update("activist", v)}
              noDivider
            /> */}
          </View>
        </GridItem>

        {/* ADDRESS */}
        <GridItem isWide={isWide}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("voter.surveyAddress")}</Text>

            <InputRow
              label={t("voter.newAddress")}
              value={data.newAddress}
              multiline
              onChange={(v) => update("newAddress", v)}
            />
            <InputRow
              label={t("voter.society")}
              value={data.society}
              onChange={(v) => update("society", v)}
            />
            <InputRow
              label={t("voter.flatNo")}
              value={data.flatNo}
              onChange={(v) => update("flatNo", v)}
              noDivider
            />
          </View>
        </GridItem>

        {/* CONTACT */}
        <GridItem isWide={isWide}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("voter.surveyContact")}</Text>

            <InputRow
              label={t("voter.mobile1")}
              value={data.mobile1}
              keyboardType="phone-pad"
              onChange={(v) => updateMobile("mobile1", v)}
            />
            <InputRow
              label={t("voter.email")}
              value={data.email}
              keyboardType="email-address"
              onChange={(v) => update("email", v)}
            />

            <Row label={t("voter.dob")} noDivider>
              <Pressable
                onPress={() => setDobOpen(true)}
                style={styles.dateField}
              >
                <Text style={styles.dateText}>
                  {data.dateOfBirth || t("voter.selectDate")}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </Row>

            <DatePickerModal
              locale="en"
              mode="single"
              visible={dobOpen}
              date={data.dateOfBirth ? new Date(data.dateOfBirth) : new Date()}
              onDismiss={() => setDobOpen(false)}
              onConfirm={({ date }) => {
                setDobOpen(false);
                if (date) update("dateOfBirth", format(date, "yyyy-MM-dd"));
              }}
              validRange={{ endDate: new Date() }}
            />
          </View>
        </GridItem>

        {/* ADDITIONAL */}
        <GridItem isWide={isWide}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("voter.additionalInfo")}</Text>

            <InputRow
              label={t("voter.demands")}
              value={data.demands}
              multiline
              onChange={(v) => update("demands", v)}
            />
            <InputRow
              label={t("voter.additionalInfo")}
              value={data.remarks}
              multiline
              onChange={(v) => update("remarks", v)}
            />
            <BooleanRow
              label={t("voter.additionalVerification")}
              value={data.additionalVerification}
              onChange={(v) => update("additionalVerification", v)}
              noDivider
            />
          </View>
        </GridItem>

        {/* STATUS */}
        <GridItem isWide={isWide}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("voter.surveyStatus")}</Text>

            <BooleanRow
              label={t("voter.deceased")}
              value={data.voterDied}
              onChange={(v) => update("voterDied", v)}
            />
            <BooleanRow
              label={t("voter.voted")}
              value={data.voted}
              onChange={(v) => update("voted", v)}
            />

            {/* <Row label={t("voter.starVoter")} noDivider>
              <Ionicons
                name={data.starVoter ? "star" : "star-outline"}
                size={20}
                color={theme.colors.primary}
                onPress={() => update("starVoter", !data.starVoter)}
              />
            </Row> */}
          </View>
        </GridItem>
      </View>

      {/* SAVE / RESET BAR */}
      <View style={styles.saveBar}>
        <View style={styles.saveRow}>
          <Pressable
            onPress={handleReset}
            disabled={saving}
            style={styles.resetButton}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.resetText}>{t("reset")}</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <>
                <Ionicons
                  name="save-outline"
                  size={18}
                  color={theme.colors.white}
                />
                <Text style={styles.saveText}>{t("save")}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </>
  );
}

/* ================= HELPERS ================= */

function GridItem({ isWide, children }: any) {
  return (
    <View style={{ flexBasis: isWide ? "50%" : "100%", padding: 8 }}>
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
        contentStyle={{ fontSize: 14, paddingVertical: 4 }}
        style={{
          height: multiline ? 72 : 32,
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
    borderBottomWidth: 1,
  },
  label: {
    width: 170,
    fontSize: 14,
    color: "#888",
    paddingRight: 8,
  },
  value: { flex: 1 },
  inlineWrap: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -8,
    },
    card: {
      height: "100%",
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      backgroundColor: theme.colors.paperBackground,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.8,
      color: theme.colors.textTertiary,
      marginBottom: 10,
    },
    dateField: {
      height: 32,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: 6,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.white,
    },
    dateText: {
      fontSize: 14,
      color: theme.colors.textPrimary,
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      backgroundColor: theme.colors.white,
    },
    resetText: {
      color: theme.colors.primary,
      fontWeight: "600",
      fontSize: 15,
    },
    saveButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
    },
    saveText: {
      color: theme.colors.white,
      fontWeight: "600",
      fontSize: 15,
    },
    supportItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    supportItemText: {
      fontSize: 14,
    },
    supportDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
  });
