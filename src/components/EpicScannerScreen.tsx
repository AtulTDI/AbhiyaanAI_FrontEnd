import { RootStackParamList } from '../types';
import { triggerEpicScan } from '../utils/epicScannerListener';
import { logger } from '../utils/logger';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MlkitOcr from 'react-native-mlkit-ocr';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export default function EpicScannerScreen() {
  const navigation = useNavigation<Navigation>();
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera | null>(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const scanningRef = useRef(true);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    return () => {
      scanningRef.current = false;
    };
  }, []);

  const scanOnce = useCallback(async () => {
    if (!scanningRef.current) return;

    try {
      if (!cameraRef.current || !cameraReady) {
        setTimeout(scanOnce, 400);
        return;
      }

      logger.log('📸 Capturing...');
      const photo = await cameraRef.current.takeSnapshot({ quality: 80 });

      const uri = 'file://' + photo.path;
      logger.log('📷 Path:', uri);

      const result = await MlkitOcr.detectFromFile(uri);
      logger.log('🧠 OCR:', result);

      if (!result || result.length === 0) {
        setTimeout(scanOnce, 300);
        return;
      }

      let text = result.map((b) => b.text).join(' ');
      text = text
        .toUpperCase()
        .replace(/O/g, '0')
        .replace(/I/g, '1')
        .replace(/Z/g, '2')
        .replace(/[^A-Z0-9]/g, '');

      logger.log('🔎 CLEAN:', text);

      const match = text.match(/[A-Z]{3}[0-9]{7}/);

      if (match) {
        logger.log('✅ EPIC:', match[0]);
        scanningRef.current = false;
        triggerEpicScan(match[0]);
        navigation.goBack();
        return;
      }

      setTimeout(scanOnce, 300);
    } catch (e) {
      logger.log('🔥 Scan error:', e);
      setTimeout(scanOnce, 1000);
    }
  }, [cameraReady, navigation]);

  useEffect(() => {
    if (cameraReady && hasPermission) {
      logger.log('🚀 Start scanning');
      scanOnce();
    }
  }, [cameraReady, hasPermission, scanOnce]);

  if (!device || !hasPermission) {
    return (
      <View style={styles.center}>
        <Text>Opening camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={false}
        video={false}
        preview={true}
        onInitialized={() => {
          logger.log('📷 Camera ready');
          setCameraReady(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
