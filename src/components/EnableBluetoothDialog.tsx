import React from "react";
import { View, StyleSheet, Modal } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { AppTheme } from "../theme";

export default function EnableBluetoothDialog({ visible, onCancel, onEnable }) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Bluetooth is Off</Text>
          <Text style={styles.message}>
            Please enable Bluetooth to connect to your printer.
          </Text>

          <View style={styles.actions}>
            <Button
              mode="text"
              onPress={onCancel}
              labelStyle={styles.cancelText}
            >
              Cancel
            </Button>

            <Button
              mode="contained"
              onPress={onEnable}
              style={styles.enableButton}
              labelStyle={styles.enableText}
            >
              Turn On
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    container: {
      width: "100%",
      backgroundColor: theme.colors.white,
      borderRadius: 16,
      padding: 20,
      elevation: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.primary,
      marginBottom: 8,
    },
    message: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 20,
      lineHeight: 20,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    cancelText: {
      color: theme.colors.textSecondary,
      fontWeight: "600",
    },
    enableButton: {
      marginLeft: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
    },
    enableText: {
      color: theme.colors.white,
      fontWeight: "600",
    },
  });
