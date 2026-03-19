import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  LayoutRectangle,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';
import { Portal, TextInput, useTheme } from 'react-native-paper';

import { useTranslation } from 'react-i18next';

import { usePlatformInfo } from '../hooks/usePlatformInfo';
import { AppTheme } from '../theme';

/* ================= TYPES ================= */

type Option = {
  label: string;
  value: string;
  colorCode?: string;
  itemStyle?: StyleProp<ViewStyle>;
};

type Props = {
  placeholder?: string;
  value: string;
  options: Option[];
  disabled?: boolean;
  error?: string;
  height?: number;
  noMargin?: boolean;
  customOutline?: boolean;
  showSearch?: boolean;
  showClearIcon?: boolean;
  onSelect: (val: string) => void;
};

/* ================= CONSTANTS ================= */

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
  customOutline,
  noMargin,
  showSearch = true,
  showClearIcon = true
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = useMemo(() => createStyles(theme, height), [theme, height]);
  const { isWeb, isAndroid, isIOS } = usePlatformInfo();

  const anchorRef = useRef<View>(null);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [anchorLayout, setAnchorLayout] = useState<LayoutRectangle | null>(null);
  const [openUpwards, setOpenUpwards] = useState(false);

  const windowHeight = Dimensions.get('window').height;

  /* ================= DERIVED ================= */

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [value, options]
  );

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  }, [search, options]);

  /* ================= HANDLERS ================= */

  const openMenu = () => {
    if (disabled || !anchorRef.current) return;

    anchorRef.current.measureInWindow((x, y, width, h) => {
      const spaceBelow = windowHeight - (y + h);
      const spaceAbove = y;
      const shouldOpenUpwards = spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow;

      setOpenUpwards(shouldOpenUpwards);
      setAnchorLayout({ x, y, width, height: h });
      setOpen(true);
    });
  };

  const closeMenu = () => {
    setOpen(false);
    setSearch('');
  };

  /* ================= RENDER ================= */

  return (
    <>
      {/* ================= INPUT ================= */}
      <View
        style={[(isAndroid || isIOS) && !noMargin && styles.inputWrapperNativeMargin]}
      >
        <View
          style={[
            styles.colorBackground,
            selectedOption?.colorCode
              ? { backgroundColor: selectedOption.colorCode + '10' }
              : styles.colorBackgroundDefault
          ]}
        >
          <Pressable ref={anchorRef} onPress={openMenu}>
            <TextInput
              pointerEvents="box-only"
              mode="outlined"
              value={selectedOption?.label || ''}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.placeholder}
              editable={false}
              disabled={disabled}
              error={!!error}
              style={[styles.input, isWeb ? styles.inputFontWeb : styles.inputFontNative]}
              outlineStyle={styles.outline}
              outlineColor={
                selectedOption?.colorCode
                  ? selectedOption.colorCode
                  : customOutline
                    ? theme.colors.subtleBorder
                    : undefined
              }
              activeOutlineColor={theme.colors.primary}
              right={
                value && showClearIcon ? (
                  <TextInput.Icon icon="close" onPress={() => onSelect('')} />
                ) : (
                  <TextInput.Icon
                    icon={openUpwards ? 'menu-up' : 'menu-down'}
                    onPress={openMenu}
                  />
                )
              }
              contentStyle={
                selectedOption?.colorCode
                  ? styles.contentWithColor
                  : styles.contentWithoutColor
              }
              left={
                selectedOption?.colorCode ? (
                  <TextInput.Icon
                    icon="square"
                    color={selectedOption.colorCode}
                    size={14}
                  />
                ) : undefined
              }
            />
          </Pressable>
        </View>
      </View>

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
                  ? windowHeight - anchorLayout.y + MENU_OFFSET
                  : undefined
              }
            ]}
          >
            {showSearch && (
              <TextInput
                mode="outlined"
                placeholder={t('search')}
                placeholderTextColor={theme.colors.placeholder}
                value={search}
                onChangeText={setSearch}
                style={styles.search}
                outlineStyle={styles.searchOutline}
                autoFocus={Platform.OS === 'web'}
              />
            )}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              renderItem={({ item }) => {
                const selected = item.value === value;

                return (
                  <Pressable
                    style={(state) => {
                      const { hovered } = state as typeof state & {
                        hovered?: boolean;
                      };
                      return [
                        styles.option,
                        hovered && styles.optionHover,
                        selected && [
                          item.colorCode
                            ? { backgroundColor: item.colorCode + '15' }
                            : { backgroundColor: theme.colors.primary + '14' }
                        ],
                        item.itemStyle
                      ];
                    }}
                    onPress={() => {
                      onSelect(item.value);
                      closeMenu();
                    }}
                  >
                    {item.colorCode && (
                      <View
                        style={[styles.colorSwatch, { backgroundColor: item.colorCode }]}
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
    inputWrapperNativeMargin: {
      marginBottom: 25
    },
    colorBackground: {
      borderRadius: 8
    },
    colorBackgroundDefault: {
      backgroundColor: theme.colors.white
    },
    input: {
      height: height ?? 44,
      backgroundColor: 'transparent'
    },
    inputFontWeb: {
      fontSize: 15
    },
    inputFontNative: {
      fontSize: 14
    },
    outline: {
      borderRadius: 8
    },
    contentWithColor: {
      marginLeft: 45
    },
    contentWithoutColor: {
      marginLeft: 0
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject
    },
    menu: {
      position: 'absolute',
      zIndex: 1000,
      maxHeight: MENU_MAX_HEIGHT,
      backgroundColor: theme.colors.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderGray,
      elevation: 12,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 }
    },
    search: {
      margin: 10,
      height: 40,
      backgroundColor: theme.colors.white
    },
    searchOutline: {
      borderRadius: 8
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 11,
      gap: 10
    },
    optionHover: {
      backgroundColor: theme.colors.lightGray + '90',
      borderRadius: 10
    },
    optionText: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.onSurface
    },
    colorSwatch: {
      width: 18,
      height: 8,
      borderRadius: 4,
      marginRight: 8
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.lightGray,
      marginLeft: 16
    },
    error: {
      fontSize: 12,
      color: theme.colors.error,
      marginTop: 4,
      paddingLeft: 4
    }
  });
