import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import CommonTable from "../components/CommonTable";
import { User } from "../types/User";
import { Sender } from "../types/Sender";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "../components/ToastProvider";
import FormDropdown from "../components/FormDropdown";
import ApprovalToggle from "../components/ApprovalToggle";
import { getUsers } from "../api/userApi";
import { activateSender, getSenderByUserId } from "../api/senderApi";
import { AppTheme } from "../theme";

export default function ActivateSenderScreen() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const { showToast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [users, setUsers] = useState<User[]>([]);
  const [senders, setSenders] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const response = await getUsers();
      const transformedUsers = response?.data?.map((user) => ({
        label: `${user.firstName} ${user.lastName}`,
        value: user.id,
      }));

      setUsers(transformedUsers);

      if (transformedUsers.length) {
        setSelectedUserId(transformedUsers?.[0]?.value);
      }
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load users"), "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSenderByUserId = useCallback(async (userId: string | null) => {
    if (!userId) return;

    try {
      setLoading(true);
      const res = await getSenderByUserId(userId);
      setSenders(res?.data ?? []);
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load senders"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  useEffect(() => {
    if (selectedUserId) {
      fetchSenderByUserId(selectedUserId);
    }
  }, [selectedUserId]);

  const handleToggleSender = async (item) => {
    try {
      await activateSender(item.id);
      showToast(
        `Sender ${
          !item.emailConfirmed ? "activated" : "deactivated"
        } successfully`,
        "success"
      );
      fetchSenderByUserId(selectedUserId);
    } catch (error) {
      showToast("Failed to update sender status", "error");
    }
  };

  const columns = [
    {
      label: "Name",
      key: "fullName",
      flex: 3.5,
      render: (item) => item.firstName + " " + item.lastName,
    },
    { label: "Mobile", key: "phoneNumber", flex: 2.2 },
    { label: "Email", key: "email", flex: 2.5 },
    {
      label: "Created At",
      key: "createdAt",
      flex: 2.6,
      render: (item) => (
        <Text>
          {item.createdAt
            ? dayjs(item.createdAt).format("DD MMM YYYY, hh:mm A")
            : "-"}
        </Text>
      ),
    },
    {
      key: "actions",
      label: "Activation",
      flex: 2.5,
      render: (item: Sender) => {
        return (
          <ApprovalToggle
            isApproved={item.emailConfirmed}
            onToggle={() => handleToggleSender(item)}
            approvedText="Activated"
            pendingText="Click to Activate"
          />
        );
      },
    },
  ];

  return (
    <Surface style={styles.container} elevation={2}>
      <View style={styles.content}>
        <Text
          variant="titleLarge"
          style={[styles.heading, { color: theme.colors.primary }]}
        >
          Approve Senders
        </Text>
        <FormDropdown
          label="Select User"
          value={selectedUserId}
          options={users}
          onSelect={(val) => setSelectedUserId(val)}
        />
        <View style={{ flex: 1 }}>
          <CommonTable
            data={senders}
            columns={columns}
            loading={loading}
            emptyIcon={
              <Ionicons
                name="people-outline"
                size={48}
                color={colors.disabledText}
              />
            }
            emptyText="No senders found"
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
