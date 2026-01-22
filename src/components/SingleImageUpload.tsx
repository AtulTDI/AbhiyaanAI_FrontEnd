import React, { useRef } from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useTranslation } from "react-i18next";
import { usePlatformInfo } from "../hooks/usePlatformInfo";

export type ImageAsset = {
  uri: string;
  name?: string;
  type?: string;
  file?: File | null;
};

type Props = {
  value?: ImageAsset | null;
  previewUrl?: string;
  onChange: (image: ImageAsset | null) => void;
};

export default function SingleImageUpload({
  value,
  previewUrl,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isWeb } = usePlatformInfo();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------- Web picker ---------- */
  const pickWeb = () => {
    let input = fileInputRef.current;
    if (!input) {
      input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.style.display = "none";
      input.onchange = () => {
        const file = input!.files?.[0];
        if (!file) return;

        onChange({
          uri: URL.createObjectURL(file),
          name: file.name,
          type: file.type,
          file,
        });
      };
      document.body.appendChild(input);
      fileInputRef.current = input;
    }
    input.value = "";
    input.click();
  };

  /* ---------- Native picker ---------- */
  const pickNative = async () => {
    const ImagePicker = await import("expo-image-picker");

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) return;

    let uri = result.assets[0].uri;

    if (uri.startsWith("content://")) {
      const dest = `${FileSystem.cacheDirectory}img_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      uri = dest;
    }

    onChange({
      uri,
      name: uri.split("/").pop(),
      type: result.assets[0].type,
    });
  };

  const pickImage = () => {
    if (isWeb) pickWeb();
    else pickNative();
  };

  // 🔑 FIX: if value === null, user explicitly removed image
  const showImage = value === null ? undefined : value?.uri || previewUrl;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={showImage ? 1 : 0.8}
        onPress={!showImage ? pickImage : undefined}
        style={[styles.box, { borderColor: theme.colors.outline }]}
      >
        {showImage ? (
          <>
            <Image source={{ uri: showImage }} style={styles.preview} />

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => onChange(null)}
              hitSlop={10}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons
              name="image-outline"
              size={28}
              color={theme.colors.onSurface}
            />
            <Text style={{ color: theme.colors.onSurface, marginTop: 6 }}>
              {t("candidate.uploadImage")}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  box: {
    height: 160,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 6,
    borderRadius: 20,
  },
});
