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
import { AppTheme } from "../theme";

/* ================= TYPES ================= */

type SurveyData = {
  colorCode?: string;
  caste?: string;
  post?: string;
  activist?: string;
  newAddress?: string;
  society?: string;
  flatNo?: string;
  email?: string;
  mobile1?: string;
  mobile2?: string;
  dob?: string;
  demands?: string;
  additionalInfo?: string;
  deceased?: boolean;
  additionalVerification?: boolean;
  starVoter?: boolean;
  voted?: boolean;
};

type Props = {
  voterId?: string;
};

/* ================= CONSTANTS ================= */

const COLOR_CODES = [
  { labelKey: "colorOrange", value: "#fb923c" },
  { labelKey: "colorGreen", value: "#22c55e" },
  { labelKey: "colorBlue", value: "#3b82f6" },
  { labelKey: "colorRed", value: "#ef4444" },
];

const DUMMY_SURVEY_DATA: SurveyData = {
  colorCode: "#fb923c",
  caste: "OBC",
  post: "Booth Volunteer",
  activist: "",
  newAddress: "Near Main Road",
  society: "Shivaji Nagar",
  flatNo: "B-204",
  email: "demo.voter@example.com",
  mobile1: "",
  mobile2: "",
  dob: "1995-01-22",
  demands: "Road repair, water supply",
  additionalInfo: "Strong supporter",
  deceased: false,
  additionalVerification: true,
  starVoter: true,
  voted: true,
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

  useEffect(() => {
    loadSurvey();
  }, [voterId]);

  const loadSurvey = async () => {
    try {
      setData(DUMMY_SURVEY_DATA);
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    } finally {
      setLoading(false);
    }
  };

  const update = <K extends keyof SurveyData>(k: K, v: SurveyData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const updateMobile = (key: "mobile1" | "mobile2", value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    if (digits.length <= 10) update(key, digits);
  };

  if (loading) {
    return (
      <View style={{ padding: 24 }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {/* BASIC */}
      <GridItem isWide={isWide}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("voter.surveyBasic")}</Text>

          <Row label={t("voter.colorCode")}>
            <View style={rowStyles.inlineWrap}>
              {COLOR_CODES.map((c) => (
                <Chip
                  key={c.value}
                  compact
                  selected={data.colorCode === c.value}
                  onPress={() => update("colorCode", c.value)}
                  textStyle={{ fontSize: 14 }}
                  style={{
                    backgroundColor:
                      data.colorCode === c.value
                        ? c.value + "33"
                        : theme.colors.paperBackground,
                  }}
                >
                  {t(`voter.${c.labelKey}`)}
                </Chip>
              ))}
            </View>
          </Row>

          <InputRow
            label={t("voter.caste")}
            value={data.caste}
            onChange={(v) => update("caste", v)}
          />
          <InputRow
            label={t("voter.post")}
            value={data.post}
            onChange={(v) => update("post", v)}
          />
          <InputRow
            label={t("voter.activist")}
            value={data.activist}
            onChange={(v) => update("activist", v)}
            noDivider
          />
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
            label={t("voter.mobile2")}
            value={data.mobile2}
            keyboardType="phone-pad"
            onChange={(v) => updateMobile("mobile2", v)}
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
                {data.dob || t("voter.selectDate")}
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
            date={data.dob ? new Date(data.dob) : new Date()}
            onDismiss={() => setDobOpen(false)}
            onConfirm={({ date }) => {
              setDobOpen(false);
              if (date) update("dob", format(date, "yyyy-MM-dd"));
            }}
            validRange={{ endDate: new Date() }}
            saveLabel="Save"
          />
        </View>
      </GridItem>

      {/* ADDITIONAL INFO */}
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
            value={data.additionalInfo}
            multiline
            onChange={(v) => update("additionalInfo", v)}
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
            value={data.deceased}
            onChange={(v) => update("deceased", v)}
          />
          <BooleanRow
            label={t("voter.voted")}
            value={data.voted}
            onChange={(v) => update("voted", v)}
          />

          <Row label={t("voter.starVoter")} noDivider>
            <Ionicons
              name={data.starVoter ? "star" : "star-outline"}
              size={20}
              color={theme.colors.primary}
              onPress={() => update("starVoter", !data.starVoter)}
            />
          </Row>
        </View>
      </GridItem>
    </View>
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
        !noDivider && { borderBottomColor: theme.colors.divider },
        noDivider && { borderBottomWidth: 0 },
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
            textStyle={{ fontSize: 14 }}
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
  value: {
    flex: 1,
  },
  inlineWrap: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
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
  });
