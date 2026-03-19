import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { AppTheme } from '../theme';

type Tab = {
  key: string;
  label: string;
  badge?: number;
};

type Props = {
  value: string;
  onChange: (key: string) => void;
  tabs: Tab[];
};

export default function Tabs({ value, onChange, tabs }: Props) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.key === value;

        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)}>
            <View style={styles.tabLabelRow}>
              <Text style={[styles.label, active && styles.activeLabel]}>
                {tab.label}
              </Text>

              {typeof tab.badge === 'number' && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: active
                        ? theme.colors.primary
                        : theme.colors.softGray
                    }
                  ]}
                >
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>

            {active && (
              <View
                style={[styles.underline, { backgroundColor: theme.colors.primary }]}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: 28,
      marginBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#eaeaea'
    },

    tabLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6
    },

    label: {
      fontSize: 15,
      color: '#888'
    },

    activeLabel: {
      color: theme.colors.primary,
      fontWeight: '700'
    },

    underline: {
      height: 2,
      borderRadius: 2,
      marginTop: 6
    },

    badge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center'
    },

    badgeText: {
      fontSize: 11,
      color: '#fff',
      fontWeight: '600'
    }
  });
