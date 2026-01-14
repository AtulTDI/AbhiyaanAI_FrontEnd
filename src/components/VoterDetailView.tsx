import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import {
  Text,
  IconButton,
  Avatar,
  Button,
  TextInput,
  useTheme,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Voter } from "../types/Voter";
import { extractErrorMessage } from "../utils/common";
import FamilyMembersCard from "../components/FamilyMembersCard";
import Tabs from "../components/Tabs";
import SurveyTab from "./SurveyTab";
import {
  updateMobileNumber,
  updateStarVoter,
  verifyVoter,
} from "../api/voterApi";
import { useToast } from "./ToastProvider";
import { AppTheme } from "../theme";

type Props = {
  voter: Voter;
  onBack: () => void;
  onOpenVoter: (id: string) => void;
};

type TabKey = "details" | "family" | "survey";

export default function VoterDetailView({ voter, onBack, onOpenVoter }: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const styles = createStyles(theme);
  const isTablet = width >= 768;

  const [tab, setTab] = useState<TabKey>("details");
  const [mobile, setMobile] = useState(voter.mobileNumber ?? "");
  const [isVerified, setIsVerified] = useState(voter.isVerified);
  const [isStarVoter, setIsStarVoter] = useState(voter.isStarVoter);

  const tabs = [
    { key: "details", label: t("voter.tabDetails") },
    { key: "family", label: t("voter.tabFamily") },
    { key: "survey", label: t("voter.tabSurvey") },
  ];

  const handleMobileNumberUpdate = async (number: string) => {
    try {
      await updateMobileNumber(voter.id, number);
      setMobile(number);
      showToast(t("voter.mobileUpdateSuccess"), "success");
    } catch (error) {
      setMobile("-");
      showToast(extractErrorMessage(error), "error");
    }
  };

  const handleVerifyVoter = async () => {
    try {
      await verifyVoter(voter.id, !isVerified);
      setIsVerified(!isVerified);
      showToast(
        !isVerified
          ? t("voter.voterVerifiedSuccess")
          : t("voter.voterUnverifiedSuccess"),
        "success"
      );
    } catch (error) {
      showToast(extractErrorMessage(error), "error");
    }
  };

  const handleStarVoter = async () => {
    try {
      await updateStarVoter(voter.id, !isStarVoter);
      setIsStarVoter(!isStarVoter);
      showToast(
        !isStarVoter
          ? t("voter.voterStarredSuccess")
          : t("voter.voterUnstarredSuccess"),
        "success"
      );
    } catch (error) {
      showToast(extractErrorMessage(error), "error");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ================= TOP BAR ================= */}
      <View style={styles.topBar}>
        <IconButton
          icon="arrow-left"
          iconColor={theme.colors.primary}
          onPress={onBack}
        />

        <View style={styles.identityStrip}>
          <Avatar.Text
            size={40}
            label={voter.fullName?.[0] ?? "V"}
            style={{ backgroundColor: theme.colors.primaryLight }}
          />
          <Text style={styles.topName}>{voter.fullName}</Text>
        </View>
      </View>

      {/* ================= TABS ================= */}
      <Tabs value={tab} onChange={(v) => setTab(v as TabKey)} tabs={tabs} />

      {/* ================= DETAILS TAB ================= */}
      {tab === "details" && (
        <View style={styles.contentWrapper}>
          <View style={[styles.row, !isTablet && styles.rowStacked]}>
            <View style={styles.col}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {t("voter.personalDetails")}
                </Text>

                <InfoRow label={t("voter.labelName")} value={voter.fullName} />
                <InfoRow
                  label={t("voter.labelFatherHusband")}
                  value={voter.fatherHusbandName}
                />
                <InfoRow
                  label={t("voter.labelGender")}
                  value={t(`voter.gender${voter.gender}`, {
                    defaultValue: voter.gender,
                  })}
                />
                <InfoRow label={t("voter.labelAge")} value={`${voter.age}`} />

                <EditableInfoRow
                  label={t("voter.labelMobile")}
                  value={mobile || "-"}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onSave={handleMobileNumberUpdate}
                />
              </View>
            </View>

            <View style={styles.col}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("voter.identity")}</Text>

                <InfoRow label={t("voter.labelEpicId")} value={voter.epicId} />
                <InfoRow
                  label={t("voter.labelPrabagNo")}
                  value={`${voter.prabagNumber}`}
                />
                <InfoRow label={t("voter.labelRank")} value={`${voter.rank}`} />

                <View style={{ height: 12 }} />

                <Text style={styles.sectionTitle}>
                  {t("voter.votingDetails")}
                </Text>

                <InfoRow
                  label={t("voter.labelBoothNo")}
                  value={`${voter.votingBoothNumber ?? "-"}`}
                />
                <InfoRow
                  label={t("voter.labelVotingRoom")}
                  value={`${voter.votingRoomNumber ?? "-"}`}
                />
                <InfoRow
                  label={t("voter.labelBoothAddress")}
                  value={voter.votingBoothAddress ?? "-"}
                />
              </View>
            </View>
          </View>

          <View style={[styles.row, !isTablet && styles.rowStacked]}>
            <View style={styles.col}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {t("voter.addressSection")}
                </Text>

                <InfoRow
                  label={t("voter.labelHouseNo")}
                  value={voter.houseNumber}
                />
                <InfoRow
                  label={t("voter.labelAddress")}
                  value={voter.address}
                />
                <InfoRow
                  label={t("voter.labelListArea")}
                  value={`${voter.listArea}`}
                />
              </View>
            </View>

            <View style={styles.col}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {t("voter.statusSection")}
                </Text>

                <View
                  style={[
                    rowStyles.row,
                    { borderBottomColor: theme.colors.divider },
                  ]}
                >
                  <Text
                    style={[
                      rowStyles.label,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {t("voter.starVoter")}
                  </Text>

                  <Ionicons
                    name={isStarVoter ? "star" : "star-outline"}
                    size={22}
                    color={
                      isStarVoter
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                    onPress={handleStarVoter}
                  />
                </View>

                <View style={styles.verifyRow}>
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isVerified
                          ? theme.colors.successText
                          : theme.colors.errorText,
                      },
                    ]}
                  >
                    {isVerified ? t("voter.verified") : t("voter.notVerified")}
                  </Text>

                  <Button
                    mode={isVerified ? "outlined" : "contained"}
                    compact
                    onPress={handleVerifyVoter}
                    style={styles.button}
                  >
                    {isVerified ? t("voter.unverify") : t("voter.verify")}
                  </Button>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {tab === "family" && (
        <FamilyMembersCard voter={voter} onSelectMember={onOpenVoter} />
      )}
      {tab === "survey" && <SurveyTab voterId={voter.id} />}
    </ScrollView>
  );
}

/* ================= ROW COMPONENTS ================= */

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={[rowStyles.row, { borderBottomColor: theme.colors.divider }]}>
      <Text style={[rowStyles.label, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[rowStyles.value, { color: theme.colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}

function EditableInfoRow({
  label,
  value,
  keyboardType,
  maxLength,
  onSave,
}: any) {
  const theme = useTheme<AppTheme>();
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

  return (
    <View style={[rowStyles.row, { borderBottomColor: theme.colors.divider }]}>
      <Text style={[rowStyles.label, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>

      {!editing ? (
        <View style={rowStyles.valueRow}>
          <Text style={[rowStyles.value, { color: theme.colors.textPrimary }]}>
            {value}
          </Text>
          <Ionicons
            name="pencil"
            size={18}
            color={theme.colors.primary}
            onPress={() => setEditing(true)}
          />
        </View>
      ) : (
        <View style={rowStyles.editRow}>
          <TextInput
            dense
            mode="outlined"
            value={local}
            keyboardType={keyboardType}
            maxLength={maxLength}
            onChangeText={setLocal}
            style={rowStyles.input}
          />
          <IconButton
            icon="check"
            size={18}
            onPress={() => {
              onSave?.(local);
              setEditing(false);
            }}
          />
          <IconButton
            icon="close"
            size={18}
            onPress={() => setEditing(false)}
          />
        </View>
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme.colors.white,
      flexGrow: 1,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    identityStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    topName: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.textPrimary,
    },
    contentWrapper: { gap: 16 },
    row: { flexDirection: "row", gap: 16 },
    rowStacked: { flexDirection: "column" },
    col: { flex: 1 },
    card: {
      height: "100%",
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      backgroundColor: theme.colors.paperBackground,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.textTertiary,
      letterSpacing: 0.8,
    },
    verifyRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
    },
    statusText: { fontSize: 15, fontWeight: "600" },
    button: { borderRadius: 10 },
  });

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  label: { fontSize: 14 },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  value: { fontSize: 14, fontWeight: "500" },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  input: { height: 36, flex: 1 },
});
