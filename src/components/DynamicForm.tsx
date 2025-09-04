import React, { useState, useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import {
  TextInput,
  HelperText,
  Button,
  Surface,
  useTheme,
  Text,
} from "react-native-paper";
import FormDropdown from "./FormDropdown";
import { FieldConfig } from "../types";
import { AppTheme } from "../theme";

type Props = {
  fields: FieldConfig[];
  initialValues: Record<string, string>;
  mode: "create" | "edit";
  formSubmitLoading?: boolean;
  onChange?: (data: FieldConfig, value: string) => void;
  onSubmit?: (data: Record<string, string>) => void;
  onCancel?: () => void;
};

export default function DynamicForm({
  fields,
  initialValues,
  mode,
  formSubmitLoading,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const styles = createStyles(theme);

  const [formData, setFormData] = useState(initialValues);
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
      const numericValue = parseFloat(value);

      if (field.required && !value) {
        errors[field.name] = `${field.label} is required`;
        return;
      }

      if (field.type === "email" && value && !/^\S+@\S+\.\S+$/.test(value)) {
        errors[field.name] = "Invalid email format";
      }

      if (field.type === "password" && mode === "create" && value) {
        const errorsList: string[] = [];

        if (value.length < 6) {
          errorsList.push("Passwords must be at least 6 characters");
        }
        
        if (errorsList.length > 0) {
          errors[field.name] = errorsList.join("\n");
        }
      }

      if (field.validationRules && Array.isArray(field.validationRules)) {
        const failedRules = field.validationRules
          .filter((rule) => !rule.test(value || ""))
          .map((rule) => rule.message);

        if (failedRules.length > 0) {
          errors[field.name] = failedRules.join("\n");
        }
      }

      if (field.type === "number") {
        if (value && isNaN(numericValue)) {
          errors[field.name] = `${field.label} must be a valid number`;
        } else if (
          value &&
          field.decimalPlaces != null &&
          !new RegExp(`^\\d+(\\.\\d{1,${field.decimalPlaces}})?$`).test(value)
        ) {
          errors[
            field.name
          ] = `Only up to ${field.decimalPlaces} decimal place(s) allowed`;
        } else if (
          value &&
          field.decimalPlaces == null &&
          value.toString().includes(".")
        ) {
          errors[field.name] = `${field.label} must be a whole number`;
        }

        if (
          value &&
          !isNaN(numericValue) &&
          field.min != null &&
          numericValue < field.min
        ) {
          errors[field.name] = `${field.label} must be ≥ ${field.min}`;
        }

        if (
          value &&
          !isNaN(numericValue) &&
          field.max != null &&
          numericValue > field.max
        ) {
          errors[field.name] = `${field.label} must be ≤ ${field.max}`;
        }
      }

      if ((field.name === "mobile" || field.name === "phoneNumber") && value) {
        if (!/^\d{10}$/.test(value)) {
          errors[field.name] = `${field.label} must be exactly 10 digits`;
        }
      }

      if (
        (field.name === "firstName" || field.name === "lastName") &&
        value &&
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

  const handleChange = (field: FieldConfig, value: string) => {
    const { name, type } = field;
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
      newValue = value.replace(/[^0-9]/g, "").slice(0, 10);
    }

    if (name === "firstName" || name === "lastName") {
      newValue = value.replace(/[^a-zA-Z\s]/g, "");
    }

    setFormData({ ...formData, [name]: newValue });

    if (onChange) {
      onChange(field, newValue);
    }

    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const handleFormSubmit = () => {
    if (validate()) {
      onSubmit({
        ...formData,
        password: mode === "edit" ? undefined : formData?.password,
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
              field.name === "address" || field.type === "textarea"
                ? styles.fullWidth
                : index % 2 === 0
                ? { marginRight: "4%" }
                : { marginRight: 0 },
            ]}
          >
            {field.type === "dropdown" ? (
              <FormDropdown
                label={
                  <Text>
                    {field.label}
                    {field.required && (
                      <Text style={{ color: colors.error }}> *</Text>
                    )}
                  </Text>
                }
                value={formData[field.name]}
                options={
                  Array.isArray(field.options)
                    ? typeof (field.options as unknown[])[0] === "string"
                      ? (field.options as string[]).map((opt) => ({
                          label: opt,
                          value: opt,
                        }))
                      : (field.options as { label: string; value: string }[])
                    : []
                }
                disabled={field?.disabled}
                error={formErrors[field.name]}
                onSelect={(val) => handleChange(field, val)}
              />
            ) : (
              <>
                <TextInput
                  label={
                    <Text>
                      {field.label}
                      {field.required && (
                        <Text style={{ color: colors.error }}> *</Text>
                      )}
                    </Text>
                  }
                  value={formData[field.name]}
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
                  disabled={field?.disabled}
                  numberOfLines={field.type === "textarea" ? 4 : 1}
                  style={[
                    { backgroundColor: theme.colors.white },
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

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={onCancel} style={styles.resetBtn}>
          Cancel
        </Button>
        <Button
          mode="contained"
          disabled={formSubmitLoading}
          loading={formSubmitLoading}
          onPress={handleFormSubmit}
          style={styles.submitBtn}
        >
          {mode === "edit" ? "Update" : "Create"}
        </Button>
      </View>
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    form: {
      padding: 16,
      borderRadius: 8,
      marginBottom: 20,
    },
    fieldsRowWrapper: {
      flexDirection: Platform.OS === "web" ? "row" : "column",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    inputWrapper: {
      width: Platform.OS === "web" ? "48%" : "100%",
      marginBottom: Platform.OS === "web" ? 8 : 0,
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
  });
