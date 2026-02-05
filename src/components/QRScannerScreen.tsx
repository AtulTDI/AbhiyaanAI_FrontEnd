import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ActivityIndicator } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function QRScannerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { onScan } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    // Extract EPIC ID pattern (3 letters + 7 digits)
    const epicMatch = data.match(/[A-Z]{3}[0-9]{7}/);
    const epicId = epicMatch ? epicMatch[0] : data;

    onScan(epicId);
    navigation.goBack();
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Camera permission required</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      <View style={styles.overlay}>
        <Text style={styles.text}>Scan Voter QR Code</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  text: { color: "white", fontSize: 16, fontWeight: "600" },
});
