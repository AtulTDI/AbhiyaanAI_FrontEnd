import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Dialog,
  Searchbar,
  List,
  Checkbox,
  Button,
  Text,
  Divider,
  useTheme,
  Portal,
  ActivityIndicator,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { Voter } from "../types/Voter";
import { getEligibleFamilyMembers } from "../api/voterApi";
import { useDebounce } from "../hooks/useDebounce";
import { getAuthData } from "../utils/storage";
import { AppTheme } from "../theme";

type Props = {
  visible: boolean;
  voter: Voter;
  existingIds: string[];
  onClose: () => void;
  onAdd: (members: string[]) => void;
};

export default function AddFamilyMembersDialog({
  visible,
  voter,
  existingIds,
  onClose,
  onAdd,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();

  const isTablet = width >= 900;

  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 400);

  const [list, setList] = useState<Voter[]>([]);
  const [selected, setSelected] = useState<Record<string, Voter>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    fetchVoters();
  }, [debounced, visible]);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const { applicationId } = await getAuthData();
      const res = await getEligibleFamilyMembers(
        applicationId,
        1,
        50,
        debounced
      );

      const filtered = res.data.data.filter(
        (v: Voter) => v.id !== voter.id && !existingIds.includes(v.id)
      );
      setList(filtered);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (v: Voter) => {
    setSelected((prev) => {
      const copy = { ...prev };
      copy[v.id] ? delete copy[v.id] : (copy[v.id] = v);
      return copy;
    });
  };

  const confirm = () => {
    const members = Object.values(selected).map((v) => v.id);
    onAdd(members);
    setSelected({});
  };

  return (
    <Portal>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <Dialog
          visible={visible}
          onDismiss={onClose}
          style={[
            styles.dialog,
            {
              width: isTablet ? 520 : "92%",
              height: isTablet ? 620 : 520,
            },
          ]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>{t("voter.addFamilyMembers")}</Text>
            <Text style={styles.subtitle}>{t("voter.addFamilySubtitle")}</Text>
          </View>

          <Divider style={styles.divider} />

          {/* SEARCH + LABEL */}
          <View style={styles.topSection}>
            <Searchbar
              placeholder={t("voter.searchVoters")}
              value={search}
              onChangeText={setSearch}
              style={styles.search}
              inputStyle={{
                fontSize: 14,
                minHeight: 44,
                height: 44,
              }}
            />
          </View>

          <View style={{ flex: 1 }}>
            {loading && (
              <View style={styles.overlayLoader}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}

            <Dialog.Content style={{ flex: 1, paddingHorizontal: 0 }}>
              <FlatList
                data={list}
                keyExtractor={(i) => i.id}
                refreshing={loading}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 12,
                  paddingBottom: 12,
                }}
                renderItem={({ item }) => {
                  const checked = !!selected[item.id];
                  return (
                    <List.Item
                      title={item.fullName}
                      description={t(`voter.gender${item.gender}`, {
                        defaultValue: item.gender,
                      })}
                      titleStyle={styles.listTitle}
                      descriptionStyle={styles.listDescription}
                      onPress={() => toggle(item)}
                      style={[
                        styles.listItem,
                        checked && styles.listItemSelected,
                      ]}
                      left={() => (
                        <Checkbox
                          status={checked ? "checked" : "unchecked"}
                          color={theme.colors.primary}
                        />
                      )}
                    />
                  );
                }}
                ListEmptyComponent={
                  !loading ? (
                    <Text style={styles.emptyText}>{t("voter.noData")}</Text>
                  ) : null
                }
              />
            </Dialog.Content>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.actions}>
            <Button
              onPress={onClose}
              style={{ borderRadius: 10 }}
              textColor={theme.colors.textSecondary}
            >
              {t("cancel")}
            </Button>
            <Button
              mode="contained"
              disabled={Object.keys(selected).length === 0}
              style={{ borderRadius: 10 }}
              onPress={confirm}
            >
              {t("voter.addWithCount", {
                count: Object.keys(selected).length,
              })}
            </Button>
          </View>
        </Dialog>
      </KeyboardAvoidingView>
    </Portal>
  );
}

/* ================= STYLES ================= */

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    dialog: {
      borderRadius: 16,
      backgroundColor: theme.colors.white,
      alignSelf: "center",
      maxHeight: "85%",
      display: "flex",
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      backgroundColor: theme.colors.paperBackground,
      marginTop: 0,
      borderRadius: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    divider: {
      backgroundColor: theme.colors.divider,
    },
    topSection: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 6,
    },
    search: {
      backgroundColor: theme.colors.white,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      borderRadius: 12,
      height: 44,
      minHeight: 44,
    },
    selectionBar: {
      marginTop: 10,
      marginBottom: 6,
    },
    selectionText: {
      fontSize: 13,
      color: theme.colors.textTertiary,
    },
    listLabel: {
      fontSize: 13,
      marginBottom: 6,
      color: theme.colors.textSecondary,
    },
    listItem: {
      paddingVertical: 4,
      paddingRight: 8,
      backgroundColor: theme.colors.white,
    },
    listItemSelected: {
      backgroundColor: theme.colors.softOrange,
      borderRadius: 4,
    },
    listTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.textPrimary,
    },
    listDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    emptyText: {
      textAlign: "center",
      paddingVertical: 24,
      color: theme.colors.textSecondary,
      fontSize: 13,
    },
    actions: {
      display: "flex",
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 16,
      justifyContent: "space-between",
    },
    overlayLoader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.6)",
      zIndex: 10,
    },
  });
