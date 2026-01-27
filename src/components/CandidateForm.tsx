import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, HelperText, Surface } from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useTranslation } from "react-i18next";

import { Candidate } from "../types/Candidate";
import SingleImageUpload, { ImageAsset } from "./SingleImageUpload";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import { FixedLabel } from "./FixedLabel";

type Props = {
  mode: "create" | "edit";
  candidate?: Candidate | null;
  loading?: boolean;
  onSubmit: (data: {
    name: string;
    nameMr: string;
    partyName: string;
    partyNameMr: string;
    candidatePhoto?: ImageAsset | null;
    symbolImage?: ImageAsset | null;
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

  const isEdit = mode === "edit";
  const isTwoColumn = isWeb && !isMobileWeb;

  /* ---------------- State ---------------- */

  const [name, setName] = useState("");
  const [nameMr, setNameMr] = useState("");
  const [partyName, setPartyName] = useState("");
  const [partyNameMr, setPartyNameMr] = useState("");
  const [symbolNameMr, setSymbolNameMr] = useState("");

  const [candidatePhoto, setCandidatePhoto] = useState<
    ImageAsset | null | undefined
  >(undefined);
  const [symbolImage, setSymbolImage] = useState<ImageAsset | null | undefined>(
    undefined,
  );

  const [errors, setErrors] = useState<{
    name?: string;
    nameMr?: string;
    party?: string;
    partyMr?: string;
    symbolMr?: string;
    photo?: string;
    symbol?: string;
  }>({});

  /* ---------------- Init / Reset ---------------- */

  useEffect(() => {
    setName(candidate?.name || "");
    setNameMr(candidate?.nameMr || "");
    setPartyName(candidate?.partyName || "");
    setPartyNameMr(candidate?.partyNameMr || "");
    setSymbolNameMr(candidate?.symbolName || "");
    setCandidatePhoto(undefined);
    setSymbolImage(undefined);
    setErrors({});
  }, [candidate, mode]);

  /* ---------------- Validation ---------------- */

  const validate = () => {
    const e: typeof errors = {};

    if (!name.trim()) e.name = t("fieldRequired", { field: t("name") });
    if (!nameMr.trim())
      e.nameMr = t("fieldRequired", { field: t("candidate.mrName") });

    if (!partyName.trim())
      e.party = t("fieldRequired", { field: t("candidate.party") });
    if (!partyNameMr.trim())
      e.partyMr = t("fieldRequired", {
        field: t("candidate.mrPartyName"),
      });
    if (!symbolNameMr.trim())
      e.symbolMr = t("fieldRequired", {
        field: t("candidate.mrSymbolName"),
      });

    if (!isEdit) {
      if (!candidatePhoto) e.photo = t("candidate.photoRequired");
      if (!symbolImage) e.symbol = t("candidate.symbolRequired");
    } else {
      if (!candidatePhoto && !candidate?.candidatePhotoUrl)
        e.photo = t("candidate.photoRequired");

      if (!symbolImage && !candidate?.symbolImageUrl)
        e.symbol = t("candidate.symbolRequired");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- Submit ---------------- */

  const handleSubmit = () => {
    if (!validate()) return;

    const payload: any = {
      name: name.trim(),
      nameMr: nameMr.trim(),
      partyName: partyName.trim(),
      partyNameMr: partyNameMr.trim(),
      symbolName: symbolNameMr.trim(),
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
      <Surface style={styles.form} elevation={1}>
        {/* Row 1: Name + MR Name */}
        <View style={isTwoColumn ? styles.row : styles.column}>
          <View style={styles.col}>
            <FixedLabel label={t("name")} required />
            <TextInput
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
              style={{ paddingLeft: 0 }}
            >
              {errors.name}
            </HelperText>
          </View>

          <View style={styles.col}>
            <FixedLabel label={t("candidate.mrName")} required />
            <TextInput
              value={nameMr}
              onChangeText={(v) => {
                setNameMr(v);
                setErrors((e) => ({ ...e, nameMr: undefined }));
              }}
              mode="outlined"
              style={styles.input}
            />
            <HelperText
              type="error"
              visible={!!errors.nameMr}
              style={{ paddingLeft: 0 }}
            >
              {errors.nameMr}
            </HelperText>
          </View>
        </View>

        {/* Row 2: Party + MR Party */}
        <View style={isTwoColumn ? styles.row : styles.column}>
          <View style={styles.col}>
            <FixedLabel label={t("candidate.party")} required />
            <TextInput
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
              style={{ paddingLeft: 0 }}
            >
              {errors.party}
            </HelperText>
          </View>

          <View style={styles.col}>
            <FixedLabel label={t("candidate.mrPartyName")} required />
            <TextInput
              value={partyNameMr}
              onChangeText={(v) => {
                setPartyNameMr(v);
                setErrors((e) => ({ ...e, partyMr: undefined }));
              }}
              mode="outlined"
              style={styles.input}
            />
            <HelperText
              type="error"
              visible={!!errors.partyMr}
              style={{ paddingLeft: 0 }}
            >
              {errors.partyMr}
            </HelperText>
          </View>
        </View>

        {/* Row 3: Symbol Name */}
        <View style={isTwoColumn ? styles.row : styles.column}>
          <View style={styles.col}>
            <FixedLabel label={t("candidate.mrSymbolName")} required />
            <TextInput
              value={symbolNameMr}
              onChangeText={(v) => {
                setSymbolNameMr(v);
                setErrors((e) => ({ ...e, symbolMr: undefined }));
              }}
              mode="outlined"
              style={styles.input}
            />
            <HelperText
              type="error"
              visible={!!errors.symbolMr}
              style={{ paddingLeft: 0 }}
            >
              {errors.symbolMr}
            </HelperText>
          </View>
        </View>

        {/* Row 4: Images */}
        <View style={isTwoColumn ? styles.row : styles.column}>
          <View style={styles.col}>
            <FixedLabel label={t("candidate.photo")} required={!isEdit} />
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
              style={{ paddingLeft: 0 }}
            >
              {errors.photo}
            </HelperText>
          </View>

          <View style={styles.col}>
            <FixedLabel label={t("candidate.symbol")} required={!isEdit} />
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
              style={{ paddingLeft: 0 }}
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
    backgroundColor: "#fff",
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
    height: 44,
    backgroundColor: "#fff",
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
