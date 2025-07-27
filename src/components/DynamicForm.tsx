import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
  TextInput,
  HelperText,
  Button,
  Surface,
  useTheme,
} from "react-native-paper";
import FormDropdown from "./FormDropdown";
import { FieldConfig } from "../types";
import { AppTheme } from "../theme";

type Props = {
  fields: FieldConfig[];
  initialValues: Record<string, string>;
  mode: "create" | "edit";
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
};

export default function DynamicForm({
  fields,
  initialValues,
  mode,
  onSubmit,
  onCancel,
}: Props) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);

  const [formData, setFormData] = useState(initialValues);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setFormData(initialValues);
    setFormErrors({});
  }, [initialValues]);

  const validate = () => {
    const errors: Record<string, string> = {};

    fields.forEach((field) => {
      const value =
        typeof formData[field.name] === "string"
          ? formData[field.name].trim()
          : formData[field.name];

      if (field.required && !value) {
        errors[field.name] = `${field.label} is required.`;
      } else if (
        field.type === "email" &&
        value &&
        !/^\S+@\S+\.\S+$/.test(value)
      ) {
        errors[field.name] = "Invalid email format.";
      } else if (field.type === "number" && value && !/^\d+$/.test(value)) {
        errors[field.name] = `${field.label} must be a number.`;
      } else if (field.name === "password" && value && value.length < 6) {
        errors[field.name] = "Password must be at least 6 characters.";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (name: string, type: string, value: string) => {
    let newValue = value;

    if (type === "number") {
      newValue = value.replace(/[^0-9]/g, "");
    }

    if (name === "mobile" || name === "phoneNumber") {
      newValue = value.replace(/[^0-9]/g, "").slice(0, 10);
    }

    if (name === "firstName" || name === "lastName") {
      newValue = value.replace(/[^a-zA-Z\s]/g, "");
    }

    setFormData({ ...formData, [name]: newValue });

    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const handleFormSubmit = () => {
    if (validate()) {
      onSubmit(formData);
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
                label={field.label}
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
                error={formErrors[field.name]}
                onSelect={(val) => handleChange(field.name, field.type, val)}
              />
            ) : (
              <>
                <TextInput
                  label={field.label}
                  value={formData[field.name]}
                  onChangeText={(text) =>
                    handleChange(field.name, field.type, text)
                  }
                  mode="outlined"
                  secureTextEntry={field.type === "password" && !showPassword}
                  keyboardType={
                    field.type === "email"
                      ? "email-address"
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
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    inputWrapper: {
      width: "48%",
      marginBottom: 12,
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
