import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { TextInput, useTheme, List } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import { AppTheme } from "../theme";

type Option = { label: string; value: string };

type Props = {
  label: string;
  placeholder?: string;
  value: string;
  options: Option[];
  error?: string;
  onSelect: (val: string) => void;
};

export default function FormDropdown({
  label,
  placeholder,
  value,
  options,
  error,
  onSelect,
}: Props) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;

  return (
    <View style={styles.container}>
      <Dropdown
        label={label}
        placeholder={placeholder || `Select ${label}`}
        options={options}
        value={value}
        onSelect={onSelect}
        mode="outlined"
        menuContentStyle={styles.menuContent}
        CustomDropdownInput={(props) => (
          <TextInput
            {...props}
            style={[styles.input, { backgroundColor: theme.colors.white }]}
            theme={{ roundness: 8 }}
            right={props.rightIcon}
            value={props.selectedLabel}
            disabled={props.disabled}
            error={props.error}
            mode={props.mode}
            label={props.label}
            placeholder={props.placeholder}
          />
        )}
        CustomDropdownItem={({
          option,
          value,
          onSelect,
          toggleMenu,
          isLast,
        }) => (
          <List.Item
            title={option.label}
            titleStyle={styles.optionText}
            style={[
              styles.optionItem,
              { backgroundColor: "white" },
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
                  Clear
                </Text>
              )}
            </View>
          ) : null
        }
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginBottom: 12,
    },
    input: {
      fontSize: 16,
    },
    optionText: {
      fontSize: 14,
    },
    optionItem: {
      paddingVertical: 8,
      paddingHorizontal: 12,
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
      color: theme.colors.deepRed,
      fontSize: 12,
      marginTop: 4,
      paddingLeft: 4,
    },
  });
