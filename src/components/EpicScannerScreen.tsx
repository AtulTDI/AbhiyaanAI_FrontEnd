import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import MlkitOcr from "react-native-mlkit-ocr";
import { useNavigation } from "@react-navigation/native";
import { triggerEpicScan } from "../utils/epicScannerListener";

export default function EpicScannerScreen() {
  const navigation = useNavigation<any>();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const scanningRef = useRef(true);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    return () => {
      scanningRef.current = false;
    };
  }, []);

  const scanOnce = async () => {
    if (!scanningRef.current) return;

    try {
      if (!cameraRef.current || !cameraReady) {
        setTimeout(scanOnce, 400);
        return;
      }

      console.log("📸 Capturing...");
      const photo = await cameraRef.current.takeSnapshot({
        quality: 80
      });

      const uri = "file://" + photo.path;
      console.log("📷 Path:", uri);

      const result = await MlkitOcr.detectFromFile(uri);
      console.log("🧠 OCR:", result);

      if (!result || result.length === 0) {
        setTimeout(scanOnce, 300);
        return;
      }

      let text = result.map((b) => b.text).join(" ");
      text = text
        .toUpperCase()
        .replace(/O/g, "0")
        .replace(/I/g, "1")
        .replace(/Z/g, "2")
        .replace(/[^A-Z0-9]/g, "");

      console.log("🔎 CLEAN:", text);

      const match = text.match(/[A-Z]{3}[0-9]{7}/);

      if (match) {
        console.log("✅ EPIC:", match[0]);
        scanningRef.current = false;
        triggerEpicScan(match[0]);
        navigation.goBack();
        return;
      }

      setTimeout(scanOnce, 300);
    } catch (e) {
      console.log("🔥 Scan error:", e);
      setTimeout(scanOnce, 1000);
    }
  };

  useEffect(() => {
    if (cameraReady && hasPermission) {
      console.log("🚀 Start scanning");
      scanOnce();
    }
  }, [cameraReady, hasPermission]);

  if (!device || !hasPermission) {
    return (
      <View style={styles.center}>
        <Text>Opening camera...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={false}
        video={false}
        preview={true}
        onInitialized={() => {
          console.log("📷 Camera ready");
          setCameraReady(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
