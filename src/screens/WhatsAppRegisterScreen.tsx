import React, { useCallback, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import {
  Surface,
  Text,
  useTheme,
  Button,
  Portal,
  Modal,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import CommonTable from "../components/CommonTable";
import { useToast } from "../components/ToastProvider";
import { extractErrorMessage } from "../utils/common";
import {
  joinGroups,
  onEvent,
  startConnection,
} from "../services/signalrService";
import { generateChannelQr, getChannels } from "../api/channelApi";
import { getAuthData } from "../utils/storage";
import { AppTheme } from "../theme";

export default function WhatsAppRegisterScreen() {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const { showToast } = useToast();

  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [qrVisible, setQrVisible] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [loadingQrId, setLoadingQrId] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    const { applicationId } = await getAuthData();
    setLoading(true);
    try {
      const response = await getChannels(applicationId);
      setChannels(Array.isArray(response?.data) ? response.data : []);
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load channels"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const setupSignalR = async (channelId: string) => {
    const { accessToken } = await getAuthData();

    await startConnection(accessToken);
    await joinGroups(channelId);

    onEvent(
      "ReceiveVideoUpdate",
      (recipientId: string, status: string, channelId: string) => {
        if (status === "Completed") {
          setChannels((prev) =>
            prev.map((ch) =>
              ch.id === channelId ? { ...ch, status: "completed" } : ch
            )
          );
        }
      }
    );
  };

  const handleGenerateQr = async (channelId: string) => {
    const { userId } = await getAuthData();
    await setupSignalR(channelId);
    setLoadingQrId(channelId);
    try {
      const response = await generateChannelQr(channelId, userId);
      //const parsedResponse = JSON.parse(response.data);
      if (response.data?.qr) {
        setQrImageUrl(response.data.qr);   
        setQrVisible(true);
      } else {
        showToast("QR code not found in response", "warning");
      }
    } catch (error: any) {
      showToast(
        extractErrorMessage(error, "Failed to generate QR code"),
        "error"
      );
    } finally {
      setLoadingQrId(null);
    }
  };

  const handleLogout = (channelId: string) => {};

  useFocusEffect(
    useCallback(() => {
      fetchChannels();
    }, [fetchChannels])
  );

  const columns = [
    {
      label: "Name",
      key: "name",
      flex: 2.5,
    },
    {
      label: "QR Code",
      flex: 1.5,
      render: (item: any) =>
        item.status.toLowerCase() === "completed" ? (
          <Button
            mode="contained"
            icon="logout"
            compact
            onPress={() => handleLogout(item.id)}
            style={{
              borderRadius: 6,
              minHeight: 32,
              paddingHorizontal: 6,
              width: 150,
            }}
            labelStyle={{
              fontSize: 14,
              lineHeight: 16,
            }}
          >
            Logout
          </Button>
        ) : (
          <Button
            mode="outlined"
            icon="qrcode"
            compact
            loading={loadingQrId === item.id}
            disabled={loadingQrId === item.id}
            onPress={() => handleGenerateQr(item.id)}
            style={{
              borderRadius: 6,
              borderColor:
                loadingQrId === item.id ? colors.disabledText : colors.primary,
              minHeight: 32,
              paddingHorizontal: 6,
              width: 150,
            }}
            labelStyle={{
              fontSize: 14,
              lineHeight: 16,
            }}
          >
            {loadingQrId === item.id ? "Generating" : "Generate"}
          </Button>
        ),
    },
    {
      label: "Status",
      key: "status",
      flex: 1.2,
      render: (item) => (
        <Text>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      ),
    },
    {
      label: "Created At",
      key: "createdAt",
      flex: 2,
      render: (item) => (
        <Text>
          {item.createdAt
            ? dayjs(item.createdAt).format("DD MMM YYYY, hh:mm A")
            : "-"}
        </Text>
      ),
    },
  ];

  return (
    <>
      <Surface style={styles.container} elevation={1}>
        <View style={styles.header}>
          <Text
            variant="titleLarge"
            style={[styles.heading, { color: colors.primary }]}
          >
            Channels
          </Text>
        </View>

        <CommonTable
          columns={columns}
          data={channels}
          loading={loading}
          emptyText="No channels found"
        />
      </Surface>

      {/* QR Modal */}
      <Portal>
        <Modal
          visible={qrVisible}
          onDismiss={() => setQrVisible(false)}
          contentContainerStyle={styles.modalContent}
          style={styles.modalWrapper}
        >
          <Text style={styles.modalTitle}>Scan QR Code</Text>

          {qrImageUrl ? (
            <Image
              source={{ uri: qrImageUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.noQrText}>No QR code available</Text>
          )}

          <Button
            mode="contained"
            onPress={() => setQrVisible(false)}
            style={styles.closeButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  heading: {
    fontWeight: "bold",
  },
  header: {
    marginBottom: 16,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  modalWrapper: {
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: 280,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  noQrText: {
    textAlign: "center",
    color: "gray",
    marginBottom: 16,
  },
  closeButton: {
    marginTop: 8,
    alignSelf: "stretch",
    borderRadius: 5,
  },
});
