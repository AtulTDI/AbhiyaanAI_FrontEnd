import React from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { TextInput, useTheme, List } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { Dropdown } from "react-native-paper-dropdown";
import { AppTheme } from "../theme";

type Option = {
  label: string;
  value: string;
  colorCode?: string;
};

type Props = {
  label: any;
  placeholder?: string;
  value: string;
  options: Option[];
  disabled?: boolean;
  noMargin?: boolean;
  error?: string;
  customStyle?: boolean;
  onSelect: (val: string) => void;
};

function FormDropdown({
  label,
  placeholder,
  value,
  options,
  disabled,
  noMargin,
  error,
  onSelect,
  customStyle,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;

  const selectedOption = options.find((o) => o.value === value);

  return (
    <View
      style={{ marginBottom: noMargin ? 0 : Platform.OS === "web" ? 12 : 20 }}
    >
      <Dropdown
        label={label}
        placeholder={placeholder || `Select ${label}`}
        options={options}
        value={value}
        onSelect={onSelect}
        mode="outlined"
        menuContentStyle={styles.menuContent}
        disabled={disabled}
        CustomDropdownInput={(props) => (
          <TextInput
            {...props}
            mode="outlined"
            dense
            style={[
              {
                backgroundColor: colors.white,
                height: customStyle ? 32 : 48
              },
            ]}
            contentStyle={{
              paddingVertical: 6,
            }}
            theme={{
              roundness: 8,
              colors: {
                primary: colors.primary,
                outline: error ? colors.error : colors.outline,
              },
            }}
            right={props.rightIcon}
            value={props.selectedLabel}
            disabled={props.disabled}
            error={!!error || props.error}
            label={props.label}
            placeholder={props.placeholder}
            left={
              selectedOption?.colorCode ? (
                <TextInput.Icon
                  icon={() => (
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: selectedOption.colorCode },
                      ]}
                    />
                  )}
                />
              ) : undefined
            }
          />
        )}
        CustomDropdownItem={({ option, onSelect, toggleMenu, isLast }) => (
          <List.Item
            title={() => (
              <View style={styles.optionRow}>
                {option.colorCode && (
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: option.colorCode },
                    ]}
                  />
                )}
                <Text style={styles.optionText}>{option.label}</Text>
              </View>
            )}
            style={[
              styles.optionItem,
              { backgroundColor: "white", paddingLeft: 0 },
              !isLast && {
                borderBottomWidth: 1,
                borderColor: colors.lightGray,
              },
            ]}
            rippleColor={"rgba(0,0,0,0.04)"}
            onPress={() => {
              onSelect?.(option.value);
              toggleMenu();
            }}
          />
        )}
        CustomMenuHeader={({ label, value, resetMenu }) =>
          label ? (
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>{label}</Text>
              {value && (
                <Text onPress={resetMenu} style={styles.clearText}>
                  {t("clear")}
                </Text>
              )}
            </View>
          ) : null
        }
        error={error?.length > 0}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default React.memo(FormDropdown, (prev, next) => {
  return (
    prev.label === next.label &&
    prev.value === next.value &&
    prev.disabled === next.disabled &&
    prev.noMargin === next.noMargin &&
    prev.error === next.error &&
    prev.onSelect === next.onSelect &&
    JSON.stringify(prev.options) === JSON.stringify(next.options)
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    input: {
      fontSize: 16,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    optionText: {
      fontSize: 14,
    },
    optionItem: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    headerContainer: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerText: {
      fontSize: 14,
      fontWeight: "bold",
    },
    clearText: {
      fontSize: 13,
      color: theme.colors.warning,
    },
    menuContent: {
      paddingVertical: 0,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: 4,
      paddingLeft: 4,
    },
  });
