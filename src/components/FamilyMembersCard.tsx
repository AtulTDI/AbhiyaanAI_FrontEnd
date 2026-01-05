import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Text, IconButton, Button, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useToast } from "./ToastProvider";
import { Voter } from "../types/Voter";
import AddFamilyMembersDialog from "./AddFamilyMemberDialog";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import {
  addFamilyMember,
  getFamilyMembers,
  removeFamilyMember,
} from "../api/voterApi";
import { extractErrorMessage, getGender } from "../utils/common";
import { AppTheme } from "../theme";

type Props = {
  voter: Voter;
};

export default function FamilyMembersCard({ voter }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const theme = useTheme<AppTheme>();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [members, setMembers] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await getFamilyMembers(voter.id);
      setMembers(res?.data?.members ?? []);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await removeFamilyMember(deleteId);
      await fetchMembers();
      showToast(t("voter.deleteSucess"), "success");
    } catch (e: any) {
      showToast(extractErrorMessage(e, t("voter.deleteFail")), "error");
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  /* ================= ADD MEMBER ================= */

  const handleAddMembers = async (members) => {
    const data = {
      sourceVoterId: voter.id,
      targetVoterId: members[0],
    };

    try {
      await addFamilyMember(data);
      await fetchMembers();
      showToast(t("voter.addSuccess"), "success");
    } catch (e: any) {
      showToast(extractErrorMessage(e, t("voter.addFail")), "error");
    }
  };

  /* ================= RENDER ================= */

  return (
    <View style={{ gap: 12 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: isWeb ? 520 : "100%",
        }}
      >
        <Text
          style={{
            fontWeight: "700",
            fontSize: 16,
            color: theme.colors.primary,
          }}
        >
          FAMILY MEMBERS
        </Text>

        <Button
          mode="contained"
          style={{ borderRadius: 10, paddingHorizontal: 3 }}
          compact
          onPress={() => setAddOpen(true)}
        >
          Add
        </Button>
      </View>

      {/* Loader */}
      {loading && (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      )}

      {/* Empty */}
      {!loading && members.length === 0 && (
        <View
          style={{
            maxWidth: isWeb ? 520 : "100%",
            backgroundColor: theme.colors.paperBackground,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.subtleBorder,
            padding: 14,
          }}
        >
          <Text style={{ color: theme.colors.textSecondary }}>
            No family members added
          </Text>
        </View>
      )}

      {/* Cards */}
      {members.map((m) => (
        <View
          key={m.id}
          style={{
            maxWidth: isWeb ? 520 : "100%",
          }}
        >
          <Pressable>
            <View
              style={{
                backgroundColor: theme.colors.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.subtleBorder,
                flexDirection: "row",
                overflow: "hidden",
              }}
            >
              {/* Accent strip */}
              <View
                style={{
                  width: 4,
                  backgroundColor: theme.colors.primaryLight,
                }}
              />

              {/* Content */}
              <View
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                }}
              >
                {/* Top row */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      variant="titleMedium"
                      style={{
                        fontWeight: "600",
                        color: theme.colors.primary,
                      }}
                    >
                      {m.fullName}
                    </Text>

                    <Text
                      style={{
                        marginTop: 2,
                        fontSize: 13,
                        color: theme.colors.textSecondary,
                      }}
                    >
                      Age {m.age} • {getGender(m.gender)}
                    </Text>
                  </View>

                  <IconButton
                    icon="delete"
                    size={18}
                    iconColor={theme.colors.error}
                    onPress={() => {
                      setDeleteId(m.id);
                      setDeleteOpen(true);
                    }}
                    style={{ margin: 0 }}
                  />
                </View>

                {/* Secondary info */}
                {!!m.fatherHusbandName && (
                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Father / Husband:{" "}
                    <Text style={{ color: theme.colors.textPrimary }}>
                      {m.fatherHusbandName}
                    </Text>
                  </Text>
                )}

                {/* Status */}
                <View
                  style={{
                    marginTop: 8,
                    alignSelf: "flex-start",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                    backgroundColor: m.isVerified
                      ? theme.colors.successBackground
                      : theme.colors.errorBackground,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: m.isVerified
                        ? theme.colors.successText
                        : theme.colors.errorText,
                    }}
                  >
                    {m.isVerified ? "Verified" : "Not Verified"}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>
      ))}

      {/* Delete Dialog */}
      <DeleteConfirmationDialog
        visible={deleteOpen}
        title={t("image.delete")}
        message={t("image.confirmDelete")}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Add Dialog */}
      <AddFamilyMembersDialog
        visible={addOpen}
        voter={voter}
        existingIds={members.map((m) => m.id)}
        onClose={() => setAddOpen(false)}
        onAdd={(newMembers) => {
          handleAddMembers(newMembers);
          setAddOpen(false);
        }}
      />
    </View>
  );
}
