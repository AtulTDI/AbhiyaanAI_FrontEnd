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
import { Voter } from "../types/Voter";
import { extractErrorMessage, getGender } from "../utils/common";
import FamilyMembersCard from "../components/FamilyMembersCard";
import Tabs from "../components/Tabs";
import { updateMobileNumber, verifyVoter } from "../api/voterApi";
import { useToast } from "./ToastProvider";
import { AppTheme } from "../theme";

type Props = {
  voter: Voter;
  onBack: () => void;
};

type TabKey = "details" | "family" | "survey";

export default function VoterDetailView({ voter, onBack }: Props) {
  const theme = useTheme<AppTheme>();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const styles = createStyles(theme);
  const isTablet = width >= 768;

  const [tab, setTab] = useState<TabKey>("details");
  const [mobile, setMobile] = useState(voter.mobileNumber ?? "");
  const [isVerified, setIsVerified] = useState(voter.isVerified);

  const tabs = [
    { key: "details", label: "Details" },
    {
      key: "family",
      label: "Family Members",
    },
    { key: "survey", label: "Survey" },
  ];

  const handleMobileNumberUpdate = async (number) => {
    try {
      await updateMobileNumber(voter.id, number);
      setMobile(number);
      showToast("Mobile number updated successfully", "success");
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
        `Voter ${!isVerified ? "verified" : "unverified"} successfully`,
        "success"
      );
    } catch (error) {
      showToast(extractErrorMessage(error), "error");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
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
          {/* ================= ROW 1 ================= */}
          <View style={[styles.row, !isTablet && styles.rowStacked]}>
            {/* PERSONAL DETAILS */}
            <View style={styles.col}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>

                <InfoRow label="Name" value={voter.fullName} />
                <InfoRow
                  label="Father / Husband Name"
                  value={voter.fatherHusbandName}
                />
                <InfoRow label="Gender" value={getGender(voter.gender)} />
                <InfoRow label="Age" value={`${voter.age}`} />
                <InfoRow label="Caste" value={voter.caste || "—"} />

                <EditableInfoRow
                  label="Mobile Number"
                  value={mobile || "-"}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onSave={handleMobileNumberUpdate}
                />
              </View>
            </View>

            {/* IDENTITY + VOTING */}
            <View style={styles.col}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>IDENTITY</Text>
                <InfoRow label="EPIC ID" value={voter.epicId} />
                <InfoRow label="Prabag No" value={`${voter.prabagNumber}`} />
                <InfoRow label="Rank" value={`${voter.rank}`} />

                <View style={{ height: 12 }} />

                <Text style={styles.sectionTitle}>VOTING DETAILS</Text>
                <EditableInfoRow
                  label="Booth No"
                  value={`${voter.votingBoothNumber ?? "-"}`}
                  keyboardType="numeric"
                />
                <EditableInfoRow
                  label="Voting Room"
                  value={`${voter.votingRoomNumber ?? "-"}`}
                  keyboardType="numeric"
                />
                <EditableInfoRow
                  label="Booth Address"
                  value={voter.votingBoothAddress ?? "-"}
                />
              </View>
            </View>
          </View>

          {/* ================= ROW 2 ================= */}
          <View style={[styles.row, !isTablet && styles.rowStacked]}>
            {/* ADDRESS */}
            <View style={styles.col}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>ADDRESS</Text>
                <InfoRow label="House No" value={voter.houseNumber} />
                <InfoRow label="Address" value={voter.address} />
                <InfoRow label="List Area" value={`${voter.listArea}`} />
              </View>
            </View>

            {/* STATUS */}
            <View style={styles.col}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>STATUS</Text>

                <InfoRow label="Active" value={voter.isActive ? "Yes" : "No"} />

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
                    {isVerified ? "Verified" : "Not Verified"}
                  </Text>

                  <Button
                    mode={isVerified ? "outlined" : "contained"}
                    compact
                    contentStyle={{ paddingHorizontal: 8 }}
                    labelStyle={{ fontSize: 13 }}
                    style={styles.button}
                    onPress={handleVerifyVoter}
                  >
                    {isVerified ? "Unverify" : "Verify"}
                  </Button>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ================= FAMILY TAB ================= */}
      {tab === "family" && (
        <View style={styles.singleColumn}>
          <FamilyMembersCard voter={voter} />
        </View>
      )}

      {/* ================= SURVEY TAB ================= */}
      {tab === "survey" && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Survey</Text>
          <Text style={styles.emptySub}>Survey data will appear here.</Text>
        </View>
      )}
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
  keyboardType = "default",
  maxLength,
  onSave,
}: {
  label: string;
  value: string;
  keyboardType?: "default" | "numeric" | "phone-pad";
  maxLength?: number;
  onSave?: (val: string) => void;
}) {
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
            style={{ marginLeft: 8 }}
            onPress={() => {
              setLocal(value);
              setEditing(true);
            }}
          />
        </View>
      ) : (
        <View style={rowStyles.editRow}>
          <TextInput
            mode="outlined"
            dense
            value={local}
            keyboardType={keyboardType}
            maxLength={maxLength}
            onChangeText={(t) => {
              if (keyboardType === "phone-pad") {
                const digits = t.replace(/[^0-9]/g, "");
                if (!maxLength || digits.length <= maxLength) {
                  setLocal(digits);
                }
              } else {
                setLocal(t);
              }
            }}
            style={[
              rowStyles.input,
              { backgroundColor: theme.colors.paperBackground },
            ]}
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
            onPress={() => {
              setLocal(value);
              setEditing(false);
            }}
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

    row: {
      flexDirection: "row",
      gap: 16,
      alignItems: "stretch",
    },
    rowStacked: {
      flexDirection: "column",
    },
    col: {
      flex: 1,
    },

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
      fontSize: 13,
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
    statusText: {
      fontSize: 15,
      fontWeight: "600",
    },

    emptyState: {
      alignItems: "center",
      marginTop: 48,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    emptySub: {
      marginTop: 6,
      color: theme.colors.textSecondary,
    },
    button: {
      borderRadius: 10,
    },
  });

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 14,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "65%",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "70%",
  },
  input: {
    height: 36,
    flex: 1,
    fontSize: 14,
  },
});