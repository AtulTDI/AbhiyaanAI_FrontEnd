import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  LayoutRectangle,
  Dimensions,
} from "react-native";
import { Portal, TextInput, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { AppTheme } from "../theme";

/* ================= TYPES ================= */

type Option = {
  label: string;
  value: string;
  colorCode?: string;
};

type Props = {
  placeholder?: string;
  value: string;
  options: Option[];
  disabled?: boolean;
  error?: string;
  height?: number;
  onSelect: (val: string) => void;
};

/* ================= CONSTANTS ================= */

const SCREEN_HEIGHT = Dimensions.get("window").height;
const MENU_MAX_HEIGHT = 280;
const MENU_OFFSET = 6;

/* ================= COMPONENT ================= */

export default function FormDropdown({
  placeholder,
  value,
  options,
  disabled,
  error,
  height = 48,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = useMemo(() => createStyles(theme, height), [theme, height]);

  const anchorRef = useRef<View>(null);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [anchorLayout, setAnchorLayout] = useState<LayoutRectangle | null>(
    null
  );
  const [openUpwards, setOpenUpwards] = useState(false);

  /* ================= DERIVED ================= */

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [value, options]
  );

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((o) =>
      o.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, options]);

  /* ================= HANDLERS ================= */

  const openMenu = () => {
    if (disabled) return;

    anchorRef.current?.measureInWindow((x, y, width, h) => {
      const spaceBelow = SCREEN_HEIGHT - (y + h);
      const spaceAbove = y;

      const shouldOpenUpwards =
        spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow;

      setOpenUpwards(shouldOpenUpwards);
      setAnchorLayout({ x, y, width, height: h });
      setOpen(true);
    });
  };

  const closeMenu = () => {
    setOpen(false);
    setSearch("");
  };

  /* ================= RENDER ================= */

  return (
    <>
      {/* ================= INPUT ================= */}
      <Pressable ref={anchorRef} onPress={openMenu}>
        <TextInput
          pointerEvents="none"
          mode="outlined"
          value={selectedOption?.label || ""}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          editable={false}
          error={!!error}
          style={styles.input}
          outlineStyle={styles.outline}
          right={
            value ? (
              <TextInput.Icon icon="close" onPress={() => onSelect("")} />
            ) : (
              <TextInput.Icon icon={openUpwards ? "menu-up" : "menu-down"} />
            )
          }
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
      </Pressable>

      {/* ================= MENU ================= */}
      {open && anchorLayout && (
        <Portal>
          <Pressable style={styles.backdrop} onPress={closeMenu} />

          <View
            style={[
              styles.menu,
              {
                left: anchorLayout.x,
                width: anchorLayout.width,
                top: openUpwards
                  ? undefined
                  : anchorLayout.y + anchorLayout.height + MENU_OFFSET,
                bottom: openUpwards
                  ? SCREEN_HEIGHT - anchorLayout.y + MENU_OFFSET
                  : undefined,
              },
            ]}
          >
            {/* Search */}
            <TextInput
              mode="outlined"
              placeholder={t("search")}
              placeholderTextColor={theme.colors.placeholder}
              value={search}
              onChangeText={setSearch}
              style={styles.search}
              outlineStyle={styles.searchOutline}
              autoFocus={Platform.OS === "web"}
            />

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <Pressable
                    style={({ hovered }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      hovered && styles.optionHover,
                    ]}
                    onPress={() => {
                      onSelect(item.value);
                      closeMenu();
                    }}
                  >
                    {item.colorCode && (
                      <View
                        style={[
                          styles.colorDot,
                          { backgroundColor: item.colorCode },
                        ]}
                      />
                    )}
                    <Text style={styles.optionText}>{item.label}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </Portal>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}
    </>
  );
}

/* ================= STYLES ================= */

const createStyles = (theme: AppTheme, height: number) =>
  StyleSheet.create({
    /* INPUT */
    input: {
      fontSize: 14,
      height: 44,
      backgroundColor: theme.colors.white,
    },

    outline: {
      borderRadius: 10,
    },

    /* BACKDROP */
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },

    /* MENU */
    menu: {
      position: "absolute",
      maxHeight: MENU_MAX_HEIGHT,
      backgroundColor: theme.colors.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderGray,
      elevation: 12,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
    },

    /* SEARCH */
    search: {
      margin: 10,
      height: 40,
      backgroundColor: theme.colors.white,
    },

    searchOutline: {
      borderRadius: 8,
    },

    /* LIST */
    option: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 11,
      gap: 10,
    },

    optionHover: {
      backgroundColor: theme.colors.lightGray,
      borderRadius: 10,
    },

    optionSelected: {
      backgroundColor: theme.colors.primary + "14",
    },

    optionText: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.onSurface,
    },

    divider: {
      height: 1,
      backgroundColor: theme.colors.lightGray,
      marginLeft: 16,
    },

    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },

    /* ERROR */
    error: {
      fontSize: 12,
      color: theme.colors.error,
      marginTop: 4,
      paddingLeft: 4,
    },
  });
