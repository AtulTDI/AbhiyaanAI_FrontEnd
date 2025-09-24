import React, { useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import CommonTable from "../components/CommonTable";
import { Sender } from "../types/Sender";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "../components/ToastProvider";
import FormDropdown from "../components/FormDropdown";
import ApprovalToggle from "../components/ApprovalToggle";
import { getUsers } from "../api/userApi";
import { activateSender, getSenderByUserId } from "../api/senderApi";
import { useServerTable } from "../hooks/useServerTable";
import { AppTheme } from "../theme";

export default function ActivateSenderScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const { showToast } = useToast();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<{ label: string; value: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await getUsers(0, 100000);
      const transformedUsers =
        response?.data?.items?.map((user) => ({
          label: `${user.firstName} ${user.lastName}`,
          value: user.id,
        })) || [];

      setUsers(transformedUsers);
      if (transformedUsers.length) {
        setSelectedUserId(transformedUsers[0].value);
      }
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load users"), "error");
    } finally {
      setLoadingUsers(false);
    }
  }, [showToast]);

  const fetchSendersByUser = useCallback(
    (page: number, pageSize: number, userId: string | null) => {
      if (!userId) return Promise.resolve({ items: [], totalCount: 0 });
      return getSenderByUserId(userId, page, pageSize).then((response) => ({
        items: Array.isArray(response?.data?.items) ? response.data.items : [],
        totalCount: response?.data?.totalRecords ?? 0,
      }));
    },
    []
  );

  const table = useServerTable<Sender, string>(
    fetchSendersByUser,
    { initialPage: 0, initialRowsPerPage: 10 },
    selectedUserId
  );

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  const handleToggleSender = async (item: Sender) => {
    try {
      await activateSender(item.id);
      showToast(
        t("sender.senderStatusMessage", {
          status: !item.emailConfirmed ? t("activated") : t("deactivated"),
        }),
        "success"
      );
      table.fetchData(table.page, table.rowsPerPage, selectedUserId);
    } catch (error) {
      showToast(t("sender.activationFailed"), "error");
    }
  };

  const columns = [
    {
      label: t("name"),
      key: "fullName",
      flex: 0.5,
      render: (item) => `${item.firstName} ${item.lastName}`,
    },
    { label: t("mobile"), key: "phoneNumber", flex: 0.2 },
    { label: t("email"), key: "email", flex: 0.4 },
    {
      label: t("createdAt"),
      key: "createdAt",
      flex: 0.4,
      render: (item: Sender) => (
        <Text>
          {item.createdAt
            ? dayjs(item.createdAt).format("DD MMM YYYY, hh:mm A")
            : "-"}
        </Text>
      ),
    },
    {
      key: "actions",
      label: t("activation"),
      flex: 1,
      render: (item: Sender) => (
        <ApprovalToggle
          isApproved={item.emailConfirmed}
          onToggle={() => handleToggleSender(item)}
          approvedText={t("activated")}
          pendingText={t("clickToActivate")}
        />
      ),
    },
  ];

  return (
    <Surface style={styles.container} elevation={2}>
      <View style={styles.content}>
        <Text
          variant="titleLarge"
          style={[
            styles.heading,
            { color: theme.colors.primary, marginBottom: 15 },
          ]}
        >
          {t("activateSenderPageLabel")}
        </Text>

        <FormDropdown
          label={t("selectUser")}
          value={selectedUserId}
          options={users}
          onSelect={setSelectedUserId}
        />

        <View style={{ flex: 1 }}>
          <CommonTable
            data={table.data}
            columns={columns}
            loading={table.loading || loadingUsers}
            emptyIcon={
              <Ionicons
                name="people-outline"
                size={48}
                color={colors.disabledText}
              />
            }
            emptyText={t("sender.noData")}
            tableHeight="calc(100vh - 320px)"
            onPageChange={table.setPage}
            onRowsPerPageChange={(size) => {
              table.setRowsPerPage(size);
              table.setPage(0);
            }}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            totalCount={table.total}
          />
        </View>
      </View>
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    content: {
      flex: 1,
      display: "flex",
    },
    container: {
      padding: 16,
      flex: 1,
      backgroundColor: theme.colors.white,
    },
    heading: {
      fontWeight: "bold",
      marginBottom: 16,
    },
  });
