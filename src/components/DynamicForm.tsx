import React, { useState, useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import {
  TextInput,
  HelperText,
  Button,
  Surface,
  useTheme,
  Text,
  Checkbox,
} from "react-native-paper";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import FormDropdown from "./FormDropdown";
import { FieldConfig } from "../types";
import { FixedLabel } from "./FixedLabel";
import { AppTheme } from "../theme";

type Props = {
  fields: FieldConfig[];
  initialValues: Record<string, string | boolean>;
  mode: "create" | "edit";
  formSubmitLoading?: boolean;
  onChange?: (data: FieldConfig, value: string | boolean) => void;
  onSubmit?: (data: Record<string, string | boolean>) => void;
  onCancel?: () => void;
  children?: React.ReactNode;
};

export default function DynamicForm({
  fields,
  initialValues,
  mode,
  formSubmitLoading,
  onChange,
  onSubmit,
  onCancel,
  children,
}: Props) {
  const { t } = useTranslation();
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const styles = createStyles(theme, { isWeb, isMobileWeb });

  const [formData, setFormData] =
    useState<Record<string, string | boolean>>(initialValues);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized) {
      setFormData(initialValues);
      setFormErrors({});
      setHasInitialized(true);
    }
  }, [initialValues, hasInitialized]);

  const validate = () => {
    const errors: Record<string, string> = {};

    fields.forEach((field) => {
      const rawValue = formData[field.name];
      const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

      const numericValue = typeof value === "string" ? parseFloat(value) : NaN;

      if (field.required) {
        if (field.type === "checkbox") {
          if (value !== true) {
            errors[field.name] = t("fieldRequired", { field: t(field.label) });
            return;
          }
        } else {
          if (!value) {
            errors[field.name] = t("fieldRequired", { field: t(field.label) });
            return;
          }
        }
      }

      if (field.type === "checkbox") return;

      if (field.type === "email" && typeof value === "string") {
        if (!/^\S+@\S+\.\S+$/.test(value)) {
          errors[field.name] = "Invalid email format";
        }
      }

      if (
        field.type === "password" &&
        mode === "create" &&
        typeof value === "string"
      ) {
        if (value.length < 6) {
          errors[field.name] = "Passwords must be at least 6 characters";
        }
      }

      if (
        field.validationRules &&
        Array.isArray(field.validationRules) &&
        typeof value === "string"
      ) {
        const failedRules = field.validationRules
          .filter((rule) => !rule.test(value))
          .map((rule) => rule.message);

        if (failedRules.length > 0) {
          errors[field.name] = failedRules.join("\n");
        }
      }

      if (field.type === "number" && typeof value === "string") {
        if (value && isNaN(numericValue)) {
          errors[field.name] = `${field.label} must be a valid number`;
        }

        if (
          field.decimalPlaces != null &&
          value &&
          !new RegExp(`^\\d+(\\.\\d{1,${field.decimalPlaces}})?$`).test(value)
        ) {
          errors[
            field.name
          ] = `Only up to ${field.decimalPlaces} decimal place(s) allowed`;
        }

        if (
          field.decimalPlaces == null &&
          typeof value === "string" &&
          value.includes(".")
        ) {
          errors[field.name] = `${field.label} must be a whole number`;
        }

        if (field.min != null && numericValue < field.min) {
          errors[field.name] = `${field.label} must be ≥ ${field.min}`;
        }

        if (field.max != null && numericValue > field.max) {
          errors[field.name] = `${field.label} must be ≤ ${field.max}`;
        }
      }

      if (
        (field.name === "mobile" || field.name === "phoneNumber") &&
        typeof value === "string"
      ) {
        if (!/^\d{10}$/.test(value)) {
          errors[field.name] = `${field.label} must be exactly 10 digits`;
        }
      }

      if (
        (field.name === "firstName" || field.name === "lastName") &&
        typeof value === "string" &&
        /[^a-zA-Z\s]/.test(value)
      ) {
        errors[
          field.name
        ] = `${field.label} can only contain letters and spaces`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field: FieldConfig, value: string | boolean) => {
    const { name, type } = field;

    if (type === "checkbox") {
      const boolValue = value === true;
      setFormData({ ...formData, [name]: boolValue });

      if (onChange) onChange(field, boolValue);
      if (formErrors[name]) setFormErrors({ ...formErrors, [name]: "" });
      return;
    }

    if (typeof value !== "string") return;

    let newValue = value;

    if (type === "number") {
      if (field.decimalPlaces) {
        const decimalRegex = new RegExp(
          `^\\d*\\.?\\d{0,${field.decimalPlaces}}$`
        );
        if (!decimalRegex.test(value)) return;
      } else {
        newValue = value.replace(/[^0-9]/g, "");
      }
    }

    if (name === "mobile" || name === "phoneNumber") {
      let digitsOnly = value.replace(/[^0-9]/g, "");

      if (digitsOnly.length > (formData[name] as string).length + 1) {
        digitsOnly = digitsOnly.slice(-10);
      } else if (digitsOnly.length > 10) {
        digitsOnly = digitsOnly.substring(0, 10);
      }

      newValue = digitsOnly;
    }

    if (name === "firstName" || name === "lastName") {
      newValue = value.replace(/[^a-zA-Z\s]/g, "");
    }

    setFormData({ ...formData, [name]: newValue });

    if (onChange) onChange(field, newValue);
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: "" });
  };

  const handleFormSubmit = () => {
    if (validate()) {
      onSubmit?.({
        ...formData,
        password: mode === "edit" ? undefined : formData.password,
      });
    }
  };

  return (
    <Surface
      style={[styles.form, { backgroundColor: theme.colors.white }]}
      elevation={1}
    >
      <View style={styles.fieldsRowWrapper}>
        {fields.map((field, index) => (
          <View
            key={field.name}
            style={[
              styles.inputWrapper,
              field.name === "address" ||
              field.type === "textarea" ||
              field.fullWidth
                ? styles.fullWidth
                : index % 2 === 0
                ? { marginRight: "4%" }
                : { marginRight: 0 },
            ]}
          >
            {field.type === "checkbox" ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: -8,
                  marginBottom: !isWeb || isMobileWeb ? 8 : 0,
                }}
              >
                <Checkbox
                  status={
                    formData[field.name] === true ? "checked" : "unchecked"
                  }
                  onPress={() =>
                    handleChange(field, !(formData[field.name] === true))
                  }
                  disabled={field.disabled}
                />
                <Text style={{ fontSize: 15 }}>
                  {field.label}
                  {field.required && (
                    <Text style={{ color: colors.error }}> *</Text>
                  )}
                </Text>

                {formErrors[field.name] && (
                  <HelperText
                    type="error"
                    visible={true}
                    style={{ paddingLeft: 0 }}
                  >
                    {formErrors[field.name]}
                  </HelperText>
                )}
              </View>
            ) : field.type === "dropdown" ? (
              <>
                <FixedLabel label={field.label} required={field.required} />
                <FormDropdown
                  placeholder={field.placeholder}
                  value={formData[field.name] as string}
                  options={
                    Array.isArray(field.options)
                      ? typeof (field.options as any[])[0] === "string"
                        ? (field.options as string[]).map((opt) => ({
                            label: opt,
                            value: opt,
                          }))
                        : (field.options as { label: string; value: string }[])
                      : []
                  }
                  disabled={field.disabled}
                  error={formErrors[field.name]}
                  onSelect={(val) => handleChange(field, val)}
                />
              </>
            ) : (
              <>
                <FixedLabel label={field.label} required={field.required} />
                <TextInput
                  placeholder={field.placeholder}
                  placeholderTextColor={theme.colors.placeholder}
                  value={formData[field.name] as string}
                  onChangeText={(text) => handleChange(field, text)}
                  mode="outlined"
                  secureTextEntry={field.type === "password" && !showPassword}
                  keyboardType={
                    field.type === "email"
                      ? "email-address"
                      : field.decimalPlaces
                      ? Platform.OS === "web"
                        ? "default"
                        : "decimal-pad"
                      : field.type === "number"
                      ? "number-pad"
                      : "default"
                  }
                  autoComplete={
                    field.name === "email"
                      ? "email"
                      : field.name === "password"
                      ? "new-password"
                      : field.name === "phoneNumber" || field.name === "mobile"
                      ? "tel"
                      : "off"
                  }
                  textContentType={
                    field.name === "email"
                      ? "emailAddress"
                      : field.name === "password"
                      ? "password"
                      : field.name === "phoneNumber" || field.name === "mobile"
                      ? "telephoneNumber"
                      : "none"
                  }
                  multiline={field.type === "textarea"}
                  disabled={field.disabled}
                  numberOfLines={field.type === "textarea" ? 4 : 1}
                  style={[
                    {
                      fontSize: isWeb ? 15 : 14,
                      backgroundColor: theme.colors.white,
                      height: 44,
                    },
                    field.type === "textarea" && { height: 100 },
                  ]}
                  right={
                    field.type === "password" ? (
                      <TextInput.Icon
                        icon={showPassword ? "eye" : "eye-off"}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    ) : undefined
                  }
                  error={!!formErrors[field.name]}
                />

                <HelperText
                  type="error"
                  visible={!!formErrors[field.name]}
                  style={{ paddingLeft: 0 }}
                >
                  {formErrors[field.name]}
                </HelperText>
              </>
            )}
          </View>
        ))}
      </View>

      {children && <View style={styles.dynamicContent}>{children}</View>}

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={onCancel} style={styles.resetBtn}>
          {t("cancel")}
        </Button>
        <Button
          mode="contained"
          disabled={formSubmitLoading}
          loading={formSubmitLoading}
          onPress={handleFormSubmit}
          style={styles.submitBtn}
        >
          {mode === "edit" ? t("update") : t("create")}
        </Button>
      </View>
    </Surface>
  );
}

const createStyles = (
  theme: AppTheme,
  platform: { isWeb: boolean; isMobileWeb: boolean }
) =>
  StyleSheet.create({
    form: {
      padding: 16,
      borderRadius: 8,
      marginBottom: 20,
    },
    fieldsRowWrapper: {
      flexDirection: platform.isWeb && !platform.isMobileWeb ? "row" : "column",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    inputWrapper: {
      width: platform.isWeb && !platform.isMobileWeb ? "48%" : "100%",
      marginBottom: platform.isWeb && !platform.isMobileWeb ? 8 : 0,
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 12,
    },
    submitBtn: {
      flex: 1,
      borderRadius: 6,
    },
    resetBtn: {
      flex: 1,
      borderRadius: 6,
      borderColor: theme.colors.borderGray,
    },
    fullWidth: {
      width: "100%",
    },
    dynamicContent: {
      marginBottom: 12,
    },
  });
