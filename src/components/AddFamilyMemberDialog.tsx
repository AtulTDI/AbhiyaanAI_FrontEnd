import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, useWindowDimensions } from "react-native";
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
} from "react-native-paper";
import { Voter } from "../types/Voter";
import { getEligibleFamilyMembers } from "../api/voterApi";
import { useDebounce } from "../hooks/useDebounce";
import { getAuthData } from "../utils/storage";
import { AppTheme } from "../theme";
import { getGender } from "../utils/common";

type Props = {
  visible: boolean;
  voter: Voter;
  existingIds: string[];
  onClose: () => void;
  onAdd: (members: any[]) => void;
};

export default function AddFamilyMembersDialog({
  visible,
  voter,
  existingIds,
  onClose,
  onAdd,
}: Props) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;

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
        20,
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
      <Dialog
        visible={visible}
        onDismiss={onClose}
        style={[
          styles.dialog,
          {
            width: isTablet ? 520 : "92%",
            maxHeight: height * 0.8,
          },
        ]}
      >
        {/* ---------- HEADER ---------- */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Family Members</Text>
          <Text style={styles.subtitle}>Select voters to link as family</Text>
        </View>

        <Divider style={styles.divider} />

        {/* ---------- CONTENT ---------- */}
        <Dialog.Content style={styles.content}>
          <Searchbar
            placeholder="Search voters"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
            inputStyle={{ fontSize: 14 }}
          />

          <View style={styles.selectionBar}>
            <Text style={styles.selectionText}>
              Selected: {Object.keys(selected).length}
            </Text>
          </View>

          <View style={styles.listContainer}>
            <FlatList
              data={list}
              keyExtractor={(i) => i.id}
              refreshing={loading}
              renderItem={({ item }) => {
                const checked = !!selected[item.id];
                return (
                  <List.Item
                    title={item.fullName}
                    description={getGender(item.gender)}
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
                  <Text style={styles.emptyText}>No voters found</Text>
                ) : null
              }
            />
          </View>
        </Dialog.Content>

        <Divider style={styles.divider} />

        {/* ---------- FOOTER ---------- */}
        <Dialog.Actions style={styles.actions}>
          <Button
            onPress={onClose}
            style={{ borderRadius: 10 }}
            textColor={theme.colors.textSecondary}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            disabled={Object.keys(selected).length === 0}
            style={{ borderRadius: 10 }}
            onPress={confirm}
          >
            Add ({Object.keys(selected).length})
          </Button>
        </Dialog.Actions>
      </Dialog>
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
    },

    header: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      backgroundColor: theme.colors.paperBackground,
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

    content: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
    },

    search: {
      backgroundColor: theme.colors.white,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      borderRadius: 12,
    },

    selectionBar: {
      marginTop: 10,
      marginBottom: 6,
    },

    selectionText: {
      fontSize: 13,
      color: theme.colors.textTertiary,
    },

    listContainer: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      borderRadius: 12,
      backgroundColor: theme.colors.white,
      maxHeight: 300,
      overflow: "hidden",
    },

    listItem: {
      paddingVertical: 4,
      paddingRight: 8,
      backgroundColor: theme.colors.white,
    },

    listItemSelected: {
      backgroundColor: theme.colors.softOrange,
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
      paddingHorizontal: 16,
      paddingVertical: 10,
      justifyContent: "space-between",
    },
  });
