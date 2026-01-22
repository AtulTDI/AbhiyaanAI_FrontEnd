import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
  TextInput,
  Button,
  HelperText,
  useTheme,
  Surface,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useTranslation } from "react-i18next";
import { Candidate } from "../types/Candidate";
import SingleImageUpload, { ImageAsset } from "./SingleImageUpload";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import { FixedLabel } from "./FixedLabel";
import { AppTheme } from "../theme";

type Props = {
  mode: "create" | "edit";
  candidate?: Candidate | null;
  loading?: boolean;
  onSubmit: (data: {
    name: string;
    partyName: string;
    candidatePhoto?: ImageAsset;
    symbolImage?: ImageAsset;
  }) => void;
  onCancel: () => void;
};

export default function CandidateForm({
  mode,
  candidate,
  loading,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const theme = useTheme<AppTheme>();

  const isEdit = mode === "edit";
  const isTwoColumn = isWeb && !isMobileWeb;

  /* ---------------- State ---------------- */

  const [name, setName] = useState("");
  const [partyName, setPartyName] = useState("");
  const [candidatePhoto, setCandidatePhoto] = useState<
    ImageAsset | null | undefined
  >(undefined);
  const [symbolImage, setSymbolImage] = useState<ImageAsset | null | undefined>(
    undefined
  );

  const [errors, setErrors] = useState<{
    name?: string;
    party?: string;
    photo?: string;
    symbol?: string;
  }>({});

  /* ---------------- Init / Reset ---------------- */

  useEffect(() => {
    setName(candidate?.name || "");
    setPartyName(candidate?.partyName || "");
    setCandidatePhoto(undefined);
    setSymbolImage(undefined);
    setErrors({});
  }, [candidate, mode]);

  /* ---------------- Validation ---------------- */

  const validate = () => {
    const e: typeof errors = {};

    if (!name.trim()) e.name = t("fieldRequired", { field: t("name") });
    if (!partyName.trim())
      e.party = t("fieldRequired", { field: t("candidate.party") });

    if (!isEdit) {
      if (!candidatePhoto) e.photo = t("candidate.photoRequired");
      if (!symbolImage) e.symbol = t("candidate.symbolRequired");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- Submit ---------------- */

  const handleSubmit = () => {
    if (!validate()) return;

    const payload: any = {
      name: name.trim(),
      partyName: partyName.trim(),
    };

    if (candidatePhoto !== undefined) payload.candidatePhoto = candidatePhoto;
    if (symbolImage !== undefined) payload.symbolImage = symbolImage;

    onSubmit(payload);
  };

  /* ---------------- Cancel ---------------- */

  const handleCancel = () => {
    setCandidatePhoto(undefined);
    setSymbolImage(undefined);
    setErrors({});
    onCancel();
  };

  /* ---------------- UI ---------------- */

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
    >
      <Surface
        style={[styles.form, { backgroundColor: theme.colors.white }]}
        elevation={1}
      >
        {/* Row 1: Name + Party */}
        <View style={isTwoColumn ? styles.row : styles.column}>
          <View style={styles.col}>
            <FixedLabel label={t("name")} required />
            <TextInput
              placeholder={t("placeholder.enterCandidateName")}
              placeholderTextColor={theme.colors.placeholder}
              value={name}
              onChangeText={(v) => {
                setName(v);
                setErrors((e) => ({ ...e, name: undefined }));
              }}
              mode="outlined"
              style={styles.input}
            />
            <HelperText
              type="error"
              visible={!!errors.name}
              style={styles.error}
            >
              {errors.name}
            </HelperText>
          </View>

          <View style={styles.col}>
            <FixedLabel label={t("candidate.party")} required />
            <TextInput
              placeholder={t("placeholder.enterPartyName")}
              placeholderTextColor={theme.colors.placeholder}
              value={partyName}
              onChangeText={(v) => {
                setPartyName(v);
                setErrors((e) => ({ ...e, party: undefined }));
              }}
              mode="outlined"
              style={styles.input}
            />
            <HelperText
              type="error"
              visible={!!errors.party}
              style={styles.error}
            >
              {errors.party}
            </HelperText>
          </View>
        </View>

        {/* Row 2: Images */}
        <View style={isTwoColumn ? styles.row : styles.column}>
          <View style={styles.col}>
            <FixedLabel label={t("candidate.photo")} required />
            <SingleImageUpload
              value={candidatePhoto}
              previewUrl={candidate?.candidatePhotoUrl}
              onChange={(img) => {
                setCandidatePhoto(img);
                setErrors((e) => ({ ...e, photo: undefined }));
              }}
            />
            <HelperText
              type="error"
              visible={!!errors.photo}
              style={styles.error}
            >
              {errors.photo}
            </HelperText>
          </View>

          <View style={styles.col}>
            <FixedLabel label={t("candidate.symbol")} required />
            <SingleImageUpload
              value={symbolImage}
              previewUrl={candidate?.symbolImageUrl}
              onChange={(img) => {
                setSymbolImage(img);
                setErrors((e) => ({ ...e, symbol: undefined }));
              }}
            />
            <HelperText
              type="error"
              visible={!!errors.symbol}
              style={styles.error}
            >
              {errors.symbol}
            </HelperText>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button mode="outlined" onPress={handleCancel} style={styles.btn}>
            {t("cancel")}
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.btn}
          >
            {isEdit ? t("update") : t("create")}
          </Button>
        </View>
      </Surface>
    </KeyboardAwareScrollView>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  form: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  column: {
    flexDirection: "column",
    marginBottom: 8,
  },
  col: {
    flex: 1,
  },
  input: {
    backgroundColor: "#fff",
    height: 44,
  },
  error: {
    paddingLeft: 0,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    borderRadius: 6,
  },
});
