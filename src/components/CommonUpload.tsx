import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import * as DocumentPicker from "expo-document-picker";
import {
  useTheme,
  Surface,
  IconButton,
  Text,
  Button,
} from "react-native-paper";
import { useToast } from "./ToastProvider";
import { AppTheme } from "../theme";

type FileType = "excel" | "video";

type Props = {
  fileType: FileType;
  onUpload: (file: DocumentPicker.DocumentPickerAsset) => void;
  onCancel: () => void;
  label?: string;
};

export default function CommonUpload({
  fileType,
  onUpload,
  onCancel,
  label,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { showToast } = useToast();
  const { colors } = theme;
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(
    null
  );

  const getAcceptedTypes = () => {
    if (fileType === "excel") {
      return [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
    }
    return ["video/mp4", "video/quicktime"];
  };

  const getSupportedText = () => {
    return fileType === "excel" ? ".xls, .xlsx" : ".mp4, .mov";
  };

  const getValidation = (name: string) => {
    if (fileType === "excel") {
      return name.endsWith(".xls") || name.endsWith(".xlsx");
    }
    return name.endsWith(".mp4") || name.endsWith(".mov");
  };

  const defaultLabel =
    fileType === "excel"
      ? "Click to upload Excel file"
      : "Click to upload Video file";

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: getAcceptedTypes(),
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const selectedFile = result.assets?.[0];
      if (!selectedFile) return;

      const name = selectedFile.name.toLowerCase();
      if (!getValidation(name)) {
        showToast(
          `Invalid file! Please upload a valid ${getSupportedText()} file`,
          "error"
        );
        return;
      }

      setFile(selectedFile);

      if (fileType === "video") {
        onUpload(selectedFile);
      }
    } catch (err) {
      console.error("File upload error:", err);
      showToast("Something went wrong while selecting the file", "error");
    }
  };

  return (
    <View style={styles.container}>
      <Surface
        style={[
          styles.uploadBox,
          {
            borderColor: colors.outline,
            backgroundColor: colors.white,
          },
        ]}
      >
        <TouchableOpacity style={styles.touchArea} onPress={handlePickFile}>
          <IconButton
            icon={fileType === "excel" ? "file-excel" : "video"}
            size={34}
            iconColor={colors.primary}
          />
          <Text
            variant="bodyLarge"
            style={[styles.label, { color: colors.onSurface }]}
          >
            {label || defaultLabel}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            {t("video.supported")}: {getSupportedText()}
          </Text>

          {file && (
            <Text
              variant="bodySmall"
              style={{ marginTop: 10, color: colors.primary }}
            >
              ✅ {file.name}
            </Text>
          )}
        </TouchableOpacity>
      </Surface>

      {fileType === "excel" && (
        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            icon="upload"
            onPress={() => {
              if (file) onUpload(file);
              else
                showToast(
                  "No file selected. Please select a file to upload",
                  "error"
                );
            }}
            disabled={!file}
            style={styles.actionButton}
            buttonColor={colors.primary}
            textColor={colors.onPrimary}
          >
            Import Voters
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 16,
  },
  uploadBox: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderRadius: 12,
    height: 170,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  touchArea: {
    alignItems: "center",
  },
  label: {
    fontWeight: "600",
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    borderRadius: 6,
  },
});
