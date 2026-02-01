import React, { useEffect, useState } from "react";
import { View, FlatList, Modal, StyleSheet, Pressable } from "react-native";
import {
  Text,
  ActivityIndicator,
  Divider,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { NativeModules } from "react-native";
import { AppTheme } from "../theme";

const { ThermalPrinter } = NativeModules;

export default function PrinterPicker({ visible, onSelect, onClose }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectingMac, setConnectingMac] = useState<string | null>(null);
  const [connectedMac, setConnectedMac] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);

  useEffect(() => {
    if (visible) {
      setErrorMessage(null);
      loadDevices();
    }
  }, [visible]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const list = await ThermalPrinter.getBondedDevices();
      setDevices(list || []);
    } catch (e) {
      console.log("Error loading devices", e);
    }
    setLoading(false);
  };
  const handleSelect = async (item) => {
    if (connectingMac) return;

    setErrorMessage(null);
    setConnectingMac(item.mac);

    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      await onSelect(item);
      setConnectedMac(item.mac);
    } catch (e) {
      setErrorMessage("Failed to connect to printer");
      setTimeout(() => {
        setErrorMessage(null);
      }, 2000);
    } finally {
      setConnectingMac(null);
    }
  };

  const renderItem = ({ item }) => {
    const selected = connectedMac === item.mac;
    const connecting = connectingMac === item.mac;

    return (
      <TouchableRipple
        onPress={() => {
          if (connectingMac) return;
          handleSelect(item);
        }}
        rippleColor={theme.colors.primarySoft}
        style={[
          styles.deviceItem,
          (selected || connecting) && styles.deviceItemSelected,
        ]}
      >
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.deviceName}>
              {item.name || "Unknown Device"}
            </Text>
            <Text style={styles.deviceMac}>{item.mac}</Text>
          </View>

          {/* Loader on right while connecting */}
          {connecting && (
            <ActivityIndicator
              size={18}
              color={theme.colors.primary}
              style={{ marginLeft: 10 }}
            />
          )}
        </View>
      </TouchableRipple>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Select Printer</Text>
              <Text style={styles.subtitle}>
                Choose a paired Bluetooth thermal printer
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : devices.length === 0 ? (
              <Text style={styles.emptyText}>No printers found</Text>
            ) : (
              <FlatList
                data={devices}
                keyExtractor={(item) => item.mac}
                renderItem={renderItem}
                ItemSeparatorComponent={() => (
                  <View style={styles.separatorSpace} />
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          <Divider style={styles.divider} />

          <TouchableRipple onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableRipple>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.colors.paperBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingBottom: 20,
      paddingHorizontal: 20,
      maxHeight: "80%",
      elevation: 12,
    },
    handle: {
      width: 40,
      height: 5,
      borderRadius: 14,
      backgroundColor: theme.colors.softGray,
      alignSelf: "center",
      marginBottom: 12,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    divider: {
      backgroundColor: theme.colors.divider,
      height: 1,
      marginVertical: 8,
    },
    content: {
      paddingVertical: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    deviceItem: {
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.colors.white,
      elevation: 1,
      borderWidth: 1,
      borderColor: theme.colors.surface,
    },
    deviceItemSelected: {
      backgroundColor: theme.colors.primarySurface,
      borderWidth: 1,
      borderColor: theme.colors.primaryLight,
    },
    deviceName: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textPrimary,
    },
    deviceMac: {
      fontSize: 11,
      marginTop: 4,
      color: theme.colors.textSecondary,
      letterSpacing: 0.3,
    },
    separatorSpace: {
      height: 10,
    },
    emptyText: {
      textAlign: "center",
      color: theme.colors.textSecondary,
      marginTop: 30,
      fontSize: 14,
    },
    cancelButton: {
      alignSelf: "flex-end",
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    cancelText: {
      color: theme.colors.error,
      fontWeight: "600",
      fontSize: 15,
    },
    errorBox: {
      backgroundColor: theme.colors.errorBackground,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    errorText: {
      color: theme.colors.errorText,
      fontSize: 13,
      fontWeight: "500",
    },
  });
