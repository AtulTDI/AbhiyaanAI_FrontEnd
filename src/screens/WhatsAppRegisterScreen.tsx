import React, { useCallback, useState } from "react";
import { View, StyleSheet, Image, ActivityIndicator } from "react-native";
import { Surface, Text, Button, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { useToast } from "../components/ToastProvider";
import { extractErrorMessage } from "../utils/common";
import { AppTheme } from "../theme";
import {
  generateQr,
  getRegistrationStatus,
  whatsAppLogout,
} from "../api/whatsappApi";

export default function WhatsAppRegisterScreen() {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(true);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRegistrationStatus();
      const isRegistered = JSON.parse(response.data)?.isReady;
      setRegistered(isRegistered);

      if (isRegistered) {
        setQrImageUrl(null);
      } else {
        const response = await generateQr();
        const base64Qr = JSON.parse(response.data)?.qr;
        if (base64Qr) {
          setQrImageUrl(base64Qr);
          setRegistered(true);
        } else {
          setQrImageUrl(null);
        }
      }
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to fetch status"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    const response = await whatsAppLogout();

    if (response.data?.success) {
      showToast("User logged out successfully", "success");
      setRegistered(false);
      setQrImageUrl(null);
    } else {
      showToast("Something went wrong", "error");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus])
  );

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.header}>
        <Text
          variant="headlineSmall"
          style={[styles.heading, { color: colors.primary }]}
        >
          WhatsApp Device Registration
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : registered ? (
        <View style={styles.centerBox}>
          {/* <Image
            source={require("../assets/success.png")}
            style={styles.successIcon}
          /> */}
          <Text variant="titleMedium" style={styles.successText}>
            Your device is already registered with WhatsApp 🎉
          </Text>
          <Button
            mode="contained"
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            Logout
          </Button>
        </View>
      ) : (
        <View style={styles.centerBox}>
          <Text variant="titleMedium" style={styles.instruction}>
            Scan this QR code in WhatsApp to register your device
          </Text>

          {qrImageUrl ? (
            <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
          ) : (
            <Text style={styles.noQrText}>No QR available</Text>
          )}

          <Text style={styles.subText}>
            Open WhatsApp → Settings → Linked Devices → Scan QR
          </Text>
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    justifyContent: "center",
  },
  heading: {
    fontWeight: "bold",
    textAlign: "center",
  },
  header: {
    marginBottom: 24,
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  instruction: {
    textAlign: "center",
    marginBottom: 16,
  },
  qrImage: {
    width: 220,
    height: 220,
    marginVertical: 20,
    borderRadius: 12,
  },
  subText: {
    textAlign: "center",
    color: "gray",
    marginTop: 12,
  },
  noQrText: {
    textAlign: "center",
    color: "gray",
    marginVertical: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  successText: {
    textAlign: "center",
    marginBottom: 20,
  },
  logoutButton: {
    marginTop: 16,
    borderRadius: 8,
    width: "60%",
  },
});
