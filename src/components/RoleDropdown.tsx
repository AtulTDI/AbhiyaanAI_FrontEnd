import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { TextInput, List, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { Dropdown } from "react-native-paper-dropdown";
import { AppTheme } from "../theme";

type Props = {
  selectedRole: string;
  onSelect: (role: string) => void;
};

export default function RoleDropdown({ selectedRole, onSelect }: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;

  const roleOptions = [
    { label: "User", value: "User" },
    { label: "Admin", value: "Admin" },
  ];

  return (
    <View style={styles.container}>
      <Dropdown
        label="Role"
        placeholder="Select Role"
        options={roleOptions}
        value={selectedRole}
        onSelect={(val) => onSelect(val)}
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
              {
                backgroundColor: "white",
              },
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
      />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
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
  });
